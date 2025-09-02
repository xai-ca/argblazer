import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as yaml from 'js-yaml';

const execAsync = promisify(exec);

// Track active report panels and their associated YAML file URIs
const activeReportPanels = new Map<string, vscode.WebviewPanel>();

export function activate(context: vscode.ExtensionContext) {
    console.log('ArgFrame extension is now active!');

    // Set up file system watcher for YAML files
    const yamlWatcher = vscode.workspace.createFileSystemWatcher('**/*.{yaml,yml}');
    
    // Watch for file changes (save events)
    yamlWatcher.onDidChange(async (uri) => {
        console.log(`YAML file changed: ${uri.fsPath}`);
        await handleYamlFileChange(uri, context);
    });

    const generateReportCommand = vscode.commands.registerCommand('argFrame.generateReport', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = activeEditor.document;
        if (document.languageId !== 'yaml') {
            vscode.window.showErrorMessage('Please open a YAML file');
            return;
        }

        const fileUri = document.uri;
        const fileKey = fileUri.toString();

        try {
            // Get the YAML content
            const yamlContent = document.getText();
            
            // Validate YAML
            try {
                yaml.load(yamlContent);
            } catch (error) {
                vscode.window.showErrorMessage('Invalid YAML format');
                return;
            }

            // Check if we already have a panel for this file
            let panel = activeReportPanels.get(fileKey);
            let isNewPanel = false;

            if (!panel) {
                // Create new panel
                panel = vscode.window.createWebviewPanel(
                    'afReport',
                    `ArgFrame Report - ${path.basename(fileUri.fsPath)}`,
                    vscode.ViewColumn.Beside,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    }
                );
                
                // Track the panel
                activeReportPanels.set(fileKey, panel);
                isNewPanel = true;

                // Set up disposal tracking
                panel.onDidDispose(() => {
                    activeReportPanels.delete(fileKey);
                    console.log(`Panel disposed for: ${fileKey}`);
                });
            }

            // Generate and update the report
            await generateAndUpdateReport(yamlContent, panel, context, isNewPanel);

        } catch (error: any) {
            console.error('Outer error details:', error);
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    const refreshPythonCommand = vscode.commands.registerCommand('argFrame.refreshPythonInterpreter', async () => {
        vscode.window.showInformationMessage('Python interpreter configuration will be re-read on next report generation.');
    });

    context.subscriptions.push(generateReportCommand, refreshPythonCommand, yamlWatcher);
}

async function handleYamlFileChange(uri: vscode.Uri, context: vscode.ExtensionContext) {
    const fileKey = uri.toString();
    const panel = activeReportPanels.get(fileKey);
    
    if (!panel) {
        // No active panel for this file, nothing to update
        return;
    }

    try {
        // Read the updated file content
        const document = await vscode.workspace.openTextDocument(uri);
        const yamlContent = document.getText();
        
        // Validate YAML
        try {
            yaml.load(yamlContent);
        } catch (error) {
            console.log(`Invalid YAML in ${uri.fsPath}, skipping auto-update`);
            return;
        }

        console.log(`Auto-updating report for: ${uri.fsPath}`);
        
        // Update the existing panel with new content
        await generateAndUpdateReport(yamlContent, panel, context, false);
        
        // Bring the corresponding panel to the front
        try {
            panel.reveal(panel.viewColumn);
        } catch (revealError) {
            console.warn(`Failed to reveal panel for ${uri.fsPath}:`, revealError);
        }

        // Show a brief notification that the report was updated
        vscode.window.showInformationMessage(`Report updated for ${path.basename(uri.fsPath)}`, { modal: false });

    } catch (error: any) {
        console.error(`Error auto-updating report for ${uri.fsPath}:`, error);
        vscode.window.showWarningMessage(`Failed to auto-update report for ${path.basename(uri.fsPath)}`);
    }
}

async function generateAndUpdateReport(yamlContent: string, panel: vscode.WebviewPanel, context: vscode.ExtensionContext, showProgress: boolean = true) {
    const updateReport = async () => {
        try {
            // Get Python interpreter path from configuration
            const config = vscode.workspace.getConfiguration('argFrame');
            const pythonPath = config.get<string>('pythonInterpreter');
            
            if (!pythonPath || pythonPath.trim() === '') {
                vscode.window.showErrorMessage('Python interpreter path not configured. Please set it in settings.', 'Open Settings').then(selection => {
                    if (selection === 'Open Settings') {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'argFrame.pythonInterpreter');
                    }
                });
                return;
            }
            
            // Convert YAML to JSON for Python processing
            const yamlData = yaml.load(yamlContent) as any;
            
            // Convert arguments from YAML object format to JSON array format
            if (yamlData.arguments && typeof yamlData.arguments === 'object' && !Array.isArray(yamlData.arguments)) {
                const argumentsArray = [];
                for (const [key, value] of Object.entries(yamlData.arguments)) {
                    argumentsArray.push({ [key]: value });
                }
                yamlData.arguments = argumentsArray;
            }
            
            const jsonContent = JSON.stringify(yamlData);
            
            // Call the Python package - escape JSON properly for shell
            const escapedJson = jsonContent
                .replace(/\\/g, '\\\\')        // Escape backslashes
                .replace(/'/g, "\\'")          // Escape single quotes  
                .replace(/\n/g, '\\n')         // Escape newlines
                .replace(/\r/g, '\\r')         // Escape carriage returns
                .replace(/\t/g, '\\t');        // Escape tabs
            
            // Get the extension's template file path
            const templatePath = vscode.Uri.joinPath(context.extensionUri, 'src', 'templates').fsPath;

            const tempFile = path.join(os.tmpdir(), `script_${Date.now()}.py`);
            const pythonCode = `
from geist import report
import networkx as nx
import json, os, sys

def generate_report(af4ext, af4graph, exhibit):
    expanded_report = report(
        inputfile=os.path.join(r'${templatePath}', 'af.geist'), 
        isinputpath=True,
        args={
            'af4ext': af4ext,
            'af4graph': af4graph,
            'exhibit': exhibit,
            'tp': r'${templatePath}'
        }
    )
    return expanded_report

def compute_rank(G, root, first, last, isTop=True):
    if not root:
        if (isTop and (not first)) or ((not isTop) and (not last)):
            return {}
        elif isTop and first:
            root = [first]
        elif (not isTop) and last:
            root = [last]
    if len(root) == 1:
        return nx.single_source_shortest_path_length(G, root[0]) if root[0] in G else {}
    else:
        rank = {node: 0 for node in root}
        for node in root:
            shortest_path = nx.single_source_shortest_path_length(G, node) if node in G else {}
            for k, v in shortest_path.items():
                rank[k] = min(rank.get(k, v), v)
        return rank

first = None
top, bottom = [], []

# Read JSON string
json_data = json.loads('''${escapedJson}''')
# process nodes (args) with missing text
for idx in range(len(json_data['arguments'])):
    if type(json_data['arguments'][idx]) == str:
        first = json_data['arguments'][idx] if idx == 0 else first
        json_data['arguments'][idx] = {json_data['arguments'][idx]: ''}
    else:
        for k, v in json_data['arguments'][idx].items():
            first = k if idx == 0 else first
            for item in v:
                if item == 'top':
                    top.append(k)
                elif item == 'bottom':
                    bottom.append(k)
last = list(json_data['arguments'][-1].keys())[0] if first else None

af4ext = ''
edges = []
if 'attacks' in json_data:
    for attack in json_data['attacks']:
        af4ext = af4ext + 'attacks({arg1}, {arg2}).\\n'.format(arg1=attack[0], arg2=attack[1])
        edges.append((attack[0], attack[1]))
if edges:
    # Compute shortest distance as rank
    G = nx.Graph()
    G.add_edges_from(edges)
    json_data['rank_top']=compute_rank(G, top, first, last, isTop=True)
    json_data['rank_bottom']=compute_rank(G, bottom, first, last, isTop=False)

af4graph = json.dumps(json_data)
html_output = generate_report(af4ext, af4graph, json_data['exhibit'] if 'exhibit' in json_data else '[Not provided]')
sys.stdout.write(html_output)
sys.stdout.flush()

# Immediate exit to avoid cleanup crash
if sys.platform == 'win32':
    os._exit(0)  # Skip cleanup entirely on Windows
else:
    sys.exit(0)  # Normal exit on other platforms
            `;
            // Write and execute
            await fs.promises.writeFile(tempFile, pythonCode, 'utf8');
            const pythonCommand = process.platform === 'win32' 
                ? `"${pythonPath}" "${tempFile}"`    // Windows
                : `${pythonPath} "${tempFile}"`;     // macOS/Linux
            
            const { stdout, stderr } = await execAsync(pythonCommand);
            
            console.log('Python stdout:', stdout);
            console.log('Python stderr:', stderr);

            // Cleanup
            await fs.promises.unlink(tempFile);
            
            if (stderr) {
                console.error('Python stderr:', stderr);
                // Only show error if there's no stdout (some warnings might go to stderr)
                if (!stdout) {
                    vscode.window.showErrorMessage(`Python error: ${stderr}`);
                    return;
                }
            }

            // Update the webview content
            panel.webview.html = stdout;
            // For debug
            //panel.webview.html = `<pre>${stdout.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;

        } catch (error: any) {
            console.error('Full error details:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Error stdout:', error.stdout);
            console.error('Error stderr:', error.stderr);
            
            // Show helpful error message based on common issues
            let errorMsg = `Failed to generate report: ${error.message}`;
            if (error.message.includes('ENOENT') || error.message.includes('not found')) {
                errorMsg = 'Python interpreter not found. Please check your Python interpreter path in settings.';
            } else if (error.message.includes('geist')) {
                errorMsg = 'Geist package not found. Please ensure geist is installed in your Python environment.';
            }
            
            vscode.window.showErrorMessage(errorMsg, 'Open Settings').then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'argFrame.pythonInterpreter');
                }
            });
        }
    };

    if (showProgress) {
        // Show progress indicator for manual generation
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating HTML report...",
            cancellable: false
        }, updateReport);
    } else {
        // Update without progress for auto-updates
        await updateReport();
    }
}

export function deactivate() {
    // Clean up all tracked panels
    activeReportPanels.clear();
} 
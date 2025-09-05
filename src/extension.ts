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
// Store HTML content for each panel to enable export
const panelHtmlContent = new Map<string, string>();

export function activate(context: vscode.ExtensionContext) {
    console.log('ArgBlaze extension is now active!');

    // Set up file system watcher for YAML files
    const yamlWatcher = vscode.workspace.createFileSystemWatcher('**/*.{yaml,yml}');
    
    // Watch for file changes (save events)
    yamlWatcher.onDidChange(async (uri) => {
        console.log(`YAML file changed: ${uri.fsPath}`);
        await handleYamlFileChange(uri, context);
    });

    const generateReportCommand = vscode.commands.registerCommand('argBlaze.generateReport', async () => {
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
                    `ArgBlaze Report - ${path.basename(fileUri.fsPath)}`,
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
                    panelHtmlContent.delete(fileKey);
                    console.log(`Panel disposed for: ${fileKey}`);
                });
            } else {
                // Bring existing panel to the front
                panel.reveal(panel.viewColumn);
            }

            // Generate and update the report
            await generateAndUpdateReport(yamlContent, panel, context, isNewPanel);

        } catch (error: any) {
            console.error('Outer error details:', error);
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    const refreshPythonCommand = vscode.commands.registerCommand('argBlaze.refreshPythonInterpreter', async () => {
        vscode.window.showInformationMessage('Python interpreter configuration will be re-read on next report generation.');
    });

    const exportHtmlCommand = vscode.commands.registerCommand('argBlaze.exportHtml', async () => {
        await exportActiveHtml();
    });

    const aboutCommand = vscode.commands.registerCommand('argBlaze.about', async () => {
        const packageJson = require('../package.json');
        const version = packageJson.version;
        const displayName = packageJson.displayName;
        const publisher = packageJson.publisher;
        
        // Get environment information
        const os = require('os');
        const osType = os.type();
        const osRelease = os.release();
        const osArch = os.arch();
        const vscodeVersion = vscode.version;
        const nodeVersion = process.version;
        
        // Get Python version information
        let pythonVersion = 'Not available';
        
        try {
            const config = vscode.workspace.getConfiguration('argBlaze');
            const pythonPath = config.get<string>('pythonInterpreter');
            
            if (pythonPath && pythonPath.trim() !== '') {
                // Get Python version
                const pythonCommand = process.platform === 'win32' 
                    ? `"${pythonPath}" --version`    // Windows
                    : `${pythonPath} --version`;     // macOS/Linux
                
                const { stdout: pythonStdout } = await execAsync(pythonCommand);
                pythonVersion = pythonStdout.trim();
            }
        } catch (error) {
            // If we can't get Python version, keep the default "Not available"
            console.log('Could not retrieve Python version:', error);
        }
        
        const aboutMessage = `${displayName} v${version}+1a5fa01
Publisher: ${publisher}

• ${osType} ${osRelease} (${osArch})
• VS Code ${vscodeVersion}
• Node.js ${nodeVersion}
• ${pythonVersion}`;
        
        vscode.window.showInformationMessage(aboutMessage, { modal: true });
    });

    context.subscriptions.push(generateReportCommand, refreshPythonCommand, exportHtmlCommand, aboutCommand, yamlWatcher);
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
            const config = vscode.workspace.getConfiguration('argBlaze');
            const pythonPath = config.get<string>('pythonInterpreter');
            
            if (!pythonPath || pythonPath.trim() === '') {
                vscode.window.showErrorMessage('Python interpreter path not configured. Please set it in settings.', 'Open Settings').then(selection => {
                    if (selection === 'Open Settings') {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'argBlaze.pythonInterpreter');
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
import json, os, sys, ast

def generate_report(template, af4ext, af4graph=None, exhibit=None):
    expanded_report = report(
        inputfile=os.path.join(r'${templatePath}', template), 
        isinputpath=True,
        args={
            'af4graph': af4graph,
            'af4ext': af4ext,
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

first,hasStep = None, False
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
                if type(item) == dict and 'step' in item:
                    hasStep = True
                if item == 'top':
                    top.append(k)
                elif item == 'bottom':
                    bottom.append(k)
last = list(json_data['arguments'][-1].keys())[0] if first else None

# Handle missing steps
prev_step = 0
step2args = {}
for idx in range(len(json_data['arguments'])):
    for k, v in json_data['arguments'][idx].items():
        if hasStep:
            currStep = False
            for item in v:
                if 'step' in item:
                    prev_step = item['step']
                    currStep = True
            if not currStep:
                v.append({'step': prev_step})
        else:
            v.append({'step': prev_step + 1})
            prev_step = prev_step + 1
        step2args[prev_step] = step2args.get(prev_step, []) + [k] 

step2edges, step2ext = {}, {}
if 'attacks' in json_data:
    for attack in json_data['attacks']:
        prev_args = []
        for step in sorted(step2args.keys()):
            argsInStep = step2args[step]
            attacker, attackee = attack[0], attack[1]
            if (attacker in argsInStep + prev_args) and (attackee in argsInStep + prev_args):
                step2ext[step] = step2ext.get(step, '') + f'attacks({attacker}, {attackee}).\\n'
                step2edges[step] = step2edges.get(step, []) + [(attacker, attackee)]
            prev_args = prev_args + argsInStep

json_data['steps'] = {'rank_top':[], 'rank_bottom': []}
step_extensions = []
for step in sorted(step2ext.keys()):
    # Compute shortest distance as rank
    G = nx.Graph()
    G.add_edges_from(step2edges[step])
    json_data['steps']['rank_top'].append(compute_rank(G, top, first, last, isTop=True))
    json_data['steps']['rank_bottom'].append(compute_rank(G, bottom, first, last, isTop=False))
    # Compute extensions
    extensions = ast.literal_eval('{' + generate_report('ext.geist', step2ext[step]).strip() + '}')
    step_extensions.append(extensions)
af4graph = json.dumps(json_data)
af4ext = json.dumps(step_extensions)
html_output = generate_report('report.geist', af4ext, af4graph, json_data['exhibit'] if 'exhibit' in json_data else '[Not provided]')
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

            // Store the HTML content for export
            const fileKey = Object.keys(Object.fromEntries(activeReportPanels)).find(key => activeReportPanels.get(key) === panel);
            if (fileKey) {
                panelHtmlContent.set(fileKey, stdout);
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
                    vscode.commands.executeCommand('workbench.action.openSettings', 'argBlaze.pythonInterpreter');
                }
            });
        }
    };

    if (showProgress) {
        // Show progress indicator for manual generation
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating an HTML report...",
            cancellable: false
        }, updateReport);
    } else {
        // Update without progress for auto-updates
        await updateReport();
    }
}

async function exportActiveHtml() {
    // Find active panel and its content
    const activePanel = Array.from(activeReportPanels.entries()).find(([_, panel]) => panel.active);
    if (!activePanel) {
        vscode.window.showErrorMessage('No active ArgBlaze report panel found');
        return;
    }
    
    const [fileKey] = activePanel;
    const htmlContent = panelHtmlContent.get(fileKey);
    if (!htmlContent) {
        vscode.window.showErrorMessage('No HTML content available for export');
        return;
    }
    
    // Get filename and show save dialog
    const fileName = path.basename(vscode.Uri.parse(fileKey).fsPath);
    const defaultFileName = fileName.replace(/\.(yaml|yml)$/, '') + '_argBlazeReport.html';
    const downloadsPath = path.join(os.homedir(), 'Downloads', defaultFileName);
    
    const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(downloadsPath),
        filters: { 'HTML Files': ['html'] }
    });
    
    if (saveUri) {
        try {
            await fs.promises.writeFile(saveUri.fsPath, htmlContent, 'utf8');
            vscode.window.showInformationMessage(`HTML report exported to ${saveUri.fsPath}`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to export HTML: ${error.message}`);
        }
    }
}

export function deactivate() {
    // Clean up all tracked panels
    activeReportPanels.clear();
    panelHtmlContent.clear();
} 
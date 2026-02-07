import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as yaml from 'js-yaml';
import { preprocessAndCompute } from './preprocessor';
import { renderHtml } from './htmlRenderer';

// Track active report panels and their associated YAML file URIs
const activeReportPanels = new Map<string, vscode.WebviewPanel>();
// Store HTML content for each panel to enable export
const panelHtmlContent = new Map<string, string>();

export function activate(context: vscode.ExtensionContext) {
    console.log('ArgBlazer extension is now active!');

    // Set up file system watcher for YAML files
    const yamlWatcher = vscode.workspace.createFileSystemWatcher('**/*.{yaml,yml}');

    // Watch for file changes (save events)
    yamlWatcher.onDidChange(async (uri) => {
        console.log(`YAML file changed: ${uri.fsPath}`);
        await handleYamlFileChange(uri);
    });

    const generateReportCommand = vscode.commands.registerCommand('argBlazer.generateReport', async () => {
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
                const yamlData = yaml.load(yamlContent) as any;
                // Check if 'arguments' keyword exists
                if (!yamlData || !yamlData.hasOwnProperty('arguments')) {
                    vscode.window.showErrorMessage('YAML file must contain an "arguments" keyword');
                    return;
                }
                // Check if 'arguments' is a non-empty list
                if (!Array.isArray(yamlData.arguments) || yamlData.arguments.length === 0) {
                    vscode.window.showErrorMessage('The "arguments" field must be a non-empty list');
                    return;
                }
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
                    `ArgBlazer Report - ${path.basename(fileUri.fsPath)}`,
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
            await generateAndUpdateReport(yamlContent, panel, isNewPanel, fileKey);

        } catch (error: any) {
            console.error('Outer error details:', error);
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    const exportHtmlCommand = vscode.commands.registerCommand('argBlazer.exportHtml', async () => {
        await exportActiveHtml();
    });

    const aboutCommand = vscode.commands.registerCommand('argBlazer.about', async () => {
        const packageJson = require('../package.json');
        const version = packageJson.version;
        const displayName = packageJson.displayName;
        const publisher = packageJson.publisher;

        // Get environment information
        const osInfo = require('os');
        const osType = osInfo.type();
        const osRelease = osInfo.release();
        const osArch = osInfo.arch();
        const vscodeVersion = vscode.version;
        const nodeVersion = process.version;

        const aboutMessage = `${displayName} v${version}
Publisher: ${publisher}

• ${osType} ${osRelease} (${osArch})
• VS Code ${vscodeVersion}
• Node.js ${nodeVersion}`;

        vscode.window.showInformationMessage(aboutMessage, { modal: true });
    });

    context.subscriptions.push(generateReportCommand, exportHtmlCommand, aboutCommand, yamlWatcher);
}

async function handleYamlFileChange(uri: vscode.Uri) {
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
        await generateAndUpdateReport(yamlContent, panel, false, fileKey);

        // Bring the corresponding panel to the front
        try {
            panel.reveal(panel.viewColumn);
        } catch (revealError) {
            console.warn(`Failed to reveal panel for ${uri.fsPath}:`, revealError);
        }

        // Show a brief auto-closing notification that the report was updated
        void showBriefNotification(`Report updated for ${path.basename(uri.fsPath)}`);

    } catch (error: any) {
        console.error(`Error auto-updating report for ${uri.fsPath}:`, error);
        vscode.window.showWarningMessage(`Failed to auto-update report for ${path.basename(uri.fsPath)}`);
    }
}

async function generateAndUpdateReport(yamlContent: string, panel: vscode.WebviewPanel, showProgress: boolean = true, fileKey: string) {
    const updateReport = async () => {
        try {
            // Parse YAML
            const yamlData = yaml.load(yamlContent) as any;

            // Convert arguments from YAML object format to JSON array format
            if (yamlData.arguments && typeof yamlData.arguments === 'object' && !Array.isArray(yamlData.arguments)) {
                const argumentsArray = [];
                for (const [key, value] of Object.entries(yamlData.arguments)) {
                    argumentsArray.push({ [key]: value });
                }
                yamlData.arguments = argumentsArray;
            }

            // Process data and compute extensions
            const { jsonData, stepExtensions } = preprocessAndCompute(yamlData);

            // Generate HTML report
            const af4graph = JSON.stringify(jsonData);
            const af4ext = JSON.stringify(stepExtensions);
            // Extract exhibit from raw YAML to preserve comments and newlines
            const exhibit = extractRawExhibit(yamlContent) || '[Not provided]';
            const htmlOutput = renderHtml({ af4graph, af4ext, exhibit, fileKey });

            // Store the HTML content for export
            panelHtmlContent.set(fileKey, htmlOutput);

            // Update the webview content
            panel.webview.html = htmlOutput;

        } catch (error: any) {
            console.error('Error generating report:', error);

            let errorMsg = `Failed to generate report: ${error.message}`;
            if (error.message.includes('arguments')) {
                errorMsg = 'The YAML file must contain an "arguments" keyword, which must be a non-empty list.';
            } else if (error.message.includes('attacks')) {
                errorMsg = 'The "attacks" field must be a non-empty list of lists, where each inner list has at least two elements and the first attacks the second.';
            }

            vscode.window.showErrorMessage(errorMsg);
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
        vscode.window.showErrorMessage('No active argBlazer report panel found');
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
    const defaultFileName = fileName.replace(/\.(yaml|yml)$/, '') + '_argBlazerReport.html';
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

async function showBriefNotification(title: string, durationMs: number = 1500) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: false
    }, async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, durationMs));
    });
}

/**
 * Extract exhibit text directly from raw YAML content,
 * preserving comments (#) and newlines that yaml.load() would strip.
 */
function extractRawExhibit(yamlContent: string): string | null {
    const lines = yamlContent.split('\n');
    let foundExhibit = false;
    let blockIndicator = false;
    const contentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!foundExhibit) {
            // Look for top-level exhibit key (no leading whitespace)
            const match = line.match(/^exhibit\s*:\s*(.*)/);
            if (match) {
                foundExhibit = true;
                const rest = match[1].trim();
                if (rest === '|' || rest === '>' || rest === '|-' || rest === '>-') {
                    // Block scalar — collect subsequent indented lines
                    blockIndicator = true;
                    continue;
                } else if (rest && !rest.startsWith('#')) {
                    // Inline value on the same line
                    return rest;
                }
                // Empty or comment after colon — collect subsequent indented lines
                continue;
            }
        } else {
            // Stop at the next top-level key (non-indented, non-empty, non-comment line)
            if (line.trim() !== '' && /^\S/.test(line)) {
                break;
            }
            contentLines.push(line);
        }
    }

    if (!foundExhibit || contentLines.length === 0) { return null; }

    // Remove common leading indentation
    const nonEmptyLines = contentLines.filter(l => l.trim() !== '');
    if (nonEmptyLines.length === 0) { return null; }

    const minIndent = Math.min(...nonEmptyLines.map(l => {
        const m = l.match(/^(\s*)/);
        return m ? m[1].length : 0;
    }));
    const trimmed = contentLines.map(l => l.length >= minIndent ? l.substring(minIndent) : l);

    // Remove trailing empty lines
    while (trimmed.length > 0 && trimmed[trimmed.length - 1].trim() === '') {
        trimmed.pop();
    }

    return trimmed.length > 0 ? trimmed.join('\n') : null;
}

export function deactivate() {
    // Clean up all tracked panels
    activeReportPanels.clear();
    panelHtmlContent.clear();
}

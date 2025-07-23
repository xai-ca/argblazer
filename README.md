<div align="center">
    <img src="./media/icon.png" alt="argFrame Icon" width="200">
    <h1 align="center">ArgFrame</h1>
</div>

A VS Code extension that uses Geist to generate HTML reports from argumentation frameworks represented by YAML files.

## Features

- Generate HTML reports from argumentation frameworks represented by YAML files.
- Automatically updates reports when YAML files are saved.
- Side-by-side webview display of the generated report, showing the graph alongside its conflict-free, admissible, complete, preferred, grounded, and stable extensions.

## Requirements

- Python environment with the `geist` package installed
- A YAML file that represents an argumentation framework using the "exhibit" (optional), the "arguments" and the "attacks" (optional) keys

## Configuration

### Python Interpreter Setup (Required)

You must configure the Python interpreter path that has the `geist` package installed:

1. Open VS Code Settings (`Cmd/Ctrl + ,`)
2. Search for "ArgFrame Python Interpreter"
3. Set the full path to your Python executable (e.g., `/path/to/your/conda/envs/your_env/bin/python`)

Alternatively, add this to your VS Code settings.json:
```json
{
    "argFrame.pythonInterpreter": "/path/to/your/python"
}
```

#### Finding Your Python Path

To find the correct Python path:

**For conda environments:**
```bash
conda activate your_env
which python  # On macOS/Linux
where python  # On Windows
```

**For virtual environments:**
```bash
source your_venv/bin/activate  # On macOS/Linux
your_venv\Scripts\activate     # On Windows
which python  # On macOS/Linux
where python  # On Windows
```

#### Refreshing Python Interpreter

If you change your Python environment configuration:

1. Open the Command Palette (`Cmd/Ctrl + Shift + P`)
2. Run "ArgFrame: Refresh Python Interpreter"

## Usage

1. **First time setup**: Configure your Python interpreter path in VS Code settings
2. Open a YAML file containing argumentation framework data in VS Code
3. Click the "Generate HTML Report" button (preview icon) in the editor toolbar
4. The HTML report will appear in a webview panel beside your YAML file
5. Reports automatically update when you save changes to the YAML file

### YAML Format

Your YAML file contains the "exhibit" (optional), "arguments" and the "attacks" (optional) keys:
```yaml
exhibit: x
arguments:
    - a:
        - summary: x is an output candidate
        - details:
            - rule: by default a variable identified in a cell is an output candidate
            - evidence: x is identified in the cell on line 1
            - conclusion: x is an output candidate
    - b:
        - summary: no evidence x takes a new value provided
        - details:
            - rule: a variable identified in a cell is not an output candidate if it does not take a new value
            - evidence: no evidence that x takes a new value has been provided
            - conclusion: identification of x on line 1 is insufficient to establish that x is an output candidate
attacks:
    - [b, a]
```

## Development

1. Install dependencies: `npm install`
2. Compile TypeScript: `npm run compile`
3. Export as the VSIX file: `npx vsce package`

## Troubleshooting

### Python Environment Issues

If you encounter errors about the Python interpreter or geist package:

1. Ensure you have Python with the `geist` packages installed
2. Configure the correct Python interpreter path in VS Code settings
3. Use the "Refresh Python Interpreter" command after changing your configuration
4. Verify your Python path by running the commands shown in the "Finding Your Python Path" section

### Common Error Messages

- **"Python interpreter path not configured"**: Set the Python interpreter path in VS Code settings
- **"Configured Python interpreter is invalid"**: Check that the Python path exists and has geist installed
- **"Python error: ModuleNotFoundError: No module named 'geist'"**: Install the geist package in your Python environment

## Known Issues

- Requires manual Python interpreter path configuration
- The argumentation framework graph may continuously spin/move due to physics simulation. To stop the movement, click on any blank area of the graph (not on nodes or edges). Click again on blank area to restart physics if needed.

## Release Notes

### 0.0.1
Initial release with basic report generation for a given argumentation framework.

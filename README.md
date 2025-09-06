<div align="center">
    <img src="./media/icon.png" alt="ArgBlazer Icon" width="160">
    <h1 align="center">ArgBlazer</h1>
</div>

A VS Code extension that uses Geist to generate HTML reports from argumentation frameworks represented by YAML files.

## Features

- Generate HTML reports from argumentation frameworks represented by YAML files.
- Automatically updates the report when the modifications of a YAML file is saved.
- Side-by-side webview display of the generated report, showing the graph alongside its conflict-free, admissible, complete, preferred, grounded, and stable extensions. Whenever opened, the webview creates a new tab to the right of the active editor. The webview always opens in a new tab to the right of the active editor&mdash;either directly beside an existing tab or as a new tab if none exists.

## Requirements

- Python environment with the `geist` and `networkx` packages installed
```bash
# venv: create your virtual env
python -m venv your_venv
# activate your virtual env
source your_venv/bin/activate  # On macOS/Linux
your_venv\Scripts\activate     # On Windows

# install geist
pip install git+https://github.com/CIRSS/geist-p.git@develop

# install networkx
pip install networkx
```
- A YAML file that represents an argumentation framework using the "exhibit" (optional), the "arguments" and the "attacks" (optional) keys

## Configuration

### Python Interpreter Setup (Required)

You must configure the Python interpreter path that has the `geist` and `networkx` packages installed:

1. Open VS Code Settings (`Cmd/Ctrl + ,`)
2. Search for "ArgBlazer Python Interpreter"
3. Set the full path to your Python executable (e.g., `/path/to/your_env/bin/python` for MacOS and `\path\to\your_env\Scripts\python.exe` for Windows)

Alternatively, add this to your VS Code settings.json:
```json
{
    "argBlazer.pythonInterpreter": "/path/to/your/python"
}
```

#### Finding Your Python Path

To find the correct Python path:
```bash
which python  # On macOS/Linux
where python  # On Windows
```

#### Refreshing Python Interpreter

If you change your Python environment configuration:

1. Open the Command Palette (`Cmd/Ctrl + Shift + P`)
2. Run "ArgBlazer: Refresh Python Interpreter"

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

1. Ensure you have Python with the `geist` and `networkx` packages installed
2. Configure the correct Python interpreter path in VS Code settings

## Release Notes

### 0.0.1
Initial release with basic report generation for a given argumentation framework.

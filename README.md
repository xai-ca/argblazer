<div align="center">
    <img src="https://raw.githubusercontent.com/xai-ca/argblazer/main/media/icon.png" alt="ArgBlazer Icon" width="160">
    <h1 align="center">ArgBlazer</h1>
</div>

A VS Code extension that generates interactive HTML reports from YAML files, where each YAML file represents an argumentation framework.

## Features

- **Interactive graph visualization** &mdash; generates an interactive HTML report from a YAML file representing an argumentation framework, displayed in a side-by-side webview panel
- **Extensions** &mdash; automatically computes and displays conflict-free, admissible, complete, preferred, grounded, and stable extensions
- **Decisions** &mdash; pose yes/no questions about whether an argument can or must appear in a given extension type (see [Decisions](#decisions))
- **Sets** &mdash; assign arguments to named sets and filter the graph by set (see [Sets](#sets))
- **Step-by-step construction** &mdash; arguments can be introduced incrementally across steps, with the graph and extensions recomputed at each step (see [Step-by-Step Construction](#step-by-step-construction))
- **Graph layout control** &mdash; `top` and `bottom` annotations control which arguments are placed at the top or bottom of the graph layout (see [Top and Bottom Layout](#top-and-bottom-layout))
- **Zoom controls** &mdash; zoom in, zoom out, and fit-to-view buttons on the graph
- **Live reload** &mdash; the report updates automatically whenever the YAML file is saved
- **Export to HTML** &mdash; right-click the report panel and select "Export as HTML" to save a standalone HTML file

## Requirements

- A YAML file that represents an argumentation framework using the `arguments` key (required), and optionally the `exhibit`, `attacks`, and `decisions` keys.

## Usage

1. Open a YAML file containing argumentation framework data in VS Code
2. Click the "Generate ArgBlazer Report to the right" button (ArgBlazer icon) in the editor title toolbar (top-right corner)
3. The HTML report will appear in a webview panel beside your YAML file
4. Reports automatically update when you save changes to the YAML file

### YAML Format

A YAML file contains the `exhibit` (optional), `arguments` (required), and `attacks` (optional) keys:
```yaml
exhibit: |
  Tweety is a bird.
  Tweety is a penguin.
arguments:
  - a:
    - summary: Tweety can fly because birds typically can fly
    - details:
      - rule: Birds typically can fly
      - evidence: Tweety is a bird
      - conclusion: Tweety can fly
  - b:
    - summary: Tweety cannot fly because it is a penguin
    - details:
      - rule: Penguins cannot fly
      - evidence: Tweety is a penguin
      - conclusion: Tweety cannot fly
attacks:
  - [b, a]
```

Arguments can be listed with or without summaries and details. The simplest form is just the argument name:
```yaml
arguments:
  - a
  - b
attacks:
  - [b, a]
```

When `attacks` is omitted, the report displays the arguments as disconnected nodes.

### Decisions

The `decisions` key poses yes/no questions about whether a specific argument appears in a given extension. Each decision has three fields:

- `criterion`: the argument to query
- `quantifier`: `some` (the argument appears in at least one extension, default), `all` (it appears in every extension), or `none` (it appears in no extension)
- `semantics`: the extension type to query, one of `conflict_free`, `admissible`, `complete`, `preferred`, `grounded`, or `stable` (default: `preferred`)

```yaml
arguments:
  - a:
    - summary: Order fried chicken for here
  - b:
    - summary: Get fried chicken to go
  - c:
    - summary: Fried chicken to go will not be crispy
  - d:
    - summary: An air fryer at home can make fried chicken crispy again
attacks:
  - [b, a]
  - [a, b]
  - [c, b]
  - [d, c]
decisions:
  - "Can we get fried chicken to go?":
    - criterion: b
    - quantifier: some
    - semantics: preferred
  - "Must we get fried chicken to go?":
    - criterion: b
    - quantifier: all
    - semantics: preferred
```

The Decisions panel appears in the report when `decisions` is present, showing each question with a **Yes** or **No** answer that updates as you navigate steps.

### Sets

The `sets` annotation assigns an argument to one or more named sets. Arguments without a `sets` annotation are treated as "unassigned" and can be shown or hidden separately via the dropdown. You can filter the graph to show only arguments belonging to selected sets.

```yaml
arguments:
  - a:
    - summary: Order fried chicken for here
    - sets:
      - apt 1
      - apt 2
  - b:
    - summary: Get fried chicken to go
    - sets:
      - apt 1
      - apt 2
  - c:
    - summary: Fried chicken taken to go will not be crispy
    - details:
      - rule: Food transported in a box loses crispiness due to trapped steam
      - evidence: Fried chicken taken to go is transported in a box
      - conclusion: Fried chicken taken to go will not be crispy
    - sets:
      - apt 1
      - apt 2
  - d:
    - summary: An air fryer at home can make fried chicken crispy again
    - details:
      - rule: An air fryer restores crispiness by circulating hot air
      - evidence: There is an air fryer at home
      - conclusion: An air fryer at home can make fried chicken crispy again
    - sets:
      - apt 2
attacks:
  - [b, a]
  - [a, b]
  - [c, b]
  - [d, c]
```

### Step-by-Step Construction

Arguments can be introduced incrementally using the `step` annotation. The graph is built up step by step&mdash;each step shows all arguments introduced up to that point, along with any attacks between them. Use the navigation buttons in the report to move between steps.

```yaml
arguments:
  - a:
    - step: 1
  - b:
    - step: 1
  - c:
    - step: 2
  - d:
    - step: 3
attacks:
  - [b, a]
  - [c, b]
  - [d, c]
```

In this example, step 1 shows `a` and `b` with the attack `[b, a]`; step 2 adds `c` and the attack `[c, b]`; step 3 adds `d` and the attack `[d, c]`. Extensions are recomputed at each step. If the `step` field is omitted for an argument, steps are assigned automatically based on the order in which the arguments appear in the `arguments` list. Specifically, each argument is assigned to a new step in sequence.

### Top and Bottom Layout

The `top` and `bottom` annotations control the vertical placement of arguments in the graph. Arguments marked `top` are positioned at the top of the layout, and those marked `bottom` at the bottom. The graph layout is computed using BFS distances from these root nodes.

```yaml
arguments:
  - a:
    - top
  - b
  - c
  - d:
    - bottom
  - e:
    - bottom
attacks:
  - [b, a]
  - [c, b]
  - [d, c]
  - [e, b]
```

When no `top` or `bottom` annotations are provided, the first argument defaults to the top root and the last argument defaults to the bottom root.

## Development

1. Install dependencies: `npm install`
2. Compile TypeScript: `npm run compile`
3. Export as the VSIX file: `npx vsce package`

## Release Notes

### v0.1.0 (2026-02-07)
Initial release with interactive report generation for a given argumentation framework.

### v0.0.1 (2026-01-13)
Early version with Python dependencies (deprecated).

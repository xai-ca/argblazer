<div align="center">
    <img src="https://raw.githubusercontent.com/xai-ca/argblazer/main/media/icon.png" alt="ArgBlazer Icon" width="160">
    <h1 align="center">ArgBlazer</h1>
</div>

ArgBlazer is an interactive tool for exploring decision landscapes&mdash;the competing options, their supporting arguments and conflicts, and how each option fares as arguments are added or removed&mdash;using argumentation frameworks (AFs). The tool enables a user to construct an AF for making a determination by incrementally adding arguments and attacks, and to step forward and backward through the construction to observe how each argument affects the extensions and decision outcomes. Users can explore the implications of the AF and its extensions under various semantics at each step. ArgBlazer further provides means to declare decisions of interest and to specify, for each, how its answer is extracted from the AF, via a criterion, a quantifier, and a choice of semantics. Answers are updated automatically at every step for the user's consideration.

This VS Code extension generates the ArgBlazer report from a YAML file describing the AF, displays it side by side with the YAML in a webview panel, updates it automatically whenever the file is saved, and can export it as a standalone HTML file.

ArgBlazer is also available as a [browser playground](https://xai-ca.github.io/argblazer/playground.html) with shareable URLs&mdash;the same reports, running entirely client-side, no installation needed.

## Features

- **Interactive graph visualization** &mdash; generates an interactive HTML report from a YAML file representing an argumentation framework, displayed in a side-by-side webview panel
- **Extensions** &mdash; automatically computes and displays conflict-free, admissible, complete, preferred, grounded, and stable extensions (powered by the [afsolver](https://www.npmjs.com/package/afsolver) package); clicking an extension highlights each argument as *in* (member of the extension), *out* (attacked by a member), or *undecided*
- **Step-by-step construction** &mdash; arguments can be introduced incrementally across steps, with the graph and extensions recomputed at each step (see [Step-by-Step Construction](#step-by-step-construction))
- **Cases** &mdash; assign arguments to named cases and show only the arguments belonging to selected cases, with extensions and decisions recomputed accordingly (see [Cases](#cases))
- **Decisions** &mdash; pose yes/no questions about whether an argument can or must appear in a given extension type (see [Decisions](#decisions))
- **Argument labeling** &mdash; when an extension is selected, each argument is colored by its label, with a legend below the graph. By default *out* and *undec* share a single "Not in" color; ticking the "Distinguish Out/Undec" checkbox in the legend switches to the full three-way labeling. Green theme: **in** (dark green), **out** (light green), **undec** (white); XRAY theme: **in** (blue), **out** (orange), **undec** (yellow)
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

A YAML file contains the `exhibit` (optional), `decisions` (optional), `arguments` (required), and `attacks` (optional) keys:
```yaml
exhibit: |
  Tweety is a bird.
  Tweety is a penguin.
arguments:
  a:
    summary: Tweety can fly because birds typically can fly
    details:
      rule: Birds typically can fly
      evidence: Tweety is a bird
      conclusion: Tweety can fly
  b:
    summary: Tweety cannot fly because it is a penguin
    details:
      rule: Penguins cannot fly
      evidence: Tweety is a penguin
      conclusion: Tweety cannot fly
attacks:
  b: [a]
```

Each key under `arguments` (here `a` and `b`) is the argument's ID. The ID labels the node in the graph and is referenced in `attacks` and in a decision's `criterion`.

Arguments with no fields can be written with an empty value:
```yaml
arguments:
  a:
  b:
attacks:
  b: [a]
```

When an attacker has a single target, the brackets may be omitted: `b: [a]` can also be written as `b: a`.

When `attacks` is omitted, the report displays the arguments as disconnected nodes.

### Decisions

The `decisions` key poses yes/no questions about whether a specific argument appears in a given extension. Each decision has three fields:

- `criterion`: the ID of the argument to query
- `quantifier`: `at least one` (the argument appears in at least one extension, default), `all` (it appears in every extension), or `none` (it appears in no extension)
- `semantics`: the extension type to query, one of `conflict_free`, `admissible`, `complete`, `preferred`, `grounded`, or `stable` (default: `preferred`)

```yaml
arguments:
  a:
    summary: Order fried chicken in
  b:
    summary: Get fried chicken to go
  c:
    summary: Fried chicken to go will not be crispy
  d:
    summary: An air fryer at home can make fried chicken crispy
attacks:
  b: [a]
  a: [b]
  c: [b]
  d: [c]
decisions:
  "Can we get fried chicken to go?":
    criterion: b
    quantifier: at least one
    semantics: preferred
  "Must we get fried chicken to go?":
    criterion: b
    quantifier: all
    semantics: preferred
```

The Decisions panel appears in the report when `decisions` is present, showing each question with a **Yes** or **No** answer that updates as you navigate steps.

### Cases

The `cases` annotation assigns an argument to one or more named cases. Arguments without a `cases` annotation are treated as "unassigned" and can be shown or hidden separately via the dropdown. You can choose to show only the arguments belonging to selected cases; extensions and decisions are recomputed accordingly.

```yaml
arguments:
  a:
    summary: Order fried chicken in
    cases:
      - apartment without air fryer
      - apartment with air fryer
  b:
    summary: Get fried chicken to go
    cases:
      - apartment without air fryer
      - apartment with air fryer
  c:
    summary: To-go chicken will be soggy
    details:
      rule: Food transported in a box loses crispiness due to trapped steam
      evidence: Fried chicken taken to go is transported in a box
      conclusion: To-go chicken will be soggy
    cases:
      - apartment without air fryer
      - apartment with air fryer
  d:
    summary: An air fryer at home can make fried chicken crispy
    details:
      rule: An air fryer restores crispiness by circulating hot air
      evidence: There is an air fryer at home
      conclusion: An air fryer at home can make fried chicken crispy again
    cases:
      - apartment with air fryer
attacks:
  b: [a]
  a: [b]
  c: [b]
  d: [c]
```

### Step-by-Step Construction

Arguments can be introduced incrementally using the `step` annotation. The graph is built up step by step&mdash;each step shows all arguments introduced up to that point, along with any attacks between them. Use the navigation buttons in the report to move between steps.

```yaml
arguments:
  a:
    step: 1
  b:
    step: 1
  c:
    step: 2
  d:
    step: 3
attacks:
  b: [a]
  c: [b]
  d: [c]
```

In this example, step 1 shows `a` and `b` with the attack `[b, a]`; step 2 adds `c` and the attack `[c, b]`; step 3 adds `d` and the attack `[d, c]`. Extensions are recomputed at each step. If the `step` field is omitted for an argument, steps are assigned automatically based on the order in which the arguments appear in the `arguments` list. Specifically, each argument is assigned to a new step in sequence.

### Top and Bottom Layout

The `top` and `bottom` annotations control the vertical placement of arguments in the graph. Arguments marked `top` are positioned at the top of the layout, and those marked `bottom` at the bottom. The graph layout is computed using BFS distances from these root nodes.

```yaml
arguments:
  a:
    anchor: top
  b:
  c:
  d:
    anchor: bottom
  e:
    anchor: bottom
attacks:
  b: [a]
  c: [b]
  d: [c]
  e: [b]
```

When no `anchor` is provided, the first argument defaults to the top root and the last argument defaults to the bottom root.

## Development

1. Install dependencies: `npm install`
2. Compile TypeScript: `npm run compile`
3. Export as the VSIX file: `npx vsce package`

## Release Notes

### v0.1.1
- **Decisions** &mdash; pose yes/no questions about whether an argument appears in a given extension type, with answers updating at each step
- **Cases** &mdash; assign arguments to named cases and filter the graph by case; extensions are recomputed per step and per active case filter
- **Simplified YAML format** &mdash; argument fields (`summary`, `details`, `step`, `anchor`, `cases`) are now direct keys under the argument ID instead of list items; `top`/`bottom` replaced by `anchor: top`/`anchor: bottom`; the `attacks` field is a mapping from attacker to targets (e.g. `b: [a]`) instead of a list of pairs
- **Keyboard shortcut** &mdash; `Ctrl+/` (or `Cmd+/`) to toggle comments on selected lines in the YAML editor
- **Extension computation via afsolver** &mdash; the hand-written semantics code is replaced by the [afsolver](https://www.npmjs.com/package/afsolver) npm package (same algorithms, now maintained as a standalone library)
- **Argument labeling colors** &mdash; clicking an extension labels every argument as *in*, *out*, or *undec*; both themes show each label with a distinct color (Green: dark green/light green/white; XRAY: blue/orange/yellow)
- **Labelling legend & distinguish switch** &mdash; a legend bar appears below the graph while an extension is selected; by default *out* and *undec* share a single "Not in" color, and the "Distinguish Out/Undec" checkbox switches to distinct *out*/*undec* colors
- **Green theme updates** &mdash; argument borders are now black instead of dark green (matching the XRAY theme)

### v0.1.0 (2026-02-07)
Initial release with interactive report generation for a given argumentation framework.

### v0.0.1 (2026-01-13)
Early version with Python dependencies (deprecated).

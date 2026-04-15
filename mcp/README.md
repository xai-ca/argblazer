# ArgBlazer MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes ArgBlazer's argumentation reasoning engine as tools for AI assistants.

## Tools

| Tool | Description |
|------|-------------|
| `validate_framework` | Validate the structure of an argumentation framework YAML |
| `compute_extensions` | Compute all semantic extensions (conflict-free, admissible, complete, preferred, grounded, stable) |
| `evaluate_decisions` | Evaluate yes/no decisions defined in the framework |
| `get_examples` | Return all built-in example YAML frameworks |

## Setup

**1. Build**

From the project root:

```bash
npm install
npm run compile:mcp
```

This compiles the server to `out/mcp/mcp/server.js`.

**2. Register**

**Claude Code CLI:**
```bash
claude mcp add --transport stdio argblazer -- node /path/to/argblazer/out/mcp/mcp/server.js
```

**Claude Desktop** — edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "argblazer": {
      "command": "node",
      "args": ["/path/to/argblazer/out/mcp/mcp/server.js"]
    }
  }
}
```
Then restart Claude Desktop.

**3. Verify**

In Claude Code, run `/mcp` — you should see `argblazer` listed with its 4 tools.

## YAML Format

The tools accept YAML strings describing an [argumentation framework](https://en.wikipedia.org/wiki/Argumentation_framework):

```yaml
# Optional exhibit (background facts)
exhibit: |
  Tweety is a bird and a penguin.

# Arguments (required, non-empty mapping)
arguments:
  a:
    summary: Tweety can fly because birds typically can fly
    details:
      rule: Birds typically can fly
      evidence: Tweety is a bird
      conclusion: Tweety can fly
  b:
    summary: Tweety cannot fly because it is a penguin

# Attacks: attacker -> target (or list of targets)
attacks:
  b: a

# Optional decisions
decisions:
  "Can Tweety fly?":
    criterion: a       # which argument to test
    quantifier: some   # some | all | none
    semantics: preferred
```

**Argument fields** (all optional):
- `summary` — short label
- `details` — rule/evidence/conclusion breakdown
- `step` — integer for step-by-step construction
- `anchor` — `top` or `bottom` for layout control
- `sets` — list of named groups for filtering

**Semantics types:** `conflict_free`, `admissible`, `complete`, `preferred`, `grounded`, `stable`

## Example

Ask Claude: *"Use compute_extensions on the Tweety example from get_examples"*

Result:
```json
{
  "conflict_free": [[], ["a"], ["b"]],
  "admissible":    [[], ["b"]],
  "complete":      [["b"]],
  "preferred":     [["b"]],
  "grounded":      [["b"]],
  "stable":        [["b"]]
}
```

`b` wins in every semantics — Tweety cannot fly.

## File Structure

```
mcp/
├── README.md           this file
├── tsconfig.json       TypeScript config (extends ../tsconfig.json)
├── server.ts           MCP server entry point
├── argumentation.ts    Computation engine (extensions, decisions)
└── examples.ts         Built-in example YAML frameworks
```

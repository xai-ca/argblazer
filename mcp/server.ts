import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as yaml from 'js-yaml';
import { validateYaml } from '../src/validator';
import { computeExtensions, evaluateDecisions } from './argumentation';
import { EXAMPLES, EXAMPLE_DESCRIPTIONS } from './examples';

const server = new McpServer({
    name: 'argblazer',
    version: '0.1.1',
});

// ── Tool: validate_framework ──────────────────────────────────────────────────
server.tool(
    'validate_framework',
    'Validate the structure of an argumentation framework YAML string. Returns whether it is valid and any error message.',
    { yaml_string: z.string().describe('YAML content of an argumentation framework') },
    async ({ yaml_string }) => {
        try {
            let parsed: any;
            try {
                parsed = yaml.load(yaml_string);
            } catch (e: any) {
                return { content: [{ type: 'text', text: JSON.stringify({ valid: false, error: `YAML parse error: ${e.message}` }) }] };
            }
            const error = validateYaml(parsed);
            return { content: [{ type: 'text', text: JSON.stringify({ valid: error === null, error }) }] };
        } catch (e: any) {
            return { content: [{ type: 'text', text: JSON.stringify({ valid: false, error: String(e) }) }] };
        }
    }
);

// ── Tool: compute_extensions ──────────────────────────────────────────────────
server.tool(
    'compute_extensions',
    'Compute all semantic extensions (conflict_free, admissible, complete, preferred, grounded, stable) for an argumentation framework given as a YAML string.',
    { yaml_string: z.string().describe('YAML content of an argumentation framework') },
    async ({ yaml_string }) => {
        try {
            let parsed: any;
            try {
                parsed = yaml.load(yaml_string);
            } catch (e: any) {
                return { content: [{ type: 'text', text: `YAML parse error: ${e.message}` }] };
            }

            const error = validateYaml(parsed);
            if (error) {
                return { content: [{ type: 'text', text: `Validation error: ${error}` }] };
            }

            const args = Object.keys(parsed.arguments || {});
            const attacks: [string, string][] = [];
            if (parsed.attacks && typeof parsed.attacks === 'object' && !Array.isArray(parsed.attacks)) {
                for (const [attacker, targets] of Object.entries(parsed.attacks)) {
                    const targetList: string[] = Array.isArray(targets) ? (targets as any[]).map(String) : [String(targets)];
                    for (const target of targetList) {
                        attacks.push([attacker, target]);
                    }
                }
            }

            const extensions = computeExtensions(args, attacks);
            return { content: [{ type: 'text', text: JSON.stringify(extensions, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: 'text', text: `Error: ${String(e)}` }] };
        }
    }
);

// ── Tool: evaluate_decisions ──────────────────────────────────────────────────
server.tool(
    'evaluate_decisions',
    'Evaluate the decisions block of an argumentation framework YAML. Each decision specifies a criterion argument, a quantifier (some/all/none), and a semantics type; this tool returns yes/no answers.',
    { yaml_string: z.string().describe('YAML content of an argumentation framework with a decisions block') },
    async ({ yaml_string }) => {
        try {
            let parsed: any;
            try {
                parsed = yaml.load(yaml_string);
            } catch (e: any) {
                return { content: [{ type: 'text', text: `YAML parse error: ${e.message}` }] };
            }

            const error = validateYaml(parsed);
            if (error) {
                return { content: [{ type: 'text', text: `Validation error: ${error}` }] };
            }

            if (!parsed.decisions || Object.keys(parsed.decisions).length === 0) {
                return { content: [{ type: 'text', text: 'No decisions block found in the framework.' }] };
            }

            const results = evaluateDecisions(parsed);
            return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: 'text', text: `Error: ${String(e)}` }] };
        }
    }
);

// ── Tool: get_examples ────────────────────────────────────────────────────────
server.tool(
    'get_examples',
    'Return all built-in example argumentation framework YAML strings. Useful for trying out the other tools.',
    {},
    async () => {
        const output: Record<string, { description: string; yaml: string }> = {};
        for (const key of Object.keys(EXAMPLES) as Array<keyof typeof EXAMPLES>) {
            output[key] = {
                description: EXAMPLE_DESCRIPTIONS[key],
                yaml: EXAMPLES[key],
            };
        }
        return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
    }
);

// ── Entry point ───────────────────────────────────────────────────────────────
async function main(): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);

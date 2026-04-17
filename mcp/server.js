"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const yaml = __importStar(require("js-yaml"));
const validator_1 = require("../src/validator");
const argumentation_1 = require("./argumentation");
const examples_1 = require("./examples");
const server = new mcp_js_1.McpServer({
    name: 'argblazer',
    version: '0.1.1',
});
// ── Tool: validate_framework ──────────────────────────────────────────────────
server.tool('validate_framework', 'Validate the structure of an argumentation framework YAML string. Returns whether it is valid and any error message.', { yaml_string: zod_1.z.string().describe('YAML content of an argumentation framework') }, async ({ yaml_string }) => {
    try {
        let parsed;
        try {
            parsed = yaml.load(yaml_string);
        }
        catch (e) {
            return { content: [{ type: 'text', text: JSON.stringify({ valid: false, error: `YAML parse error: ${e.message}` }) }] };
        }
        const error = (0, validator_1.validateYaml)(parsed);
        return { content: [{ type: 'text', text: JSON.stringify({ valid: error === null, error }) }] };
    }
    catch (e) {
        return { content: [{ type: 'text', text: JSON.stringify({ valid: false, error: String(e) }) }] };
    }
});
// ── Tool: compute_extensions ──────────────────────────────────────────────────
server.tool('compute_extensions', 'Compute all semantic extensions (conflict_free, admissible, complete, preferred, grounded, stable) for an argumentation framework given as a YAML string.', { yaml_string: zod_1.z.string().describe('YAML content of an argumentation framework') }, async ({ yaml_string }) => {
    try {
        let parsed;
        try {
            parsed = yaml.load(yaml_string);
        }
        catch (e) {
            return { content: [{ type: 'text', text: `YAML parse error: ${e.message}` }] };
        }
        const error = (0, validator_1.validateYaml)(parsed);
        if (error) {
            return { content: [{ type: 'text', text: `Validation error: ${error}` }] };
        }
        const args = Object.keys(parsed.arguments || {});
        const attacks = [];
        if (parsed.attacks && typeof parsed.attacks === 'object' && !Array.isArray(parsed.attacks)) {
            for (const [attacker, targets] of Object.entries(parsed.attacks)) {
                const targetList = Array.isArray(targets) ? targets.map(String) : [String(targets)];
                for (const target of targetList) {
                    attacks.push([attacker, target]);
                }
            }
        }
        const extensions = (0, argumentation_1.computeExtensions)(args, attacks);
        return { content: [{ type: 'text', text: JSON.stringify(extensions, null, 2) }] };
    }
    catch (e) {
        return { content: [{ type: 'text', text: `Error: ${String(e)}` }] };
    }
});
// ── Tool: evaluate_decisions ──────────────────────────────────────────────────
server.tool('evaluate_decisions', 'Evaluate the decisions block of an argumentation framework YAML. Each decision specifies a criterion argument, a quantifier (some/all/none), and a semantics type; this tool returns yes/no answers.', { yaml_string: zod_1.z.string().describe('YAML content of an argumentation framework with a decisions block') }, async ({ yaml_string }) => {
    try {
        let parsed;
        try {
            parsed = yaml.load(yaml_string);
        }
        catch (e) {
            return { content: [{ type: 'text', text: `YAML parse error: ${e.message}` }] };
        }
        const error = (0, validator_1.validateYaml)(parsed);
        if (error) {
            return { content: [{ type: 'text', text: `Validation error: ${error}` }] };
        }
        if (!parsed.decisions || Object.keys(parsed.decisions).length === 0) {
            return { content: [{ type: 'text', text: 'No decisions block found in the framework.' }] };
        }
        const results = (0, argumentation_1.evaluateDecisions)(parsed);
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    }
    catch (e) {
        return { content: [{ type: 'text', text: `Error: ${String(e)}` }] };
    }
});
// ── Tool: get_examples ────────────────────────────────────────────────────────
server.tool('get_examples', 'Return all built-in example argumentation framework YAML strings. Useful for trying out the other tools.', {}, async () => {
    const output = {};
    for (const key of Object.keys(examples_1.EXAMPLES)) {
        output[key] = {
            description: examples_1.EXAMPLE_DESCRIPTIONS[key],
            yaml: examples_1.EXAMPLES[key],
        };
    }
    return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
});
// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch(console.error);
//# sourceMappingURL=server.js.map
import { computeRank } from './bfs';
import { computeExtensions, Extensions } from './argumentation';

export interface ProcessedData {
    jsonData: any;
    stepExtensions: Extensions[];
}

export function preprocessAndCompute(yamlData: any): ProcessedData {
    const jsonData = JSON.parse(JSON.stringify(yamlData)); // deep clone

    let first: string | null = null;
    let hasStep = false;
    const top: string[] = [];
    const bottom: string[] = [];

    // Process nodes (args) with missing text
    for (let idx = 0; idx < jsonData.arguments.length; idx++) {
        const arg = jsonData.arguments[idx];
        if (typeof arg === 'string') {
            if (idx === 0) { first = arg; }
            jsonData.arguments[idx] = { [arg]: [] };
        } else {
            for (const k of Object.keys(arg)) {
                if (idx === 0) { first = k; }
                const v = arg[k] || [];
                for (const item of v) {
                    if (typeof item === 'object' && item !== null && 'step' in item) {
                        hasStep = true;
                    }
                    if (item === 'top') {
                        top.push(k);
                    } else if (item === 'bottom') {
                        bottom.push(k);
                    }
                }
            }
        }
    }

    // Get last argument key
    const lastArgObj = jsonData.arguments[jsonData.arguments.length - 1];
    const last: string | null = first ? Object.keys(lastArgObj)[0] : null;

    // Handle missing steps
    let prevStep = 0;
    const step2args: Map<number, string[]> = new Map();

    for (let idx = 0; idx < jsonData.arguments.length; idx++) {
        const arg = jsonData.arguments[idx];
        for (const k of Object.keys(arg)) {
            const v: any[] = arg[k] || [];
            if (hasStep) {
                let currStep = false;
                for (const item of v) {
                    if (typeof item === 'object' && item !== null && 'step' in item) {
                        prevStep = item.step;
                        currStep = true;
                    }
                }
                if (!currStep) {
                    v.push({ step: prevStep });
                }
            } else {
                v.push({ step: prevStep + 1 });
                prevStep = prevStep + 1;
            }
            const existing = step2args.get(prevStep) || [];
            existing.push(k);
            step2args.set(prevStep, existing);
        }
    }

    // Build step2edges and step2ext (ASP facts string per step)
    const step2edges: Map<number, [string, string][]> = new Map();
    const step2extFacts: Map<number, { args: string[], attacks: [string, string][] }> = new Map();

    // Collect all args per step (regardless of whether attacks exist)
    {
        let prevArgs: string[] = [];
        const sortedSteps = Array.from(step2args.keys()).sort((a, b) => a - b);
        for (const step of sortedSteps) {
            const argsInStep = step2args.get(step) || [];
            prevArgs = prevArgs.concat(argsInStep);
            const af: { args: string[], attacks: [string, string][] } = { args: [], attacks: [] };
            for (const arg of prevArgs) {
                if (!af.args.includes(arg)) {
                    af.args.push(arg);
                }
            }
            step2extFacts.set(step, af);
        }
    }

    // Add attacks to step2edges and step2extFacts
    if (jsonData.attacks) {
        for (const attack of jsonData.attacks) {
            let prevArgs: string[] = [];
            const sortedSteps = Array.from(step2args.keys()).sort((a, b) => a - b);
            for (const step of sortedSteps) {
                const argsInStep = step2args.get(step) || [];
                const attacker = attack[0];
                const attackee = attack[1];
                const allAvailable = argsInStep.concat(prevArgs);
                if (allAvailable.includes(attacker) && allAvailable.includes(attackee)) {
                    const edges = step2edges.get(step) || [];
                    edges.push([attacker, attackee]);
                    step2edges.set(step, edges);

                    const af = step2extFacts.get(step)!;
                    af.attacks.push([attacker, attackee]);
                }
                prevArgs = prevArgs.concat(argsInStep);
            }
        }
    }

    // Compute ranks and extensions per step
    const rankTopArr: Record<string, number>[] = [];
    const rankBottomArr: Record<string, number>[] = [];
    const stepExtensions: Extensions[] = [];

    const sortedSteps = Array.from(step2extFacts.keys()).sort((a, b) => a - b);

    for (const step of sortedSteps) {
        const edges = step2edges.get(step) || [];
        rankTopArr.push(computeRank(edges, top, first, last, true));
        rankBottomArr.push(computeRank(edges, bottom, first, last, false));

        const af = step2extFacts.get(step)!;
        const extensions = computeExtensions({ args: af.args, attacks: af.attacks });
        stepExtensions.push(extensions);
    }

    // Store per-step rank data
    jsonData.steps = {
        rank_top: rankTopArr,
        rank_bottom: rankBottomArr
    };

    return { jsonData, stepExtensions };
}

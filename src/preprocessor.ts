import { computeRank } from './bfs';

export function preprocessAndCompute(yamlData: any): any {
    const jsonData = JSON.parse(JSON.stringify(yamlData)); // deep clone

    const argsMap: Record<string, any> = {};
    for (const [k, v] of Object.entries(jsonData.arguments)) {
        argsMap[k] = v ?? {};
    }
    jsonData.arguments = argsMap;

    // Normalize attacks map to array of pairs
    if (jsonData.attacks && !Array.isArray(jsonData.attacks)) {
        const pairs: [string, string][] = [];
        for (const [attacker, targets] of Object.entries(jsonData.attacks) as [string, any][]) {
            const targetList: string[] = Array.isArray(targets) ? targets : [targets];
            for (const target of targetList) {
                pairs.push([attacker, String(target)]);
            }
        }
        jsonData.attacks = pairs;
    }

    const argEntries = Object.entries(jsonData.arguments) as [string, any][];
    const first: string | null = argEntries[0]?.[0] ?? null;
    const last: string | null = argEntries[argEntries.length - 1]?.[0] ?? null;
    const hasStep = argEntries.some(([, v]) => v?.step !== undefined);
    const top: string[] = [];
    const bottom: string[] = [];

    for (const [k, v] of argEntries) {
        if (v?.anchor === 'top') { top.push(k); }
        else if (v?.anchor === 'bottom') { bottom.push(k); }
    }

    // Build step2args
    let prevStep = 0;
    const step2args: Map<number, string[]> = new Map();
    for (const [k, v] of argEntries) {
        if (hasStep) {
            if (v?.step !== undefined) { prevStep = v.step; }
        } else {
            v.step = ++prevStep;
        }
        const existing = step2args.get(prevStep) || [];
        existing.push(k);
        step2args.set(prevStep, existing);
    }

    const step2edges: Map<number, [string, string][]> = new Map();
    const step2extFacts: Map<number, { args: string[], attacks: [string, string][] }> = new Map();
    const sortedSteps = Array.from(step2args.keys()).sort((a, b) => a - b);

    // Collect all args per step; build cumulative set for O(1) attack lookup
    const step2cumulativeSet: Map<number, Set<string>> = new Map();
    {
        let prevArgs: string[] = [];
        for (const step of sortedSteps) {
            const argsInStep = step2args.get(step) || [];
            prevArgs = prevArgs.concat(argsInStep);
            step2extFacts.set(step, { args: prevArgs.slice(), attacks: [] });
            step2cumulativeSet.set(step, new Set(prevArgs));
        }
    }

    // Add attacks to step2edges and step2extFacts
    if (jsonData.attacks) {
        for (const attack of jsonData.attacks) {
            const attacker = attack[0];
            const attackee = attack[1];
            for (const step of sortedSteps) {
                const available = step2cumulativeSet.get(step)!;
                if (available.has(attacker) && available.has(attackee)) {
                    const edges = step2edges.get(step) || [];
                    edges.push([attacker, attackee]);
                    step2edges.set(step, edges);

                    step2extFacts.get(step)!.attacks.push([attacker, attackee]);
                }
            }
        }
    }

    // Compute ranks per step
    const rankTopArr: Record<string, number>[] = [];
    const rankBottomArr: Record<string, number>[] = [];

    for (const step of sortedSteps) {
        const edges = step2edges.get(step) || [];
        rankTopArr.push(computeRank(edges, top, first, last, true));
        rankBottomArr.push(computeRank(edges, bottom, first, last, false));
    }

    // Store per-step rank data
    jsonData.steps = {
        rank_top: rankTopArr,
        rank_bottom: rankBottomArr
    };

    return jsonData;
}

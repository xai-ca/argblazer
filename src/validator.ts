const VALID_ANCHORS = ['top', 'bottom'];
const VALID_QUANTIFIERS = ['all', 'some', 'none'];
const VALID_SEMANTICS = ['preferred', 'grounded', 'complete', 'stable', 'conflict_free', 'admissible'];

export function validateYaml(yamlData: any): string | null {
    if (!yamlData?.arguments || typeof yamlData.arguments !== 'object' || Array.isArray(yamlData.arguments) || Object.keys(yamlData.arguments).length === 0) {
        return 'The "arguments" field must be a non-empty mapping.';
    }

    const argIds = new Set<string>();
    for (const [id, val] of Object.entries(yamlData.arguments)) {
        argIds.add(id);
        const arg = (val as any) ?? {};
        if (arg.anchor !== undefined && !VALID_ANCHORS.includes(arg.anchor)) {
            return `Argument "${id}" has invalid anchor "${arg.anchor}" (must be "top" or "bottom").`;
        }
        if (arg.step !== undefined && typeof arg.step !== 'number') {
            return `Argument "${id}" has invalid step "${arg.step}" (must be a number).`;
        }
    }

    for (const attack of yamlData.attacks ?? []) {
        if (!argIds.has(attack[0])) return `Unknown argument "${attack[0]}" in attack.`;
        if (!argIds.has(attack[1])) return `Unknown argument "${attack[1]}" in attack.`;
    }

    for (const question of Object.keys(yamlData.decisions ?? {})) {
        const dec = yamlData.decisions[question] ?? {};
        if (dec.criterion !== undefined && !argIds.has(String(dec.criterion))) {
            return `Decision "${question}" has unknown criterion "${dec.criterion}".`;
        }
        if (dec.quantifier !== undefined && !VALID_QUANTIFIERS.includes(dec.quantifier)) {
            return `Decision "${question}" has invalid quantifier "${dec.quantifier}" (must be one of: ${VALID_QUANTIFIERS.join(', ')}).`;
        }
        if (dec.semantics !== undefined && !VALID_SEMANTICS.includes(dec.semantics)) {
            return `Decision "${question}" has invalid semantics "${dec.semantics}" (must be one of: ${VALID_SEMANTICS.join(', ')}).`;
        }
    }

    return null;
}

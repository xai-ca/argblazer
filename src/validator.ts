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

    const attacksField = yamlData.attacks;
    if (attacksField !== undefined) {
        if (typeof attacksField !== 'object' || Array.isArray(attacksField)) {
            return 'The "attacks" field must be a mapping.';
        }
        for (const [attacker, targets] of Object.entries(attacksField)) {
            if (!argIds.has(attacker)) return `Unknown argument "${attacker}" in attacks.`;
            const targetList = Array.isArray(targets) ? targets : [targets];
            for (const target of targetList) {
                if (!argIds.has(String(target))) return `Unknown argument "${target}" in attacks.`;
            }
        }
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

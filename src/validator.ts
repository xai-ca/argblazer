const VALID_ANCHORS = ['top', 'bottom'];
const VALID_QUANTIFIERS = ['all', 'at least one', 'none'];
const VALID_SEMANTICS = ['preferred', 'grounded', 'complete', 'stable', 'conflict_free', 'admissible'];
const CASE_INSENSITIVE_FIELDS = ['exhibit', 'arguments', 'attacks', 'decisions'];

/**
 * Returns a shallow copy of the top-level YAML mapping in which the
 * "exhibit", "arguments", "attacks" and "decisions" fields are renamed to lowercase,
 * whatever their original casing (e.g. "Arguments", "ATTACKS").
 * Non-object inputs are returned unchanged.
 */
export function normalizeFieldNames(yamlData: any): any {
    if (!yamlData || typeof yamlData !== 'object' || Array.isArray(yamlData)) {
        return yamlData;
    }
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(yamlData)) {
        const lower = key.toLowerCase();
        normalized[CASE_INSENSITIVE_FIELDS.includes(lower) ? lower : key] = value;
    }
    return normalized;
}

export interface CriterionTerm {
    /** The argument ID, with any leading "~" removed. */
    id: string;
    /** True when the term was written with a leading "~" (exclusion). */
    negated: boolean;
    /** The token exactly as written, used in error messages. */
    raw: string;
}

/**
 * Splits a decision's "criterion" into terms. Accepts a single scalar or a list;
 * a leading "~" marks the term as excluded. Terms combine conjunctively: an
 * extension satisfies the criterion when it contains every non-negated id and
 * none of the negated ones.
 */
export function parseCriterion(criterion: any): CriterionTerm[] {
    const tokens = Array.isArray(criterion) ? criterion : [criterion];
    return tokens.map(token => {
        const raw = String(token).trim();
        const negated = raw.startsWith('~');
        return { id: negated ? raw.slice(1).trim() : raw, negated, raw };
    });
}

export function validateYaml(rawYamlData: any): string | null {
    const yamlData = normalizeFieldNames(rawYamlData);
    if (!yamlData?.arguments || typeof yamlData.arguments !== 'object' || Array.isArray(yamlData.arguments) || Object.keys(yamlData.arguments).length === 0) {
        return 'The "ARGUMENTS" field must be a non-empty mapping.';
    }

    const argIds = new Set<string>();
    for (const [id, val] of Object.entries(yamlData.arguments)) {
        if (/^\s*~/.test(id)) {
            return `Argument "${id}" has an invalid ID: IDs cannot start with "~", which marks exclusion in a decision's criterion.`;
        }
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
            return 'The "ATTACKS" field must be a mapping.';
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
        if (dec.criterion !== undefined) {
            const tokens = Array.isArray(dec.criterion) ? dec.criterion : [dec.criterion];
            if (tokens.length === 0) {
                return `Decision "${question}" has an empty criterion list.`;
            }
            for (const token of tokens) {
                if (token === null || token === undefined || typeof token === 'object') {
                    return `Decision "${question}" has an invalid criterion entry (each entry must be an argument ID, optionally prefixed with "~").`;
                }
            }
            for (const term of parseCriterion(dec.criterion)) {
                if (!argIds.has(term.id)) {
                    return `Decision "${question}" has unknown criterion "${term.raw}".`;
                }
            }
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

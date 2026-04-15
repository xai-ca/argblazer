export type AttackPair = [string, string];

export interface Extensions {
    conflict_free: string[][];
    admissible: string[][];
    complete: string[][];
    preferred: string[][];
    grounded: string[][];
    stable: string[][];
}

export interface DecisionResult {
    question: string;
    answer: boolean;
    criterion: string;
    quantifier: 'some' | 'all' | 'none';
    semantics: keyof Extensions;
}

function isConflictFree(subset: Set<string>, attacks: AttackPair[]): boolean {
    for (const [a, b] of attacks) {
        if (subset.has(a) && subset.has(b)) return false;
    }
    return true;
}

function isDefended(arg: string, subset: Set<string>, attacks: AttackPair[]): boolean {
    for (const [attacker, target] of attacks) {
        if (target === arg) {
            let defended = false;
            for (const [z, t] of attacks) {
                if (t === attacker && subset.has(z)) { defended = true; break; }
            }
            if (!defended) return false;
        }
    }
    return true;
}

function isAdmissible(subset: Set<string>, attacks: AttackPair[]): boolean {
    if (!isConflictFree(subset, attacks)) return false;
    for (const x of subset) {
        if (!isDefended(x, subset, attacks)) return false;
    }
    return true;
}

function isComplete(subset: Set<string>, args: string[], attacks: AttackPair[]): boolean {
    if (!isAdmissible(subset, attacks)) return false;
    for (const x of args) {
        if (subset.has(x)) continue;
        if (isDefended(x, subset, attacks)) return false;
    }
    return true;
}

function isStable(subset: Set<string>, args: string[], attacks: AttackPair[]): boolean {
    if (!isConflictFree(subset, attacks)) return false;
    for (const x of args) {
        if (subset.has(x)) continue;
        let attacked = false;
        for (const [a, b] of attacks) {
            if (b === x && subset.has(a)) { attacked = true; break; }
        }
        if (!attacked) return false;
    }
    return true;
}

function isProperSuperset(a: Set<string>, b: Set<string>): boolean {
    if (a.size <= b.size) return false;
    for (const x of b) {
        if (!a.has(x)) return false;
    }
    return true;
}

function computeGrounded(args: string[], attacks: AttackPair[]): Set<string> {
    const inSet = new Set<string>();
    const outSet = new Set<string>();
    let changed = true;
    while (changed) {
        changed = false;
        for (const x of args) {
            if (inSet.has(x) || outSet.has(x)) continue;
            const attackers: string[] = [];
            for (const [a, b] of attacks) {
                if (b === x) attackers.push(a);
            }
            if (attackers.every(y => outSet.has(y))) {
                inSet.add(x);
                changed = true;
            }
        }
        for (const [a, b] of attacks) {
            if (inSet.has(a) && !outSet.has(b)) {
                outSet.add(b);
                changed = true;
            }
        }
    }
    return inSet;
}

function extractConflictFreeSets(args: string[], attacks: AttackPair[]): Set<string>[] {
    const n = args.length;
    const argIndex: Record<string, number> = {};
    for (let i = 0; i < n; i++) argIndex[args[i]] = i;
    const conflictMask: bigint[] = [];
    for (let i = 0; i < n; i++) conflictMask.push(0n);
    for (const [a, b] of attacks) {
        const ai = argIndex[a];
        const bi = argIndex[b];
        conflictMask[ai] |= (1n << BigInt(bi));
        conflictMask[bi] |= (1n << BigInt(ai));
    }
    const result: Set<string>[] = [];
    const current = new Set<string>();
    function backtrack(index: number, blocked: bigint): void {
        result.push(new Set(current));
        for (let i = index; i < n; i++) {
            const bit = 1n << BigInt(i);
            if (blocked & bit) continue;
            if (conflictMask[i] & bit) continue;
            current.add(args[i]);
            backtrack(i + 1, blocked | conflictMask[i]);
            current.delete(args[i]);
        }
    }
    backtrack(0, 0n);
    return result;
}

export function computeExtensions(args: string[], attacks: AttackPair[]): Extensions {
    const argOrder: Record<string, number> = {};
    args.forEach((a, i) => { argOrder[a] = i; });
    const setToOrderedArray = (s: Set<string>): string[] =>
        Array.from(s).sort((a, b) => argOrder[a] - argOrder[b]);

    const conflictFree = extractConflictFreeSets(args, attacks);
    const admissible = conflictFree.filter(s => isAdmissible(s, attacks));
    const complete = admissible.filter(s => isComplete(s, args, attacks));
    const preferred = admissible.filter(ext =>
        !admissible.some(other => other !== ext && isProperSuperset(other, ext))
    );
    const grounded = computeGrounded(args, attacks);
    const stable = conflictFree.filter(s => isStable(s, args, attacks));

    return {
        conflict_free: conflictFree.map(setToOrderedArray),
        admissible: admissible.map(setToOrderedArray),
        complete: complete.map(setToOrderedArray),
        preferred: preferred.map(setToOrderedArray),
        grounded: [setToOrderedArray(grounded)],
        stable: stable.map(setToOrderedArray),
    };
}

function normalizeAttacks(yamlData: any): AttackPair[] {
    const attacks: AttackPair[] = [];
    if (!yamlData.attacks || typeof yamlData.attacks !== 'object' || Array.isArray(yamlData.attacks)) {
        return attacks;
    }
    for (const [attacker, targets] of Object.entries(yamlData.attacks)) {
        const targetList: string[] = Array.isArray(targets) ? (targets as any[]).map(String) : [String(targets)];
        for (const target of targetList) {
            attacks.push([attacker, target]);
        }
    }
    return attacks;
}

export function evaluateDecisions(yamlData: any): DecisionResult[] {
    const args = Object.keys(yamlData.arguments || {});
    const attacks = normalizeAttacks(yamlData);
    const extensions = computeExtensions(args, attacks);

    const decisions = yamlData.decisions || {};
    const results: DecisionResult[] = [];

    for (const question of Object.keys(decisions)) {
        const dec = decisions[question] || {};
        const criterion: string | null = dec.criterion !== undefined ? String(dec.criterion) : null;
        if (criterion === null) continue;

        const quantifier: 'some' | 'all' | 'none' = dec.quantifier ?? 'some';
        const semantics: keyof Extensions = dec.semantics ?? 'preferred';

        const extList: string[][] = extensions[semantics] || [];
        let answer: boolean;
        if (quantifier === 'some') {
            answer = extList.some(ext => ext.includes(criterion));
        } else if (quantifier === 'all') {
            answer = extList.length > 0 && extList.every(ext => ext.includes(criterion));
        } else {
            answer = extList.every(ext => !ext.includes(criterion));
        }

        results.push({ question, answer, criterion, quantifier, semantics });
    }

    return results;
}

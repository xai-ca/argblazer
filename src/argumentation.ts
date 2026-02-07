export interface ArgumentationFramework {
    args: string[];
    attacks: [string, string][];
}

export interface Extensions {
    conflict_free: string[][];
    admissible: string[][];
    complete: string[][];
    preferred: string[][];
    grounded: string[][];
    stable: string[][];
}

function isConflictFree(subset: Set<string>, attacks: [string, string][]): boolean {
    for (const [a, b] of attacks) {
        if (subset.has(a) && subset.has(b)) { return false; }
    }
    return true;
}

function isDefended(arg: string, subset: Set<string>, attacks: [string, string][]): boolean {
    for (const [attacker, target] of attacks) {
        if (target === arg) {
            let defended = false;
            for (const [z, t] of attacks) {
                if (t === attacker && subset.has(z)) {
                    defended = true;
                    break;
                }
            }
            if (!defended) { return false; }
        }
    }
    return true;
}

function isAdmissible(subset: Set<string>, attacks: [string, string][]): boolean {
    if (!isConflictFree(subset, attacks)) { return false; }
    for (const x of subset) {
        if (!isDefended(x, subset, attacks)) { return false; }
    }
    return true;
}

function isComplete(subset: Set<string>, args: string[], attacks: [string, string][]): boolean {
    if (!isAdmissible(subset, attacks)) { return false; }
    for (const x of args) {
        if (subset.has(x)) { continue; }
        if (isDefended(x, subset, attacks)) { return false; }
    }
    return true;
}

function isStable(subset: Set<string>, args: string[], attacks: [string, string][]): boolean {
    if (!isConflictFree(subset, attacks)) { return false; }
    for (const x of args) {
        if (subset.has(x)) { continue; }
        let attacked = false;
        for (const [a, b] of attacks) {
            if (b === x && subset.has(a)) {
                attacked = true;
                break;
            }
        }
        if (!attacked) { return false; }
    }
    return true;
}

function isProperSuperset(a: Set<string>, b: Set<string>): boolean {
    if (a.size <= b.size) { return false; }
    for (const x of b) {
        if (!a.has(x)) { return false; }
    }
    return true;
}

function computeGrounded(args: string[], attacks: [string, string][]): Set<string> {
    const inSet = new Set<string>();
    const outSet = new Set<string>();
    let changed = true;
    while (changed) {
        changed = false;
        for (const x of args) {
            if (inSet.has(x) || outSet.has(x)) { continue; }
            const attackers: string[] = [];
            for (const [a, b] of attacks) {
                if (b === x) { attackers.push(a); }
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

function generatePowerSet(args: string[]): Set<string>[] {
    const n = args.length;
    const total = 1 << n;
    const result: Set<string>[] = [];
    for (let mask = 0; mask < total; mask++) {
        const subset = new Set<string>();
        for (let j = 0; j < n; j++) {
            if (mask & (1 << j)) {
                subset.add(args[j]);
            }
        }
        result.push(subset);
    }
    return result;
}

function setToSortedArray(s: Set<string>): string[] {
    return Array.from(s).sort();
}

export function computeExtensions(af: ArgumentationFramework): Extensions {
    const { args, attacks } = af;

    const allSubsets = generatePowerSet(args);

    const conflictFree = allSubsets.filter(s => isConflictFree(s, attacks));
    const admissible = conflictFree.filter(s => isAdmissible(s, attacks));
    const complete = admissible.filter(s => isComplete(s, args, attacks));
    const preferred = admissible.filter(ext =>
        !admissible.some(other => other !== ext && isProperSuperset(other, ext))
    );
    const grounded = computeGrounded(args, attacks);
    const stable = conflictFree.filter(s => isStable(s, args, attacks));

    return {
        conflict_free: conflictFree.map(setToSortedArray),
        admissible: admissible.map(setToSortedArray),
        complete: complete.map(setToSortedArray),
        preferred: preferred.map(setToSortedArray),
        grounded: [setToSortedArray(grounded)],
        stable: stable.map(setToSortedArray),
    };
}

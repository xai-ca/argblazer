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

function extractConflictFreeSets(args: string[], attacks: [string, string][]): Set<string>[] {
    const n = args.length;
    const argIndex = new Map<string, number>();
    for (let i = 0; i < n; i++) {
        argIndex.set(args[i], i);
    }

    const conflictMask: bigint[] = new Array(n).fill(0n);
    for (const [a, b] of attacks) {
        const ai = argIndex.get(a)!;
        const bi = argIndex.get(b)!;
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

function setToSortedArray(s: Set<string>): string[] {
    return Array.from(s).sort();
}

export function computeExtensions(af: ArgumentationFramework): Extensions {
    const { args, attacks } = af;

    const conflictFree = extractConflictFreeSets(args, attacks);
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

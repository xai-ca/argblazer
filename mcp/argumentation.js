"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeExtensions = computeExtensions;
exports.evaluateDecisions = evaluateDecisions;
function isConflictFree(subset, attacks) {
    for (const [a, b] of attacks) {
        if (subset.has(a) && subset.has(b))
            return false;
    }
    return true;
}
function isDefended(arg, subset, attacks) {
    for (const [attacker, target] of attacks) {
        if (target === arg) {
            let defended = false;
            for (const [z, t] of attacks) {
                if (t === attacker && subset.has(z)) {
                    defended = true;
                    break;
                }
            }
            if (!defended)
                return false;
        }
    }
    return true;
}
function isAdmissible(subset, attacks) {
    if (!isConflictFree(subset, attacks))
        return false;
    for (const x of subset) {
        if (!isDefended(x, subset, attacks))
            return false;
    }
    return true;
}
function isComplete(subset, args, attacks) {
    if (!isAdmissible(subset, attacks))
        return false;
    for (const x of args) {
        if (subset.has(x))
            continue;
        if (isDefended(x, subset, attacks))
            return false;
    }
    return true;
}
function isStable(subset, args, attacks) {
    if (!isConflictFree(subset, attacks))
        return false;
    for (const x of args) {
        if (subset.has(x))
            continue;
        let attacked = false;
        for (const [a, b] of attacks) {
            if (b === x && subset.has(a)) {
                attacked = true;
                break;
            }
        }
        if (!attacked)
            return false;
    }
    return true;
}
function isProperSuperset(a, b) {
    if (a.size <= b.size)
        return false;
    for (const x of b) {
        if (!a.has(x))
            return false;
    }
    return true;
}
function computeGrounded(args, attacks) {
    const inSet = new Set();
    const outSet = new Set();
    let changed = true;
    while (changed) {
        changed = false;
        for (const x of args) {
            if (inSet.has(x) || outSet.has(x))
                continue;
            const attackers = [];
            for (const [a, b] of attacks) {
                if (b === x)
                    attackers.push(a);
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
function extractConflictFreeSets(args, attacks) {
    const n = args.length;
    const argIndex = {};
    for (let i = 0; i < n; i++)
        argIndex[args[i]] = i;
    const conflictMask = [];
    for (let i = 0; i < n; i++)
        conflictMask.push(0n);
    for (const [a, b] of attacks) {
        const ai = argIndex[a];
        const bi = argIndex[b];
        conflictMask[ai] |= (1n << BigInt(bi));
        conflictMask[bi] |= (1n << BigInt(ai));
    }
    const result = [];
    const current = new Set();
    function backtrack(index, blocked) {
        result.push(new Set(current));
        for (let i = index; i < n; i++) {
            const bit = 1n << BigInt(i);
            if (blocked & bit)
                continue;
            if (conflictMask[i] & bit)
                continue;
            current.add(args[i]);
            backtrack(i + 1, blocked | conflictMask[i]);
            current.delete(args[i]);
        }
    }
    backtrack(0, 0n);
    return result;
}
function computeExtensions(args, attacks) {
    const argOrder = {};
    args.forEach((a, i) => { argOrder[a] = i; });
    const setToOrderedArray = (s) => Array.from(s).sort((a, b) => argOrder[a] - argOrder[b]);
    const conflictFree = extractConflictFreeSets(args, attacks);
    const admissible = conflictFree.filter(s => isAdmissible(s, attacks));
    const complete = admissible.filter(s => isComplete(s, args, attacks));
    const preferred = admissible.filter(ext => !admissible.some(other => other !== ext && isProperSuperset(other, ext)));
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
function normalizeAttacks(yamlData) {
    const attacks = [];
    if (!yamlData.attacks || typeof yamlData.attacks !== 'object' || Array.isArray(yamlData.attacks)) {
        return attacks;
    }
    for (const [attacker, targets] of Object.entries(yamlData.attacks)) {
        const targetList = Array.isArray(targets) ? targets.map(String) : [String(targets)];
        for (const target of targetList) {
            attacks.push([attacker, target]);
        }
    }
    return attacks;
}
function evaluateDecisions(yamlData) {
    const args = Object.keys(yamlData.arguments || {});
    const attacks = normalizeAttacks(yamlData);
    const extensions = computeExtensions(args, attacks);
    const decisions = yamlData.decisions || {};
    const results = [];
    for (const question of Object.keys(decisions)) {
        const dec = decisions[question] || {};
        const criterion = dec.criterion !== undefined ? String(dec.criterion) : null;
        if (criterion === null)
            continue;
        const quantifier = dec.quantifier ?? 'some';
        const semantics = dec.semantics ?? 'preferred';
        const extList = extensions[semantics] || [];
        let answer;
        if (quantifier === 'some') {
            answer = extList.some(ext => ext.includes(criterion));
        }
        else if (quantifier === 'all') {
            answer = extList.length > 0 && extList.every(ext => ext.includes(criterion));
        }
        else {
            answer = extList.every(ext => !ext.includes(criterion));
        }
        results.push({ question, answer, criterion, quantifier, semantics });
    }
    return results;
}
//# sourceMappingURL=argumentation.js.map
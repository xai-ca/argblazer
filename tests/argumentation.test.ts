import { computeExtensions, ArgumentationFramework } from '../src/argumentation';

// Helper: normalize extension results for comparison (sort inner arrays, sort outer array)
function normalize(exts: string[][]): string {
    return JSON.stringify(
        exts.map(e => [...e].sort()).sort((a, b) => {
            const ja = JSON.stringify(a), jb = JSON.stringify(b);
            return ja < jb ? -1 : ja > jb ? 1 : 0;
        })
    );
}

interface TestCase {
    name: string;
    af: ArgumentationFramework;
    expected: {
        conflict_free: string[][];
        admissible: string[][];
        complete: string[][];
        preferred: string[][];
        grounded: string[][];
        stable: string[][];
    };
}

const testCases: TestCase[] = [
    {
        name: 'af_ex1: single unattacked arg',
        af: { args: ['a'], attacks: [] },
        expected: {
            conflict_free: [[], ['a']],
            admissible: [[], ['a']],
            complete: [['a']],
            preferred: [['a']],
            grounded: [['a']],
            stable: [['a']],
        }
    },
    {
        name: 'af_ex2: self-attack',
        af: { args: ['a'], attacks: [['a', 'a']] },
        expected: {
            conflict_free: [[]],
            admissible: [[]],
            complete: [[]],
            preferred: [[]],
            grounded: [[]],
            stable: [],
        }
    },
    {
        name: 'af_ex3: b attacks a',
        af: { args: ['a', 'b'], attacks: [['b', 'a']] },
        expected: {
            conflict_free: [[], ['a'], ['b']],
            admissible: [[], ['b']],
            complete: [['b']],
            preferred: [['b']],
            grounded: [['b']],
            stable: [['b']],
        }
    },
    {
        name: 'af_ex4: b attacks a, a self-attacks',
        af: { args: ['a', 'b'], attacks: [['b', 'a'], ['a', 'a']] },
        expected: {
            conflict_free: [[], ['b']],
            admissible: [[], ['b']],
            complete: [['b']],
            preferred: [['b']],
            grounded: [['b']],
            stable: [['b']],
        }
    },
    {
        name: 'af_ex5: b attacks a, b self-attacks',
        af: { args: ['a', 'b'], attacks: [['b', 'a'], ['b', 'b']] },
        expected: {
            conflict_free: [[], ['a']],
            admissible: [[]],
            complete: [[]],
            preferred: [[]],
            grounded: [[]],
            stable: [],
        }
    },
    {
        name: 'af_ex6: both self-attack, b attacks a',
        af: { args: ['a', 'b'], attacks: [['b', 'a'], ['a', 'a'], ['b', 'b']] },
        expected: {
            conflict_free: [[]],
            admissible: [[]],
            complete: [[]],
            preferred: [[]],
            grounded: [[]],
            stable: [],
        }
    },
    {
        name: 'af_ex7: mutual attack a<->b',
        af: { args: ['a', 'b'], attacks: [['a', 'b'], ['b', 'a']] },
        expected: {
            conflict_free: [[], ['a'], ['b']],
            admissible: [[], ['a'], ['b']],
            complete: [[], ['a'], ['b']],
            preferred: [['a'], ['b']],
            grounded: [[]],
            stable: [['a'], ['b']],
        }
    },
    {
        name: 'af_ex8: mutual attack + b self-attacks',
        af: { args: ['a', 'b'], attacks: [['a', 'b'], ['b', 'a'], ['b', 'b']] },
        expected: {
            conflict_free: [[], ['a']],
            admissible: [[], ['a']],
            complete: [[], ['a']],
            preferred: [['a']],
            grounded: [[]],
            stable: [['a']],
        }
    },
    {
        name: 'af_ex9: chain a->b->c',
        af: { args: ['a', 'b', 'c'], attacks: [['a', 'b'], ['b', 'c']] },
        expected: {
            conflict_free: [[], ['a'], ['a', 'c'], ['b'], ['c']],
            admissible: [[], ['a'], ['a', 'c']],
            complete: [['a', 'c']],
            preferred: [['a', 'c']],
            grounded: [['a', 'c']],
            stable: [['a', 'c']],
        }
    },
    {
        name: 'af_ex10: a and c both attack b',
        af: { args: ['a', 'b', 'c'], attacks: [['a', 'b'], ['c', 'b']] },
        expected: {
            conflict_free: [[], ['a'], ['a', 'c'], ['b'], ['c']],
            admissible: [[], ['a'], ['a', 'c'], ['c']],
            complete: [['a', 'c']],
            preferred: [['a', 'c']],
            grounded: [['a', 'c']],
            stable: [['a', 'c']],
        }
    },
    {
        name: 'af_ex11: b attacks a and c',
        af: { args: ['a', 'b', 'c'], attacks: [['b', 'a'], ['b', 'c']] },
        expected: {
            conflict_free: [[], ['a'], ['a', 'c'], ['b'], ['c']],
            admissible: [[], ['b']],
            complete: [['b']],
            preferred: [['b']],
            grounded: [['b']],
            stable: [['b']],
        }
    },
    {
        name: 'af_ex12: mutual a<->b, c attacks b',
        af: { args: ['a', 'b', 'c'], attacks: [['a', 'b'], ['b', 'a'], ['c', 'b']] },
        expected: {
            conflict_free: [[], ['a'], ['a', 'c'], ['b'], ['c']],
            admissible: [[], ['a'], ['a', 'c'], ['c']],
            complete: [['a', 'c']],
            preferred: [['a', 'c']],
            grounded: [['a', 'c']],
            stable: [['a', 'c']],
        }
    },
    {
        name: 'af_ex13: mutual a<->b, mutual c<->d, c attacks b',
        af: { args: ['a', 'b', 'c', 'd'], attacks: [['a', 'b'], ['b', 'a'], ['c', 'b'], ['c', 'd'], ['d', 'c']] },
        expected: {
            conflict_free: [[], ['a'], ['a', 'c'], ['a', 'd'], ['b'], ['b', 'd'], ['c'], ['d']],
            admissible: [[], ['a'], ['a', 'c'], ['a', 'd'], ['b', 'd'], ['c'], ['d']],
            complete: [[], ['a'], ['a', 'c'], ['a', 'd'], ['b', 'd'], ['d']],
            preferred: [['a', 'c'], ['a', 'd'], ['b', 'd']],
            grounded: [[]],
            stable: [['a', 'c'], ['a', 'd'], ['b', 'd']],
        }
    },
    {
        name: 'af_ex14: mutual a<->b, mutual b<->c',
        af: { args: ['a', 'b', 'c'], attacks: [['a', 'b'], ['b', 'a'], ['b', 'c'], ['c', 'b']] },
        expected: {
            conflict_free: [[], ['a'], ['a', 'c'], ['b'], ['c']],
            admissible: [[], ['a'], ['a', 'c'], ['b'], ['c']],
            complete: [[], ['a', 'c'], ['b']],
            preferred: [['a', 'c'], ['b']],
            grounded: [[]],
            stable: [['a', 'c'], ['b']],
        }
    },
    {
        name: 'af_ex15: odd cycle a->b->c->a',
        af: { args: ['a', 'b', 'c'], attacks: [['a', 'b'], ['b', 'c'], ['c', 'a']] },
        expected: {
            conflict_free: [[], ['a'], ['b'], ['c']],
            admissible: [[]],
            complete: [[]],
            preferred: [[]],
            grounded: [[]],
            stable: [],
        }
    },
    {
        name: 'af_ex16: odd cycle + c->d',
        af: { args: ['a', 'b', 'c', 'd'], attacks: [['a', 'b'], ['b', 'c'], ['c', 'a'], ['c', 'd']] },
        expected: {
            conflict_free: [[], ['a'], ['a', 'd'], ['b'], ['b', 'd'], ['c'], ['d']],
            admissible: [[]],
            complete: [[]],
            preferred: [[]],
            grounded: [[]],
            stable: [],
        }
    },
    {
        name: 'af_ex17: odd cycle + chain c->d->e',
        af: { args: ['a', 'b', 'c', 'd', 'e'], attacks: [['a', 'b'], ['b', 'c'], ['c', 'a'], ['c', 'd'], ['d', 'e']] },
        expected: {
            conflict_free: [[], ['a'], ['a', 'd'], ['a', 'e'], ['b'], ['b', 'd'], ['b', 'e'], ['c'], ['c', 'e'], ['d'], ['e']],
            admissible: [[]],
            complete: [[]],
            preferred: [[]],
            grounded: [[]],
            stable: [],
        }
    },
    {
        name: 'af_ex18: mutual a1<->a2, chain f->e->d->c->b->a1',
        af: {
            args: ['a1', 'a2', 'b', 'c', 'd', 'e', 'f'],
            attacks: [['a1', 'a2'], ['a2', 'a1'], ['b', 'a1'], ['c', 'b'], ['d', 'c'], ['e', 'd'], ['f', 'e']]
        },
        expected: {
            conflict_free: [], // too many to list, just check complete/preferred/grounded/stable
            admissible: [],
            complete: [['a2', 'b', 'd', 'f']],
            preferred: [['a2', 'b', 'd', 'f']],
            grounded: [['a2', 'b', 'd', 'f']],
            stable: [['a2', 'b', 'd', 'f']],
        }
    },
    {
        name: 'af_ex19: mutual a1<->a2, b/d/f attack a1, g attacks b',
        af: {
            args: ['a1', 'a2', 'b', 'd', 'f', 'g'],
            attacks: [['a1', 'a2'], ['a2', 'a1'], ['b', 'a1'], ['g', 'b'], ['d', 'a1'], ['f', 'a1']]
        },
        expected: {
            conflict_free: [],
            admissible: [],
            complete: [['a2', 'd', 'f', 'g']],
            preferred: [['a2', 'd', 'f', 'g']],
            grounded: [['a2', 'd', 'f', 'g']],
            stable: [['a2', 'd', 'f', 'g']],
        }
    },
    {
        name: 'af_ex20: complex 8-argument framework',
        af: {
            args: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
            attacks: [['b', 'a'], ['c', 'b'], ['d', 'c'], ['e', 'd'], ['g', 'b'], ['h', 'g'], ['f', 'c'], ['c', 'f']]
        },
        expected: {
            conflict_free: [],
            admissible: [],
            complete: [['a', 'c', 'e', 'h'], ['b', 'e', 'f', 'h'], ['e', 'h']],
            preferred: [['a', 'c', 'e', 'h'], ['b', 'e', 'f', 'h']],
            grounded: [['e', 'h']],
            stable: [['a', 'c', 'e', 'h'], ['b', 'e', 'f', 'h']],
        }
    },
];

let passed = 0, failed = 0;

for (const tc of testCases) {
    const result = computeExtensions(tc.af);
    const types: (keyof typeof result)[] = ['conflict_free', 'admissible', 'complete', 'preferred', 'grounded', 'stable'];

    for (const type of types) {
        // Skip conflict_free and admissible checks for large AFs (too many to list)
        if ((type === 'conflict_free' || type === 'admissible') && tc.expected[type].length === 0) {
            continue;
        }
        const actual = normalize(result[type]);
        const expected = normalize(tc.expected[type]);
        if (actual !== expected) {
            console.log(`FAIL: ${tc.name} - ${type}`);
            console.log(`  Expected: ${expected}`);
            console.log(`  Actual:   ${actual}`);
            failed++;
        } else {
            passed++;
        }
    }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) { process.exit(1); }

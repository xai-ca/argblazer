import { getExtensionFuncs } from '../src/htmlRenderer';
import { validateYaml, parseCriterion } from '../src/validator';
import { preprocessAndCompute } from '../src/preprocessor';
import { evaluateDecisions } from '../mcp/argumentation';

// Eval the client-side computation functions to get computeExtensions
const computeExtensions: (args: string[], attacks: [string, string][]) => any =
    new Function(getExtensionFuncs() + '\nreturn computeExtensions;')();

// The report ships a hand-ported ES5 copy of parseCriterion; pull it out so the
// port can be checked against the TypeScript original below.
const clientParseCriterion: (criterion: any) => any[] =
    new Function(getExtensionFuncs() + '\nreturn parseCriterion;')();

// Helper: normalize extension results for comparison (sort inner arrays, sort outer array)
function normalize(exts: string[][]): string {
    return JSON.stringify(
        exts.map(e => [...e].sort()).sort((a, b) => {
            const ja = JSON.stringify(a), jb = JSON.stringify(b);
            return ja < jb ? -1 : ja > jb ? 1 : 0;
        })
    );
}

interface ArgumentationFramework {
    args: string[];
    attacks: [string, string][];
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
    const result = computeExtensions(tc.af.args, tc.af.attacks);
    const types = ['conflict_free', 'admissible', 'complete', 'preferred', 'grounded', 'stable'] as const;

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

// --- Top-level field names are case-insensitive (validator.ts / preprocessor.ts) ---
const fieldNameCases: { name: string; data: any }[] = [
    { name: 'Capitalized', data: { Arguments: { a: null, b: null }, Attacks: { b: 'a' }, Decisions: { 'Q?': { criterion: 'a' } } } },
    { name: 'UPPERCASE', data: { ARGUMENTS: { a: null, b: null }, ATTACKS: { b: 'a' }, DECISIONS: { 'Q?': { criterion: 'a' } } } },
    { name: 'lowercase', data: { arguments: { a: null, b: null }, attacks: { b: 'a' }, decisions: { 'Q?': { criterion: 'a' } } } },
    { name: 'mIxEd', data: { ExHiBiT: 'x', aRgUmEnTs: { a: null, b: null }, AtTaCkS: { b: 'a' }, dEcIsIoNs: { 'Q?': { criterion: 'a' } } } },
];
for (const tc of fieldNameCases) {
    const error = validateYaml(tc.data);
    const out = preprocessAndCompute(tc.data);
    const ok = error === null
        && Object.keys(out.arguments).join() === 'a,b'
        && JSON.stringify(out.attacks) === '[["b","a"]]'
        && Object.keys(out.decisions).join() === 'Q?'
        && !Object.keys(out).some(k => /^(exhibit|arguments|attacks|decisions)$/i.test(k) && k !== k.toLowerCase())
        && (tc.name !== 'mIxEd' || out.exhibit === 'x');
    if (ok) { passed++; } else { failed++; console.log(`FAIL: field names ${tc.name} - error=${error} out=${JSON.stringify(out)}`); }
}
{
    const error = validateYaml({ Attacks: { b: 'a' } });
    if (error && /"ARGUMENTS" field must be a non-empty mapping/.test(error)) { passed++; }
    else { failed++; console.log(`FAIL: missing Arguments should be rejected, got: ${error}`); }
}


// --- criterion parsing: scalar or list, "~" marks exclusion (validator.ts) ---
const criterionCases: { name: string; input: any; expected: { id: string; negated: boolean }[] }[] = [
    { name: 'bare scalar', input: 'to-go', expected: [{ id: 'to-go', negated: false }] },
    { name: 'negated scalar', input: '~soggy', expected: [{ id: 'soggy', negated: true }] },
    { name: 'list of includes', input: ['to-go', 'fryer'], expected: [{ id: 'to-go', negated: false }, { id: 'fryer', negated: false }] },
    { name: 'mixed list', input: ['to-go', '~soggy'], expected: [{ id: 'to-go', negated: false }, { id: 'soggy', negated: true }] },
    { name: 'whitespace tolerated', input: ['  to-go  ', '~ soggy'], expected: [{ id: 'to-go', negated: false }, { id: 'soggy', negated: true }] },
    { name: 'id containing a tilde', input: 'a~b', expected: [{ id: 'a~b', negated: false }] },
];
for (const tc of criterionCases) {
    const strip = (terms: any[]) => JSON.stringify(terms.map(t => ({ id: t.id, negated: t.negated })));
    const expected = JSON.stringify(tc.expected);
    const actual = strip(parseCriterion(tc.input));
    if (actual !== expected) {
        failed++; console.log(`FAIL: parseCriterion ${tc.name} - expected ${expected}, got ${actual}`);
    } else { passed++; }
    // the report's ES5 port must agree with the TypeScript original
    const clientActual = strip(clientParseCriterion(tc.input));
    if (clientActual !== expected) {
        failed++; console.log(`FAIL: client parseCriterion ${tc.name} - expected ${expected}, got ${clientActual}`);
    } else { passed++; }
}

// --- decision evaluation: conjunctive include/exclude terms (mcp/argumentation.ts) ---
// Fried chicken AF; preferred extensions are {fryer, to-go} and {fryer, dine-in}.
const chicken = {
    arguments: { 'dine-in': null, 'to-go': null, soggy: null, fryer: null },
    attacks: { 'to-go': ['dine-in'], 'dine-in': ['to-go'], soggy: ['to-go'], fryer: ['soggy'] },
};
const decisionCases: { name: string; criterion: any; quantifier: string; expected: boolean }[] = [
    { name: 'scalar include, at least one', criterion: 'to-go', quantifier: 'at least one', expected: true },
    { name: 'scalar include, all', criterion: 'to-go', quantifier: 'all', expected: false },
    { name: 'scalar exclude, all', criterion: '~soggy', quantifier: 'all', expected: true },
    { name: 'scalar exclude of an unattacked arg', criterion: '~fryer', quantifier: 'at least one', expected: false },
    { name: 'mixed list, satisfiable', criterion: ['to-go', '~soggy'], quantifier: 'at least one', expected: true },
    { name: 'mixed list, unsatisfiable', criterion: ['to-go', '~fryer'], quantifier: 'at least one', expected: false },
    { name: 'mixed list, all', criterion: ['fryer', '~soggy'], quantifier: 'all', expected: true },
    { name: 'conjunction is not disjunction', criterion: ['to-go', 'dine-in'], quantifier: 'at least one', expected: false },
    { name: 'none, satisfiable criterion', criterion: ['to-go', '~soggy'], quantifier: 'none', expected: false },
    { name: 'none, unsatisfiable criterion', criterion: ['to-go', '~fryer'], quantifier: 'none', expected: true },
];
for (const tc of decisionCases) {
    const data = { ...chicken, decisions: { 'Q?': { criterion: tc.criterion, quantifier: tc.quantifier, semantics: 'preferred' } } };
    const error = validateYaml(data);
    const results = evaluateDecisions(data);
    if (error === null && results.length === 1 && results[0].answer === tc.expected) { passed++; }
    else { failed++; console.log(`FAIL: decision ${tc.name} - error=${error} expected=${tc.expected} got=${results[0]?.answer}`); }
}

// --- validator rules for IDs and criterion entries (validator.ts) ---
const rejectionCases: { name: string; data: any; match: RegExp }[] = [
    {
        name: 'argument ID cannot start with ~',
        data: { arguments: { '~a': null, b: null } },
        match: /Argument "~a" has an invalid ID/,
    },
    {
        name: 'argument ID cannot start with ~ after whitespace',
        data: { arguments: { ' ~a': null, b: null } },
        match: /has an invalid ID/,
    },
    {
        name: 'unknown criterion echoes the token as written',
        data: { arguments: { a: null }, decisions: { 'Q?': { criterion: ['a', '~typo'] } } },
        match: /unknown criterion "~typo"/,
    },
    {
        name: 'empty criterion list',
        data: { arguments: { a: null }, decisions: { 'Q?': { criterion: [] } } },
        match: /empty criterion list/,
    },
    {
        name: 'bare ~ criterion (YAML null)',
        data: { arguments: { a: null }, decisions: { 'Q?': { criterion: null } } },
        match: /invalid criterion entry/,
    },
];
for (const tc of rejectionCases) {
    const error = validateYaml(tc.data);
    if (error && tc.match.test(error)) { passed++; }
    else { failed++; console.log(`FAIL: ${tc.name} - got: ${error}`); }
}

// An ID merely containing "~" stays legal, and remains referenceable.
{
    const error = validateYaml({ arguments: { 'a~b': null }, decisions: { 'Q?': { criterion: 'a~b' } } });
    if (error === null) { passed++; }
    else { failed++; console.log(`FAIL: ID containing ~ should be accepted, got: ${error}`); }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) { process.exit(1); }

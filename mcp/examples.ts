export type ExampleKey = 'friedchicken_step' | 'friedchicken_sets' | 'tweety' | 'steps' | 'topbottom';

export const EXAMPLES: Record<ExampleKey, string> = {
    friedchicken_step: 'arguments:\n  dine-in:\n    summary: Order dine-in fried chicken\n    step: 1\n  to-go:\n    summary: Order to-go fried chicken\n    step: 1\n  soggy:\n    summary: To-go chicken will not be crispy\n    details:\n      rule: Food transported in a box loses crispiness due to trapped steam\n      evidence: Fried chicken taken to go is transported in a box\n      conclusion: To-go chicken will not be crispy\n    step: 2\n  fryer:\n    summary: An air fryer at home can make fried chicken crispy again\n    details:\n      rule: An air fryer restores crispiness by circulating hot air\n      evidence: There is an air fryer at home\n      conclusion: An air fryer at home can make fried chicken crispy again\n    step: 3\nattacks:\n  to-go: [dine-in]\n  dine-in: [to-go]\n  soggy: [to-go]\n  fryer: [soggy]\ndecisions:\n  "Can we get fried chicken to go?":\n    criterion: to-go\n    quantifier: some\n    semantics: preferred\n  "Must we get fried chicken to go?":\n    criterion: to-go\n    quantifier: all\n    semantics: preferred',

    friedchicken_sets: 'arguments:\n  dine-in:\n    summary: Order dine-in fried chicken\n    sets:\n      - apt 1\n      - apt 2\n  to-go:\n    summary: Order to-go fried chicken\n    sets:\n      - apt 1\n      - apt 2\n  soggy:\n    summary: To-go chicken will not be crispy\n    details:\n      rule: Food transported in a box loses crispiness due to trapped steam\n      evidence: Fried chicken taken to go is transported in a box\n      conclusion: To-go chicken will not be crispy\n    sets:\n      - apt 1\n      - apt 2\n  fryer:\n    summary: An air fryer at home can make fried chicken crispy again\n    details:\n      rule: An air fryer restores crispiness by circulating hot air\n      evidence: There is an air fryer at home\n      conclusion: An air fryer at home can make fried chicken crispy again\n    sets:\n      - apt 2\nattacks:\n  to-go: [dine-in]\n  dine-in: [to-go]\n  soggy: [to-go]\n  fryer: [soggy]\ndecisions:\n  "Can we get fried chicken to go?":\n    criterion: to-go\n    quantifier: some\n    semantics: preferred\n  "Must we get fried chicken to go?":\n    criterion: to-go\n    quantifier: all\n    semantics: preferred',

    tweety: 'exhibit: |\n  Tweety is a bird.\n  Tweety is a penguin.\narguments:\n  a:\n    summary: Tweety can fly because birds typically can fly\n    details:\n      rule: Birds typically can fly\n      evidence: Tweety is a bird\n      conclusion: Tweety can fly\n  b:\n    summary: Tweety cannot fly because it is a penguin\n    details:\n      rule: Penguins cannot fly\n      evidence: Tweety is a penguin\n      conclusion: Tweety cannot fly\nattacks:\n  b: a',

    steps: 'arguments:\n  a:\n    step: 1\n  b:\n    step: 1\n  c:\n    step: 2\n  d:\n    step: 3\nattacks:\n  b: a\n  c: b\n  d: c',

    topbottom: 'arguments:\n  a:\n    anchor: top\n  b:\n  c:\n  d:\n    anchor: bottom\n  e:\n    anchor: bottom\nattacks:\n  b: a\n  c: b\n  d: c\n  e: b',
};

export const EXAMPLE_DESCRIPTIONS: Record<ExampleKey, string> = {
    friedchicken_step: 'Fried chicken ordering dilemma with step-by-step argument construction and decisions',
    friedchicken_sets: 'Fried chicken ordering dilemma with set-based filtering (apartment sets)',
    tweety: 'Classic Tweety Bird example: can a penguin fly?',
    steps: 'Minimal step-by-step example showing argument construction order',
    topbottom: 'Layout demo with top/bottom anchor arguments',
};

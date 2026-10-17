/** The five setup steps in order, with the title, hint and "Next" label each one shows. */

import type { SetupStep } from '../../lib/domain/ready';

export const STEPS: { id: SetupStep; label: string; hint: string }[] = [
  { id: 'details', label: 'Details', hint: 'Name the quiz and choose the language the projector shows.' },
  { id: 'teams', label: 'Teams', hint: 'Add the competing schools. A quiz needs at least 2.' },
  { id: 'rounds', label: 'Rounds', hint: 'A round is a set of questions. Give each one a type and a timer.' },
  {
    id: 'questions',
    label: 'Questions',
    hint: 'Pick a round, then add its questions. Rounds need 10; a picture round needs at least 1 picture.',
  },
  { id: 'review', label: 'Review', hint: 'Check that nothing is missing, then start the quiz.' },
];

export const STEP_LABELS = Object.fromEntries(STEPS.map((step) => [step.id, step.label])) as Record<SetupStep, string>;

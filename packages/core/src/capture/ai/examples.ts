import { resolveByLocale } from './locale';
import type { AILanguageCode } from './prompts';

export interface PromptExamples {
  readonly steps: readonly string[];
  readonly titles: readonly string[];
  readonly descriptions: readonly string[];
}

const EXAMPLES: Record<AILanguageCode, PromptExamples> = {
  en: {
    steps: [
      'Click the Submit button',
      'Enter email address in the Email field',
      'Select "Admin" from the Role dropdown',
      'Navigate to the Settings page',
    ],
    titles: [
      'Review web-app Pull Requests',
      'Configure Slack Notification Preferences',
      'Submit Expense Report in Workday',
      'Create Repository in GitHub Organization',
    ],
    descriptions: [
      "Reset a locked-out user's password from the Okta admin panel. For IT support staff.",
      'Configure which Slack channels send desktop notifications, and set a do-not-disturb schedule.',
    ],
  },
};

export function resolveExamples(locale: string): PromptExamples {
  return resolveByLocale(EXAMPLES, locale) ?? EXAMPLES.en;
}

export function formatExamples(lines: readonly string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

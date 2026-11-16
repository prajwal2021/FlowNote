export const STEP_DESCRIPTION_PROMPT = `You are describing steps in a browser workflow guide. Given the following context about a user action on a web page, write a single concise sentence describing this step.

{{context}}

Examples of good descriptions:
{{examples}}

Copy button labels, field names, and menu items exactly as they appear on the page. Never translate them.

Write only the description, no preamble.`;

export const SCREEN_STEP_DESCRIPTION_PROMPT = `You are describing steps in a guide to a desktop application. Given the following context about one action the user took, write a single concise sentence describing this step.

{{context}}

Name the control by the label it shows, in quotes. Do not use technical control names such as "tree item", "treeview", "pane", "list item" or "group"; say "list", "menu", "field" or "button" only where a reader would. Only mention names that appear above. The previous step is there for context; describe only this one.

Examples of good descriptions:
- "Click "Downloads" in File Explorer"
- "Select "Dark" from the Theme list"
- "Enter "Quarterly report" as the file name"
- "Press Ctrl+S to save the document"

Write only the description, no preamble.`;

export const GUIDE_META_PROMPT = `These are the steps of a recorded workflow. Each one shows where it happened, a page URL or an application and its window, and what the user did:

{{steps}}

Write a title and a description for this workflow.

TITLE: specific and descriptive. Mention the application or website name and the specific task performed. Reference specific pages, features, or items that were interacted with. Only name applications, websites and items that appear in the steps. MUST be under 60 characters.

Examples of good titles:
{{titleExamples}}

DESCRIPTION: one or two sentences stating what the workflow accomplishes and who would follow it. Do not repeat the title. Do not list the individual steps. Do not mention any application, website or UI element that does not appear in the steps above.

Examples of good descriptions:
{{descriptionExamples}}

Copy application names, page names, and UI labels exactly as they appear in the steps. Never translate them.`;

export const GUIDE_META_JSON_SUFFIX = `

Reply with nothing but a JSON object shaped {"title": string, "description": string}. No code fence, no commentary.`;

export const REWRITE_PROMPT = `You are editing one span of text inside a browser workflow guide. The text describes a step a reader must perform, or summarises what the workflow accomplishes.

Selected text:
"""
{{text}}
"""

Instruction: {{instruction}}

Rules:
- Keep it imperative and describing a single action when the original does.
- Never introduce a UI element, button, page, or value that is absent from the original.
- Preserve specific names, labels, and quoted strings exactly as written.
- Match the length the instruction implies; otherwise stay close to the original length.

Return only the rewritten text. No preamble, no quotes, no explanation.`;

export const REWRITE_PRESETS = {
  shorter: 'Make it shorter and tighter without losing any required detail.',
  detail: 'Add detail that clarifies the action, using only information already present.',
  grammar: 'Fix grammar, spelling, and punctuation. Change nothing else.',
  formal: 'Make the tone more formal and professional.',
  casual: 'Make the tone more casual and conversational.',
} as const;

export type RewritePreset = keyof typeof REWRITE_PRESETS;

export const AI_LANGUAGES = [{ code: 'en', label: 'English' }] as const;

export type AILanguageCode = (typeof AI_LANGUAGES)[number]['code'];

export function getLanguageSuffix(locale: string): string {
  return locale.trim().toLowerCase().startsWith('en')
    ? ''
    : '\nIMPORTANT: Write the output in English. Never translate button, field, or page names.';
}

export const TRANSLATE_GUIDE_PROMPT = `You are translating a recorded step-by-step workflow guide into {{language}}.

{{content}}

Rules:
- Translate the prose a reader follows into {{language}}: the guide title, the guide description and each step instruction.
- NEVER translate the name of anything the reader has to find on the screen. Button labels, menu entries, tab and window names, field, column and checkbox names, link text, application and page names, file names and values the user typed stay exactly as written, in the source language, with their original spelling and capitalisation, even when they are not in quotes. The reader is looking at a screen that is still in the source language, so a translated label is a label they cannot find.
- Keep the quotation marks around a name that is already quoted, and add none around a name that is not.
- Keep each step a single instruction. Do not merge, split, reorder, add or drop steps.
- Translate every step you are given and return it under the exact id it was given. Never invent, shorten or renumber an id.

Return a translation for the title and the description only where they appear above, and null for one that does not.`;

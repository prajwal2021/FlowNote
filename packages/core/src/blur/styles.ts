export const REDACT_CLASS = 'flownote-redact';
export const SHOWN_CLASS = 'flownote-redact-shown';
export const PICKED_CLASS = 'flownote-redact-picked';

const SHEET_ID = 'flownote-redact-sheet';
const SOFTNESS = 'blur(10px)';

export function addRedactStyles() {
  if (document.getElementById(SHEET_ID)) return;
  const sheet = Object.assign(document.createElement('style'), { id: SHEET_ID });
  sheet.textContent = [
    `.${REDACT_CLASS}, .${PICKED_CLASS} { filter: ${SOFTNESS}; transition: filter 150ms ease-out; }`,
    `.${REDACT_CLASS}.${SHOWN_CLASS} { filter: none; }`,
  ].join('\n');
  document.head.appendChild(sheet);
}

export function removeRedactStyles() {
  document.getElementById(SHEET_ID)?.remove();
}

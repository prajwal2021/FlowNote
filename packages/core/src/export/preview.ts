import { CONTENT_BOTTOM_MM, HEAD_BAND_MM, PAGE_MARGIN_MM, STEP_TOP_MM } from '@/core/export/page';

const PREVIEW_CSS = `
  html { background: #3F3F46; }
  body {
    background: #3F3F46 !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 22px 0 34px !important;
  }
  .flownote-sheets { display: flex; flex-direction: column; align-items: center; gap: 18px; }
  .flownote-sheet {
    width: 210mm;
    height: 297mm;
    background: #fff;
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45);
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .flownote-sheet-body {
    padding: ${STEP_TOP_MM}mm ${PAGE_MARGIN_MM}mm 0;
    height: ${CONTENT_BOTTOM_MM}mm;
    overflow: hidden;
  }
  .flownote-sheet-body.flownote-sheet-cover { padding-top: ${PAGE_MARGIN_MM}mm; }
  .flownote-sheet-head {
    position: absolute;
    left: ${PAGE_MARGIN_MM}mm;
    right: ${PAGE_MARGIN_MM}mm;
    top: ${PAGE_MARGIN_MM}mm;
    height: ${HEAD_BAND_MM}mm;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11px;
    font-weight: 700;
    color: #1A0A0A;
    border-bottom: 1px solid #E5E7EB;
    overflow: hidden;
    white-space: nowrap;
  }
  .flownote-sheet-head .flownote-head-title { overflow: hidden; text-overflow: ellipsis; }
  .flownote-sheet-head img {
    width: 18mm;
    height: 5mm;
    object-fit: contain;
    object-position: right center;
    margin-left: auto;
  }
  .flownote-sheet-foot {
    position: absolute;
    left: ${PAGE_MARGIN_MM}mm;
    right: ${PAGE_MARGIN_MM}mm;
    bottom: 11mm;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11px;
    color: #6B7280;
    border-top: 1px solid #E5E7EB;
    padding-top: 7px;
  }
  .flownote-sheet-foot .flownote-page { margin-left: auto; }
  .flownote-sheet-body > *:last-child { margin-bottom: 0 !important; }
  .flownote-sheet-body header { margin-bottom: 34px !important; }
`;

export function withPreviewStyles(exportHtml: string): string {
  return exportHtml.replace('</head>', `<style id="flownote-preview">${PREVIEW_CSS}</style>\n</head>`);
}

export function paginatePreview(doc: Document): number {
  const body = doc.body;
  if (!body || body.querySelector('.flownote-sheets')) return 0;

  const blocks: HTMLElement[] = [];
  let footer: HTMLElement | null = null;
  let header: HTMLElement | null = null;

  for (const node of Array.from(body.children)) {
    if (!(node instanceof doc.defaultView!.HTMLElement)) continue;
    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') continue;
    if (node.hasAttribute('data-doc-footer')) footer = node;
    else if (node.hasAttribute('data-doc-header')) header = node;
    else blocks.push(node);
  }

  for (const node of blocks) node.remove();
  footer?.remove();
  header?.remove();

  const headTitle = header?.querySelector('h1')?.textContent ?? doc.title;
  const headLogo = header?.querySelector('img') ?? null;

  const stack = doc.createElement('div');
  stack.className = 'flownote-sheets';
  body.appendChild(stack);

  const bodies: HTMLElement[] = [];
  const addSheet = () => {
    const sheet = doc.createElement('div');
    sheet.className = 'flownote-sheet';
    const inner = doc.createElement('div');
    inner.className = 'flownote-sheet-body';
    sheet.appendChild(inner);
    stack.appendChild(sheet);
    bodies.push(inner);
    return inner;
  };

  let current = addSheet();
  for (const block of blocks) {
    if (block.hasAttribute('data-cover')) {
      current.classList.add('flownote-sheet-cover');
      current.appendChild(block);
      current = addSheet();
      continue;
    }
    current.appendChild(block);
    if (current.scrollHeight > current.clientHeight && current.children.length > 1) {
      current = addSheet();
      current.appendChild(block);
    }
  }

  const last = bodies[bodies.length - 1];
  if (bodies.length > 1 && last?.children.length === 0) {
    last.parentElement?.remove();
    bodies.pop();
  }

  bodies.forEach((inner, index) => {
    if (!inner.classList.contains('flownote-sheet-cover')) {
      const head = doc.createElement('div');
      head.className = 'flownote-sheet-head';
      const title = doc.createElement('span');
      title.className = 'flownote-head-title';
      title.textContent = headTitle;
      head.appendChild(title);
      if (headLogo) head.appendChild(headLogo.cloneNode(true));
      inner.parentElement?.appendChild(head);
    }

    const foot = doc.createElement('div');
    foot.className = 'flownote-sheet-foot';
    if (footer) {
      for (const span of Array.from(footer.children)) foot.appendChild(span.cloneNode(true));
    }
    const page = doc.createElement('span');
    page.className = 'flownote-page';
    page.textContent = `${index + 1} / ${bodies.length}`;
    foot.appendChild(page);
    inner.parentElement?.appendChild(foot);
  });

  return bodies.length;
}

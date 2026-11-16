# FlowNote

FlowNote records a workflow and turns each action into a step: a screenshot, the element acted on and a description. A guide can be edited, replayed on a live page, exported as a document, PDF, Word file, GIF or video, and shared with other FlowNote users.

## What is in this repository

| Folder | What it is |
| --- | --- |
| `apps/extension` | The Chrome extension that records inside the browser |
| `apps/desktop` | The desktop app (Windows and macOS) that records across applications |
| `apps/server` | The web app: sign-up, sign-in, shared links, the synced guide library and the shared AI key. See `apps/server/DEPLOY.md` |
| `packages/core` | Logic shared by the apps: capture, guides, export, sync |
| `packages/ui` | The React interface shared by the apps |
| `packages/locales` | Translations |
| `packages/capture-native` | Native code for input and accessibility on desktop |

## Working on it

```
pnpm install
pnpm dev            # extension with hot reload
pnpm dev:desktop    # desktop app
pnpm test
pnpm lint
```

Build the extension for the server at your address:

```
WXT_FLOWNOTE_SERVER=https://<your-server>/flownote pnpm build
```

## Smart blur

Smart blur scans text nodes and input values in the page's top frame. It does not reach iframes, shadow DOM, canvas, pseudo-element content, `<select>` text or attribute values, and it only covers the tab where it was started. Check screenshots of sensitive pages before sharing them.

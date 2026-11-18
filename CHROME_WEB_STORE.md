# Publishing FlowNote to the Chrome Web Store

## 1. Before you submit

- [ ] Server deployed on Railway with every variable in `apps/server/DEPLOY.md` set, including
      `SUPPORT_EMAIL`, `RESEND_API_KEY`/`MAIL_FROM`, the Google and Stripe variables.
- [ ] `https://<server>/privacy` and `https://<server>/terms` open without signing in. Read them and
      change anything that doesn't match how you run FlowNote (company name, refund policy, country).
- [ ] Google OAuth consent screen published to **Production** (not Testing, which only allows test users).
- [ ] Stripe in live mode: live secret key, live price, live webhook endpoint and its secret.
- [ ] Sign up, sign in with Google, reset a password, record 5 guides, hit the limit, upgrade with a Stripe
      test card, cancel in the portal, delete the account. Do this against a staging copy first.

## 2. Build

```
WXT_FLOWNOTE_SERVER=https://<your-server> pnpm zip
```

Upload `apps/extension/.output/flownote-<version>-chrome.zip`. The first upload creates the item and
assigns its ID. Put that ID in the server's `EXTENSION_IDS` and redeploy before testing Google sign-in
from the store build.

## 3. Store listing

| Field | Value |
| --- | --- |
| Name | FlowNote: Step-by-Step Guides & Tutorials (from `app.store_title`) |
| Summary | Record any browser workflow as a step-by-step guide. Edit, voice-narrate, export to video, PDF or DOCX. |
| Category | Productivity / Workflow & Planning |
| Language | English |
| Icon | `apps/extension/public/icon128.png` |
| Screenshots | 1–5 at 1280×800 or 640×400 (you need to make these) |
| Small promo tile | 440×280 (you need to make this) |
| Homepage / support URL | your server address or a landing page |
| Privacy policy URL | `https://<server>/privacy` |

Suggested description:

> FlowNote turns what you do in the browser into a polished step-by-step guide. Press Record, click
> through your workflow, and FlowNote captures a screenshot and a clear description for every step.
>
> • Edit steps, add annotations and blur sensitive information
> • Narrate as you go and let AI write the descriptions
> • Replay any guide on the live page with Guide Me
> • Export to PDF, Word, Markdown, GIF or video, or share a link
>
> Free for your first 5 recordings. Upgrade to FlowNote Pro for unlimited recordings.

## 4. Privacy practices tab

**Single purpose:** Record a workflow in the browser and turn it into an editable step-by-step guide.

**Permission justifications:**

| Permission | Justification |
| --- | --- |
| `<all_urls>` host access | The user records workflows on any site they choose. The content script listens for clicks and typing only while recording, and Guide Me highlights steps on the same sites. |
| `tabs` | Read the URL and title of the tab being recorded for each step, and follow the recording across tabs. |
| `activeTab` | Capture a screenshot of the tab the user is recording. |
| `scripting` | Inject the recorder and Smart Blur into tabs that were open before installation. |
| `webNavigation` | Keep recording across page loads and single-page-app navigations, including in frames. |
| `storage`, `unlimitedStorage` | Store guides and their screenshots locally; a guide can be many megabytes. |
| `sidePanel` | FlowNote's main interface lives in the side panel. |
| `offscreen` | Capture microphone audio for voice narration and build exports without blocking the service worker. |
| `identity` | "Continue with Google" sign-in via `launchWebAuthFlow`. |

**Remote code:** No. All code ships in the package.

**Data usage** — tick:
- Personally identifiable information (email, name)
- Authentication information (sign-in token)
- Website content (screenshots and text of pages the user records)
- User activity (clicks and keystrokes, only while recording)
- Financial and payment information is handled by Stripe and never reaches the extension; tick it only
  if you prefer to be conservative.

Then certify: not sold to third parties, not used for unrelated purposes, not used for credit decisions.

## 5. After approval

- Watch the Railway logs for `password reset mail failed`, `checkout failed` and `stripe webhook failed`.
- Make yourself admin: `update users set role = 'admin' where email = '<you>';`
- Bump `apps/extension/package.json` `version` for every new upload.

## Not covered yet

- Email verification on sign-up (Google accounts are verified; password accounts are not).
- Paywall and Google sign-in in the desktop app (it does not sign in today).
- Translations other than English (only `packages/locales/en.yml` exists).

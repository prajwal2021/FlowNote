import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = { title: 'Privacy Policy · FlowNote' };

export default function PrivacyPage() {
  const contact = process.env.SUPPORT_EMAIL ?? 'support@flownote.app';
  return (
    <LegalPage title="Privacy Policy" updated="November 17, 2026">
      <p>
        FlowNote turns a workflow you record into a step-by-step guide. This policy explains what the FlowNote browser extension,
        desktop app and web app collect, why, and what you can do about it.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account information:</strong> your email address, an optional name, and a securely hashed password. If you sign in with Google we receive your Google account ID, email and name. We never see your Google password.</li>
        <li><strong>Guides you record:</strong> only while you are recording, FlowNote captures screenshots of the tab you are recording, the page address and title, and a description of the element you clicked or typed into. Typed values from password fields are never read or stored. Smart Blur can hide other sensitive text before a screenshot is taken.</li>
        <li><strong>Backups and share links:</strong> guides you record or save are backed up to your FlowNote account, and files you choose to share are stored so the people you share them with can open them.</li>
        <li><strong>Voice narration:</strong> if you turn on narration, audio is sent for transcription and the transcript is used to write step descriptions. Transcripts are never included in exports.</li>
        <li><strong>Billing:</strong> payments are handled by Stripe. We store your Stripe customer ID, plan and renewal date, never your card number.</li>
        <li><strong>Usage counts:</strong> the number of recordings you have made and AI requests per day, to apply plan limits.</li>
      </ul>
      <p>FlowNote does not record anything when you are not recording, does not track your browsing, and contains no analytics or advertising trackers.</p>
      <h2>How we use it</h2>
      <p>
        Only to provide FlowNote: to sign you in, back up and sync your guides, host share links, write step descriptions with AI,
        apply plan limits and process payments. We do not sell your data, use it for advertising, or use it to train AI models.
      </p>
      <h2>Who we share it with</h2>
      <ul>
        <li><strong>OpenAI</strong> (or the AI provider whose key you add) receives step text, screenshots and audio when you use AI features, to generate descriptions and transcripts.</li>
        <li><strong>Stripe</strong> processes payments.</li>
        <li><strong>Our hosting and storage providers</strong> (Railway and its storage) hold the database and files.</li>
        <li><strong>Our email provider</strong> sends account emails such as password resets.</li>
        <li><strong>Google</strong> when you choose to sign in with Google.</li>
      </ul>
      <p>We disclose data to others only if required by law.</p>
      <h2>Where it lives and how long</h2>
      <p>
        Guides are stored in your browser and, as a backup, in your account until you delete them or your account. Data is sent
        over HTTPS. Personal AI keys you add are encrypted at rest.
      </p>
      <h2>Your choices</h2>
      <ul>
        <li>Delete any guide or share link at any time.</li>
        <li>Delete your account from the Account page. This removes your account, backups and share links and cancels any subscription.</li>
        <li>Ask for a copy of your data, or ask any question, at <a className="underline" href={`mailto:${contact}`}>{contact}</a>.</li>
      </ul>
      <h2>Chrome Web Store Limited Use</h2>
      <p>
        FlowNote&apos;s use of information received from Chrome APIs adheres to the Chrome Web Store User Data Policy, including the
        Limited Use requirements.
      </p>
      <h2>Children</h2>
      <p>FlowNote is not directed at children under 13 and we do not knowingly collect their data.</p>
      <h2>Changes</h2>
      <p>If this policy changes we will update the date above and, for significant changes, tell you by email.</p>
    </LegalPage>
  );
}

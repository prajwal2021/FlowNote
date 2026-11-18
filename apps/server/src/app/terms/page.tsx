import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = { title: 'Terms of Service · FlowNote' };

export default function TermsPage() {
  const contact = process.env.SUPPORT_EMAIL ?? 'support@flownote.app';
  return (
    <LegalPage title="Terms of Service" updated="November 17, 2026">
      <p>By creating a FlowNote account or using FlowNote you agree to these terms.</p>
      <h2>Your account</h2>
      <p>Keep your sign-in details safe. You are responsible for what happens under your account. You must be at least 13 years old.</p>
      <h2>Plans and payment</h2>
      <ul>
        <li>The free plan includes a limited number of recordings. FlowNote Pro removes that limit.</li>
        <li>Pro is a subscription billed in advance through Stripe and renews automatically until you cancel. You can cancel at any time from the Account page; you keep Pro until the end of the period you paid for.</li>
        <li>Except where the law requires otherwise, payments are not refundable. Prices may change with notice before your next renewal.</li>
      </ul>
      <h2>Your content</h2>
      <p>
        Guides you create belong to you. You give us permission to store, process and display them only to run FlowNote for you
        and the people you share them with. Do not record or share content you do not have the right to, or other people&apos;s
        personal data without their permission.
      </p>
      <h2>Acceptable use</h2>
      <p>Do not use FlowNote to break the law, infringe others&apos; rights, abuse the AI features, or try to break or overload the service.</p>
      <h2>AI features</h2>
      <p>AI-written descriptions can be wrong. Review guides before you rely on or share them. Daily AI limits apply.</p>
      <h2>Ending</h2>
      <p>You can delete your account at any time. We may suspend accounts that break these terms.</p>
      <h2>Disclaimer</h2>
      <p>
        FlowNote is provided &quot;as is&quot; without warranties. To the extent the law allows, our liability is limited to the
        amount you paid us in the 12 months before the claim.
      </p>
      <h2>Contact</h2>
      <p><a className="underline" href={`mailto:${contact}`}>{contact}</a></p>
    </LegalPage>
  );
}

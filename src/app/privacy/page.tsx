import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | Tarot",
  description: "Privacy Policy for the Tarot reading app.",
};

export default function PrivacyPage() {
  return (
    <PageShell>
    <main className="legal-page container">
      <article className="legal-page__content">
        <h1>Privacy Policy</h1>
        <p><em>Last updated: April 6, 2026</em></p>

        <p>
          This Privacy Policy explains how Tarot (&quot;we&quot;, &quot;us&quot;)
          collects, uses, and protects your personal data when you use our
          Service. We comply with the EU General Data Protection Regulation
          (GDPR) and, where applicable, the California Consumer Privacy Act
          (CCPA).
        </p>

        <h2>1. Data Controller</h2>
        <p>
          The data controller responsible for your personal data is the operator
          of this Service. For privacy inquiries, contact us at{" "}
          <a href="mailto:privacy@example.com">privacy@example.com</a>.
        </p>

        <h2>2. Data We Collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> email address, display name, hashed
            password (or third-party OAuth identifier).
          </li>
          <li>
            <strong>Usage data:</strong> reading history, questions you submit,
            timestamps, and preferences.
          </li>
          <li>
            <strong>Technical data:</strong> IP address, browser type, device
            information, and basic analytics.
          </li>
          <li>
            <strong>Cookies:</strong> authentication session cookies and, where
            applicable, analytics cookies (only with your consent).
          </li>
        </ul>

        <h2>3. Legal Basis for Processing (GDPR)</h2>
        <ul>
          <li>
            <strong>Contract:</strong> to provide the Service you requested
            (Art. 6(1)(b) GDPR).
          </li>
          <li>
            <strong>Consent:</strong> for optional analytics and marketing
            (Art. 6(1)(a) GDPR).
          </li>
          <li>
            <strong>Legitimate interest:</strong> to secure the Service and
            prevent abuse (Art. 6(1)(f) GDPR).
          </li>
          <li>
            <strong>Legal obligation:</strong> where required by law
            (Art. 6(1)(c) GDPR).
          </li>
        </ul>

        <h2>4. How We Use Your Data</h2>
        <ul>
          <li>To create and manage your account;</li>
          <li>To provide tarot readings and related features;</li>
          <li>To communicate important updates about the Service;</li>
          <li>To secure the Service and prevent fraud or abuse;</li>
          <li>To comply with legal obligations.</li>
        </ul>

        <h2>5. Third-Party Processors</h2>
        <p>
          We use trusted service providers to operate the Service. These
          processors act on our behalf under data processing agreements:
        </p>
        <ul>
          <li><strong>Vercel Inc.</strong> — hosting and infrastructure (USA / EU regions);</li>
          <li><strong>PostgreSQL database provider</strong> — data storage (via Vercel Marketplace);</li>
          <li><strong>NextAuth OAuth providers</strong> — for third-party sign-in, if used (e.g., Google);</li>
          <li><strong>Email delivery provider</strong> — for transactional emails, if applicable.</li>
        </ul>

        <h2>6. International Transfers</h2>
        <p>
          Some processors may be located outside the European Economic Area.
          Where this occurs, we rely on Standard Contractual Clauses or
          equivalent safeguards as required by GDPR.
        </p>

        <h2>7. Data Retention</h2>
        <p>
          We retain account data for as long as your account is active. If you
          delete your account, we delete or anonymize personal data within 30
          days, except where retention is required by law.
        </p>

        <h2>8. Your Rights (GDPR / CCPA)</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you;</li>
          <li>Request correction of inaccurate data;</li>
          <li>Request deletion (&quot;right to be forgotten&quot;);</li>
          <li>Restrict or object to processing;</li>
          <li>Data portability;</li>
          <li>Withdraw consent at any time;</li>
          <li>Lodge a complaint with your local supervisory authority.</li>
        </ul>
        <p>
          California residents have additional rights under the CCPA, including
          the right to know what personal data we collect and the right to
          opt out of any sale of personal data. We do not sell personal data.
        </p>

        <h2>9. Cookies</h2>
        <p>
          We use strictly necessary cookies for authentication. Optional
          analytics cookies are only set after you give consent via our cookie
          banner. You can withdraw consent at any time through your browser
          settings.
        </p>

        <h2>10. Security</h2>
        <p>
          We implement reasonable technical and organizational measures to
          protect your data, including encryption in transit (HTTPS), hashed
          passwords, and access controls. No system is perfectly secure, and we
          cannot guarantee absolute security.
        </p>

        <h2>11. Children</h2>
        <p>
          The Service is not directed to children under 16. We do not knowingly
          collect personal data from children. If you believe a child has
          provided us with data, please contact us for removal.
        </p>

        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy. Material changes will be announced
          on this page with an updated &quot;last updated&quot; date.
        </p>

        <h2>13. Contact</h2>
        <p>
          For any privacy-related questions or to exercise your rights, contact{" "}
          <a href="mailto:privacy@example.com">privacy@example.com</a>.
        </p>

        <hr />
        <p>
          <small>
            <strong>Note:</strong> This is a draft template and not legal advice.
            Please have it reviewed by a qualified lawyer before launch, and
            fill in the actual company name, address, and contact details.
          </small>
        </p>
      </article>
    </main>
    </PageShell>
  );
}

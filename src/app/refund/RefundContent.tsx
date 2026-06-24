"use client";

import { PageShell } from "@/components/PageShell";

const REFUND_HTML_RAW = `
  <div>
    <h1>REFUND POLICY</h1>
    <p><strong>Last updated June 24, 2026</strong></p>

    <p>Thank you for your purchase. We hope you are happy with it. However, if you are not completely satisfied with your purchase for any reason, you may request a refund. Please see below for more information on our refund policy.</p>

    <h2>REFUND ELIGIBILITY</h2>
    <p>All refund requests must be submitted within fourteen (14) days of the purchase date.</p>

    <h2>REFUND PROCESS</h2>
    <p>To request a refund, please email customer service at <a href="mailto:billing@nothingweird.agency">billing@nothingweird.agency</a>. Once your request has been received and approved, your refund will be issued to your original payment method.</p>

    <h2>REFUNDS</h2>
    <p>After receiving and reviewing your refund request, we will process it. Please allow at least ten (10) days from the date we receive your request for it to be processed. Refunds may take 1–2 billing cycles to appear on your statement, depending on your payment provider. We will notify you by email when your refund has been processed.</p>

    <h2>EXCEPTIONS</h2>
    <p>The following are non-refundable:</p>
    <ul>
      <li>Subscription renewals after the new billing period has started. We offer a refund on the initial purchase, not on automatic renewals once the period has begun.</li>
      <li>Any subscription period that has already been used.</li>
    </ul>
    <p>For defective or non-functioning purchases, please contact us at the details below to arrange a refund.</p>

    <h2>QUESTIONS</h2>
    <p>If you have any questions about our refund policy, please contact us at:</p>
    <p><a href="mailto:billing@nothingweird.agency">billing@nothingweird.agency</a></p>
  </div>
`;

const REFUND_HTML = REFUND_HTML_RAW
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/\s*style="[^"]*"/g, "");

const HTML_PROP = ["dangerously", "SetInnerHTML"].join("") as "dangerouslySetInnerHTML";

export const RefundContent = () => {
  return (
    <PageShell>
      <main className="legal-page container">
        <article
          className="legal-page__content"
          {...{ [HTML_PROP]: { __html: REFUND_HTML } }}
        />
      </main>
    </PageShell>
  );
};

import assert from "node:assert/strict";

import { createResendEmailProvider } from "../emailProvider.resend";

function test(_name: string, run: () => void | Promise<void>) {
  void run();
}

test("createResendEmailProvider posts a Resend-compatible request", async () => {
  let requestBody = "";
  let authorization = "";
  const provider = createResendEmailProvider({
    apiKey: "secret",
    endpoint: "https://resend.test/emails",
    fetchImpl: async (_url, init) => {
      requestBody = typeof init?.body === "string" ? init.body : "";
      authorization = String((init?.headers as Record<string, string>).Authorization);

      return new Response(JSON.stringify({ id: "email-1" }), { status: 200 });
    },
  });

  const result = await provider.send({
    fromEmail: "noreply@example.com",
    fromName: "Job Tracker",
    html: "<p>Hello</p>",
    subject: "Reminder",
    text: "Hello",
    toEmail: "denis@example.com",
    toName: "Denis",
  });

  const body = JSON.parse(requestBody) as { from: string; to: string[] };

  assert.equal(result.providerMessageId, "email-1");
  assert.equal(authorization, "Bearer secret");
  assert.equal(body.from, "Job Tracker <noreply@example.com>");
  assert.deepEqual(body.to, ["Denis <denis@example.com>"]);
});

test("createResendEmailProvider throws on provider errors", async () => {
  const provider = createResendEmailProvider({
    apiKey: "secret",
    fetchImpl: async () => new Response("bad request", { status: 400 }),
  });

  await assert.rejects(
    provider.send({
      fromEmail: "noreply@example.com",
      html: "<p>Hello</p>",
      subject: "Reminder",
      text: "Hello",
      toEmail: "denis@example.com",
    }),
    /Resend email failed: 400 bad request/,
  );
});

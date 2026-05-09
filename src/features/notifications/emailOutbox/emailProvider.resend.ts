import type {
  EmailProvider,
  EmailSendRequest,
  EmailSendResult,
} from "./emailOutbox.worker";

interface ResendProviderConfig {
  apiKey: string;
  endpoint?: string | undefined;
  fetchImpl?: typeof fetch | undefined;
}

interface ResendSuccessResponse {
  id?: string;
}

export function createResendEmailProvider({
  apiKey,
  endpoint = "https://api.resend.com/emails",
  fetchImpl = fetch,
}: ResendProviderConfig): EmailProvider {
  return {
    async send(message: EmailSendRequest): Promise<EmailSendResult> {
      const response = await fetchImpl(endpoint, {
        body: JSON.stringify({
          from: formatAddress(message.fromEmail, message.fromName),
          html: message.html,
          subject: message.subject,
          text: message.text,
          to: [formatAddress(message.toEmail, message.toName)],
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Resend email failed: ${response.status} ${await response.text()}`);
      }

      const data = await readJson(response);

      return {
        providerMessageId: data.id,
      };
    },
  };
}

function formatAddress(email: string, name: string | undefined): string {
  const trimmedName = name?.trim();
  if (!trimmedName) return email;

  return `${trimmedName} <${email}>`;
}

async function readJson(response: Response): Promise<ResendSuccessResponse> {
  const parsed: unknown = await response.json().catch(() => ({}));
  if (!isObject(parsed)) return {};

  return typeof parsed.id === "string" ? { id: parsed.id } : {};
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

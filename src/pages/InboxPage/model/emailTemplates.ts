export type TemplateVariable =
  | "{{contactName}}"
  | "{{companyName}}"
  | "{{roleTitle}}"
  | "{{myName}}"
  | "{{interviewDate}}"
  | "{{offerDeadline}}";

export type TemplateCategory =
  | "followup"
  | "thankyou"
  | "negotiation"
  | "application"
  | "checkin";

export interface EmailTemplate {
  id: string;
  category: TemplateCategory;
  label: string;
  description: string;
  subject: string;
  body: string;
  /** Variables that appear in this template */
  variables: TemplateVariable[];
}

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  followup: "Follow-up",
  thankyou: "Thank you",
  negotiation: "Negotiation",
  application: "Application",
  checkin: "Check-in",
};

export const CATEGORY_EMOJI: Record<TemplateCategory, string> = {
  followup: "📬",
  thankyou: "🙏",
  negotiation: "💼",
  application: "📩",
  checkin: "👋",
};

export const BUILT_IN_TEMPLATES: EmailTemplate[] = [
  // ── Follow-ups ──────────────────────────────────────────────────────────────
  {
    id: "followup-after-apply",
    category: "followup",
    label: "Follow-up after applying",
    description: "Send 5–7 days after submitting your application",
    subject: "Following up — {{roleTitle}} application",
    body: `Hi {{contactName}},

I hope you're doing well. I wanted to follow up on my application for the {{roleTitle}} position at {{companyName}} that I submitted last week.

I'm very excited about the opportunity and would love to learn more about next steps. Please let me know if you need any additional information from my side.

Looking forward to hearing from you.

Best regards,
{{myName}}`,
    variables: ["{{contactName}}", "{{roleTitle}}", "{{companyName}}", "{{myName}}"],
  },
  {
    id: "followup-after-interview",
    category: "followup",
    label: "Follow-up after interview",
    description: "Send 3–5 days after the interview if you haven't heard back",
    subject: "Following up — {{roleTitle}} interview",
    body: `Hi {{contactName}},

I hope you're well. I wanted to follow up after our conversation on {{interviewDate}} regarding the {{roleTitle}} role at {{companyName}}.

I remain very enthusiastic about the opportunity and am eager to hear your thoughts. Please let me know if there's anything else you need from me.

Best regards,
{{myName}}`,
    variables: ["{{contactName}}", "{{roleTitle}}", "{{companyName}}", "{{interviewDate}}", "{{myName}}"],
  },

  // ── Thank you ───────────────────────────────────────────────────────────────
  {
    id: "thankyou-after-interview",
    category: "thankyou",
    label: "Thank you after interview",
    description: "Send within 24 hours of the interview",
    subject: "Thank you — {{roleTitle}} interview",
    body: `Hi {{contactName}},

Thank you so much for taking the time to speak with me today about the {{roleTitle}} position at {{companyName}}. I really enjoyed our conversation and learning more about the team and the challenges ahead.

The discussion reinforced my excitement about this opportunity. I believe my experience aligns well with what you're looking for, and I'm confident I could make a meaningful contribution.

Please don't hesitate to reach out if you have any further questions.

Best regards,
{{myName}}`,
    variables: ["{{contactName}}", "{{roleTitle}}", "{{companyName}}", "{{myName}}"],
  },
  {
    id: "thankyou-after-rejection",
    category: "thankyou",
    label: "Graceful response to rejection",
    description: "Keep the door open for future opportunities",
    subject: "Re: {{roleTitle}} position at {{companyName}}",
    body: `Hi {{contactName}},

Thank you for letting me know. While I'm disappointed, I genuinely appreciate the time you and the team invested in the process.

I remain a great admirer of {{companyName}} and would welcome the chance to be considered for future roles that might be a better fit. Please keep my details on file.

Wishing you all the best.

Best regards,
{{myName}}`,
    variables: ["{{contactName}}", "{{roleTitle}}", "{{companyName}}", "{{myName}}"],
  },

  // ── Negotiation ─────────────────────────────────────────────────────────────
  {
    id: "negotiation-counter-offer",
    category: "negotiation",
    label: "Salary counter-offer",
    description: "Politely request a higher offer",
    subject: "Re: Offer for {{roleTitle}} — Discussion",
    body: `Hi {{contactName}},

Thank you so much for the offer for the {{roleTitle}} position at {{companyName}}. I'm genuinely excited about joining the team.

After careful consideration, I'd love to discuss the compensation package. Based on my research and experience, I was hoping we could explore a figure closer to [YOUR TARGET]. I'm confident that I can deliver strong results, and I'd love to find a number that works for both sides.

I'm happy to jump on a quick call to discuss. Would that work?

Best regards,
{{myName}}`,
    variables: ["{{contactName}}", "{{roleTitle}}", "{{companyName}}", "{{myName}}"],
  },
  {
    id: "negotiation-deadline-extension",
    category: "negotiation",
    label: "Request offer deadline extension",
    description: "Buy time to evaluate other opportunities",
    subject: "Re: Offer for {{roleTitle}} — Timeline",
    body: `Hi {{contactName}},

Thank you again for the offer for the {{roleTitle}} role at {{companyName}} — I'm very excited about it.

I wanted to ask whether it would be possible to have until {{offerDeadline}} to formally respond. I want to make sure I can give you a fully considered answer and set myself up to hit the ground running.

Please let me know if this timeline works on your end.

Best regards,
{{myName}}`,
    variables: ["{{contactName}}", "{{roleTitle}}", "{{companyName}}", "{{offerDeadline}}", "{{myName}}"],
  },

  // ── Application ─────────────────────────────────────────────────────────────
  {
    id: "cold-outreach",
    category: "application",
    label: "Cold outreach to recruiter",
    description: "Introduce yourself before applying",
    subject: "Interested in opportunities at {{companyName}}",
    body: `Hi {{contactName}},

I hope this message finds you well. My name is {{myName}} and I'm a [YOUR ROLE/TITLE] with [X] years of experience in [YOUR FIELD].

I've been following {{companyName}} closely and am very impressed by [SOMETHING SPECIFIC]. I believe my background in [YOUR SKILLS] could be a great match for your team.

I would love to learn more about any open roles that might align with my profile. I've attached my CV for your reference — would you have 15 minutes for a brief call?

Best regards,
{{myName}}`,
    variables: ["{{contactName}}", "{{companyName}}", "{{myName}}"],
  },

  // ── Check-in ────────────────────────────────────────────────────────────────
  {
    id: "checkin-long-silence",
    category: "checkin",
    label: "Check-in after long silence",
    description: "Re-open a stalled conversation",
    subject: "Checking in — {{roleTitle}} at {{companyName}}",
    body: `Hi {{contactName}},

I hope you're doing well. I'm reaching out to check in on my application for the {{roleTitle}} position at {{companyName}}.

I understand the hiring process can take time, and I remain very interested in the role. Please let me know if the position is still open or if there are any updates.

Thank you for your time.

Best regards,
{{myName}}`,
    variables: ["{{contactName}}", "{{roleTitle}}", "{{companyName}}", "{{myName}}"],
  },
  {
    id: "checkin-networking",
    category: "checkin",
    label: "Networking check-in",
    description: "Stay on a recruiter's radar without being pushy",
    subject: "Keeping in touch — {{myName}}",
    body: `Hi {{contactName}},

I hope things are going well at {{companyName}}! I wanted to drop a quick note to stay in touch.

Since we last spoke, I've [SOMETHING YOU'VE ACCOMPLISHED OR LEARNED]. I continue to follow {{companyName}}'s work closely and would love to reconnect when the timing is right.

Please don't hesitate to reach out if any suitable roles come up.

Best regards,
{{myName}}`,
    variables: ["{{contactName}}", "{{companyName}}", "{{myName}}"],
  },
];

export const ALL_CATEGORIES: TemplateCategory[] = [
  "followup",
  "thankyou",
  "negotiation",
  "application",
  "checkin",
];

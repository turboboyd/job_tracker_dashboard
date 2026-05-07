import { AccountSettingsLayout } from "../ui/AccountSettingsLayout";

const PLAN_FEATURES = [
  "Unlimited job loops",
  "AI match scoring",
  "Application tracking",
  "Resources library",
  "Pipeline analytics",
  "Priority support",
];

export default function BillingSettingsPage() {
  return (
    <AccountSettingsLayout
      title="Billing"
      subtitle="Plan and payment details."
      content={
        <div className="space-y-4">
          {/* Current plan */}
          <div className="rounded-[14px] border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13.5px] font-semibold text-foreground">Free plan</div>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  You are on the free tier. Upgrade to unlock all features.
                </p>
              </div>
              <div className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground">
                Free
              </div>
            </div>
          </div>

          {/* Pro plan card */}
          <div className="rounded-[14px] border-2 border-primary/30 bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13.5px] font-semibold text-foreground">
                  Loopboard Pro
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-semibold text-primary">
                    Coming soon
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] text-muted-foreground">Everything you need for an effective job search.</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[20px] font-bold text-foreground leading-none">€9</div>
                <div className="text-[11px] text-muted-foreground">/ month</div>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[12.5px] text-foreground">
                  <svg className="h-3.5 w-3.5 shrink-0 text-primary" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="mt-4 w-full rounded-[8px] bg-primary px-4 py-2 text-[12.5px] font-medium text-primary-foreground opacity-50 cursor-not-allowed"
            >
              Upgrade to Pro — coming soon
            </button>
          </div>

          {/* Payment method */}
          <div className="rounded-[14px] border border-border bg-card p-5">
            <div className="text-[13.5px] font-semibold text-foreground mb-1">Payment method</div>
            <p className="text-[12.5px] text-muted-foreground">
              Payment integration coming soon.
            </p>
          </div>
        </div>
      }
    />
  );
}

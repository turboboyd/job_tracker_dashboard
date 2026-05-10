import { AccountSettingsLayout } from "../ui/AccountSettingsLayout";

export default function SecuritySettingsPage() {
  return (
    <AccountSettingsLayout
      title="Security"
      subtitle="Password, 2FA and active sessions."
      content={
        <div className="space-y-4">
          <div className="rounded-[14px] border border-border bg-card p-5">
            <div className="text-[13.5px] font-semibold text-foreground mb-1">Change password</div>
            <p className="text-[12.5px] text-muted-foreground mb-4">
              Password change and two-factor authentication coming soon.
            </p>
            <div className="space-y-3">
              {["Current password", "New password", "Confirm new password"].map((label) => (
                <div key={label}>
                  <label className="mb-1 block text-[12px] font-medium text-foreground">{label}</label>
                  <input
                    type="password"
                    disabled
                    placeholder="••••••••"
                    className="w-full max-w-sm rounded-[8px] border border-border bg-muted px-3 py-2 text-[13px] text-muted-foreground placeholder:text-muted-foreground/50 disabled:cursor-not-allowed"
                  />
                </div>
              ))}
            </div>
            <button
              disabled
              className="mt-4 rounded-[8px] bg-primary px-4 py-2 text-[12.5px] font-medium text-primary-foreground opacity-40 cursor-not-allowed"
            >
              Update password
            </button>
          </div>

          <div className="rounded-[14px] border border-border bg-card p-5">
            <div className="text-[13.5px] font-semibold text-foreground mb-1">Two-factor authentication</div>
            <p className="text-[12.5px] text-muted-foreground">
              Protect your account with an authenticator app. Coming soon.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              Not enabled
            </div>
          </div>

          <div className="rounded-[14px] border border-border bg-card p-5">
            <div className="text-[13.5px] font-semibold text-foreground mb-1">Active sessions</div>
            <p className="text-[12.5px] text-muted-foreground">
              Session management coming soon.
            </p>
          </div>
        </div>
      }
    />
  );
}

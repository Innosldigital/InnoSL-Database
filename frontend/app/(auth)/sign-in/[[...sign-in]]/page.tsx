import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#2D1B69]"
      style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #4A2FA0 0%, #2D1B69 60%)" }}>
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#38BDF8] flex items-center justify-center text-[#2D1B69] font-bold text-lg">
            ISL
          </div>
          <div>
            <p className="text-white text-xl font-semibold">Innovation SL</p>
            <p className="text-[#BAE6FD] text-sm">Ecosystem Intelligence Platform</p>
          </div>
        </div>

        {/* Clerk sign-in widget */}
        <SignIn
          appearance={{
            elements: {
              rootBox:             "shadow-2xl",
              card:                "rounded-2xl border-0 shadow-2xl",
              headerTitle:         "text-[#2D1B69] font-semibold",
              headerSubtitle:      "text-slate-500",
              formButtonPrimary:   "bg-[#2D1B69] hover:bg-[#4A2FA0] text-white rounded-lg",
              footerActionLink:    "text-[#4A2FA0] hover:text-[#2D1B69]",
              formFieldInput:      "rounded-lg border-border focus:ring-[#2D1B69]",
            },
          }}
        />
        <p className="text-[#BAE6FD] text-xs opacity-60">
          Access is restricted to Innovation SL staff and authorised partners.
        </p>
      </div>
    </main>
  );
}

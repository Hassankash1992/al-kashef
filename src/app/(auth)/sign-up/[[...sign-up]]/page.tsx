import { SignUp } from "@clerk/nextjs";
import { Camera } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" dir="rtl">
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-amber-400 blur-xl opacity-50 rounded-2xl" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-2xl">
              <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">EventFace</h1>
          <p className="text-xs sm:text-sm text-amber-400/80 mt-1.5 font-medium">منصة معارض الفعاليات الذكية</p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full flex justify-center",
              card: "bg-white border border-amber-100 shadow-2xl rounded-2xl sm:rounded-3xl",
              headerTitle: "text-zinc-900 font-bold",
              headerSubtitle: "text-zinc-500",
              socialButtonsBlockButton: "border-zinc-200 text-zinc-700 hover:bg-zinc-50",
              formFieldLabel: "text-zinc-800 font-semibold",
              formFieldInput: "border-2 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100",
              formButtonPrimary: "bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black font-bold normal-case shadow-lg shadow-amber-500/20",
              footerActionLink: "text-amber-600 hover:text-amber-700 font-semibold",
              identityPreviewEditButton: "text-amber-600 hover:text-amber-700",
              formResendCodeLink: "text-amber-600 hover:text-amber-700",
              dividerLine: "bg-zinc-200",
              dividerText: "text-zinc-500",
              footer: "bg-zinc-50",
            },
            variables: {
              colorPrimary: "#d97706",
              borderRadius: "0.75rem",
            },
          }}
        />
      </div>
    </div>
  );
}

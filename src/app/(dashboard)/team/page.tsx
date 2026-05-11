import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { Info } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "المالك",
  ADMIN: "مدير",
  PHOTOGRAPHER: "مصور",
  EDITOR: "محرر",
  VIEWER: "مشاهد",
  SUPPORT: "دعم فني",
};

export default async function TeamPage() {
  const tenantUser = await requireTenant();
  const members = await db.tenantUser.findMany({
    where: { tenantId: tenantUser.tenant.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">الفريق</h1>
        <p className="text-zinc-500 text-sm mt-1">{members.length} عضو في فريقك</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        {members.map((member, i) => (
          <div
            key={member.id}
            className={`flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-zinc-50 transition-colors ${
              i < members.length - 1 ? "border-b border-zinc-50" : ""
            }`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-full flex items-center justify-center text-black font-bold text-sm shrink-0">
              {member.clerkUserId.slice(-2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-zinc-700 truncate" dir="ltr">{member.clerkUserId}</p>
              <p className="text-xs text-zinc-400 mt-0.5">عضو منذ {new Date(member.createdAt).toLocaleDateString("ar-SA")}</p>
            </div>
            <RoleBadge role={member.role} />
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gradient-to-l from-amber-50 to-amber-50/50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
          <Info className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900">دعوة أعضاء جدد قريباً</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            سنطلق ميزة دعوة أعضاء الفريق بالإيميل في التحديث القادم.
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    OWNER: "bg-gradient-to-l from-amber-100 to-amber-50 text-amber-800 border-amber-300",
    ADMIN: "bg-zinc-900 text-amber-400 border-zinc-900",
    PHOTOGRAPHER: "bg-blue-50 text-blue-700 border-blue-200",
    EDITOR: "bg-purple-50 text-purple-700 border-purple-200",
    VIEWER: "bg-zinc-50 text-zinc-600 border-zinc-200",
    SUPPORT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border shrink-0 ${styles[role] ?? styles.VIEWER}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

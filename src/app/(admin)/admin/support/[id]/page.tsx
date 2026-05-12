import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import SupportChat from "@/components/support/SupportChat";

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, name: true, slug: true, plan: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) notFound();

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/support"
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-amber-600 transition-colors shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-amber-600 shrink-0" />
            {ticket.subject}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            <span className="font-bold text-amber-700">@{ticket.tenant.slug}</span> · {ticket.tenant.name} · {ticket.tenant.plan}
          </p>
        </div>
      </div>

      <SupportChat
        ticket={{
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          pinnedByAdmin: ticket.pinnedByAdmin,
          assignedTo: ticket.assignedTo,
        }}
        initialMessages={ticket.messages.map((m) => ({
          id: m.id,
          fromType: m.fromType,
          fromName: m.fromName,
          body: m.body,
          isInternal: m.isInternal,
          createdAt: m.createdAt.toISOString(),
        }))}
        viewerType="ADMIN"
      />
    </div>
  );
}

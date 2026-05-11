import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // إذا عنده حساب شركة، يطلع للوحة التحكم مباشرة
  const existing = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (existing) redirect("/dashboard");

  return <OnboardingForm />;
}

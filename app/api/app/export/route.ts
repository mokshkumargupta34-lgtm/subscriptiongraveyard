import { auth } from "@/auth";
import { getDashboardData, subscriptionsCsv } from "@/lib/subs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("unauthorized", { status: 401 });

  const subs = await getDashboardData(session.user.id);
  return new Response(subscriptionsCsv(subs), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="subscriptions.csv"',
    },
  });
}

import { auth } from "@/auth";
import { GmailAuthError } from "@/lib/gmail";
import { runScan } from "@/lib/scan";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* SSE: EventSource("/api/app/scan/stream") — emits progress events
   ("2,847 receipts parsed · 14 spirits found", live). Auth enforced
   by middleware + double-checked here. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("unauthorized", { status: 401 });
  const userId = session.user.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        send({ phase: "starting" });
        const final = await runScan(userId, (p) => send(p));
        send({ ...final, phase: "done" });
      } catch (err) {
        send({
          phase: "error",
          reconsent: err instanceof GmailAuthError,
          message: err instanceof Error ? err.message : "scan failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

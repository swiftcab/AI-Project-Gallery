import { Queue } from "bullmq";
import { newBullConnection } from "@/lib/redis";

export const QUEUE_NAME = "decroche";

export type JobName =
  | "startConversation"
  | "agentTurn"
  | "nudge"
  | "expireConversation"
  | "notifyOwner";

export interface JobPayloads {
  startConversation: { conversationId: string };
  agentTurn: { conversationId: string; inboundMessageId: string };
  nudge: { conversationId: string };
  expireConversation: { conversationId: string };
  notifyOwner: { conversationId: string };
}

let queue: Queue | null = null;

export function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: newBullConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { age: 7 * 24 * 3600, count: 5000 },
        removeOnFail: false, // on garde les échecs pour la boucle de debug
      },
    });
  }
  return queue;
}

export async function enqueue<N extends JobName>(
  name: N,
  payload: JobPayloads[N],
  opts?: { delayMs?: number; jobId?: string },
): Promise<void> {
  await getQueue().add(name, payload, {
    delay: opts?.delayMs,
    jobId: opts?.jobId, // idempotence (ex: 1 seul expire par conversation)
  });
}

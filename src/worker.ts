import { Worker, type Job } from "bullmq";
import { newBullConnection } from "./lib/redis";
import { logger } from "./lib/logger";
import { QUEUE_NAME, type JobName } from "./queues";
import {
  jobAgentTurn,
  jobExpireConversation,
  jobNotifyOwner,
  jobNudge,
  jobSendEmail,
  jobStartConversation,
  jobTelegramCommand,
} from "./queues/jobs";

const handlers: Record<JobName, (payload: never) => Promise<void>> = {
  startConversation: jobStartConversation as never,
  agentTurn: jobAgentTurn as never,
  nudge: jobNudge as never,
  expireConversation: jobExpireConversation as never,
  notifyOwner: jobNotifyOwner as never,
  sendEmail: jobSendEmail as never,
  telegramCommand: jobTelegramCommand as never,
};

const worker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    const handler = handlers[job.name as JobName];
    if (!handler) throw new Error(`Job inconnu: ${job.name}`);
    await handler(job.data as never);
  },
  {
    connection: newBullConnection(),
    concurrency: 5,
  },
);

worker.on("completed", (job) => logger.debug({ job: job.name, id: job.id }, "job.completed"));
worker.on("failed", (job, err) =>
  logger.error({ job: job?.name, id: job?.id, err: err.message, data: job?.data }, "job.failed"),
);

logger.info("worker.started");

async function shutdown() {
  logger.info("worker.stopping");
  await worker.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

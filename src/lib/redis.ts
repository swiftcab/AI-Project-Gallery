import Redis from "ioredis";
import { getConfig } from "./config";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(getConfig().REDIS_URL, { maxRetriesPerRequest: null });
  }
  return client;
}

/** Connexion dédiée BullMQ (exigence bullmq: maxRetriesPerRequest=null). */
export function newBullConnection(): Redis {
  return new Redis(getConfig().REDIS_URL, { maxRetriesPerRequest: null });
}

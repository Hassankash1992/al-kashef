import { Queue } from "bullmq";
import IORedis from "ioredis";

let _connection: IORedis | null = null;
let _imageQueue: Queue | null = null;
let _faceQueue: Queue | null = null;

function getConnection(): IORedis {
  if (!_connection) {
    _connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return _connection;
}

export function getImageProcessingQueue(): Queue {
  if (!_imageQueue) {
    _imageQueue = new Queue("image-processing", { connection: getConnection() });
  }
  return _imageQueue;
}

export function getFaceIndexingQueue(): Queue {
  if (!_faceQueue) {
    _faceQueue = new Queue("face-indexing", { connection: getConnection() });
  }
  return _faceQueue;
}

export const QUEUE_NAMES = {
  IMAGE_PROCESSING: "image-processing",
  FACE_INDEXING: "face-indexing",
} as const;

export function getRedisConnection(): IORedis {
  return getConnection();
}

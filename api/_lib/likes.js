import { getRedis } from './redis.js';

export async function getPictureLikes(agentId, pictures) {
  if (!pictures || pictures.length === 0) return [];
  const redis = getRedis();
  const result = [];
  for (let i = 0; i < pictures.length; i++) {
    const count = await redis.scard(`ms:likes:${agentId}:${i}`);
    const rawComments = await redis.lrange(`ms:comments:${agentId}:${i}`, 0, -1);
    const comments = (rawComments || []).map((c) =>
      typeof c === 'string' ? JSON.parse(c) : c
    );
    result.push({ url: pictures[i], index: i, likes: count, comments });
  }
  return result;
}

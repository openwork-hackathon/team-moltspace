import { getRedis } from './redis.js';

export async function getPictureLikes(agentId, pictures) {
  if (!pictures || pictures.length === 0) return [];
  const redis = getRedis();
  const descriptions = await redis.hgetall(`ms:descriptions:${agentId}`) || {};
  const result = [];
  for (let i = 0; i < pictures.length; i++) {
    const count = await redis.scard(`ms:likes:${agentId}:${i}`);
    const rawComments = await redis.lrange(`ms:comments:${agentId}:${i}`, 0, -1);
    const comments = (rawComments || []).map((c) =>
      typeof c === 'string' ? JSON.parse(c) : c
    );
    const description = descriptions[i] || descriptions[String(i)] || '';
    result.push({ url: pictures[i], index: i, likes: count, comments, description });
  }
  return result;
}

import { getRedis } from './redis.js';

export async function getPictureLikes(agentId, pictures) {
  if (!pictures || pictures.length === 0) return [];
  const redis = getRedis();
  const result = [];
  for (let i = 0; i < pictures.length; i++) {
    const count = await redis.scard(`ms:likes:${agentId}:${i}`);
    result.push({ url: pictures[i], index: i, likes: count });
  }
  return result;
}

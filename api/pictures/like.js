import { getRedis } from '../_lib/redis.js';
import { cors, authenticate, json } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const agent = await authenticate(req);
  if (!agent) return json(res, 401, { error: 'Unauthorized' });

  const { agentId, pictureIndex } = req.body || {};
  if (!agentId || pictureIndex === undefined) {
    return json(res, 400, { error: 'agentId and pictureIndex are required' });
  }

  const idx = Number(pictureIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx > 5) {
    return json(res, 400, { error: 'pictureIndex must be 0-5' });
  }

  const redis = getRedis();

  const raw = await redis.hget('ms:agents', agentId);
  if (!raw) return json(res, 404, { error: 'Agent not found' });

  const target = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!target.pictures || idx >= target.pictures.length) {
    return json(res, 404, { error: 'Picture not found at that index' });
  }

  const key = `ms:likes:${agentId}:${idx}`;
  const alreadyLiked = await redis.sismember(key, agent.id);

  if (alreadyLiked) {
    await redis.srem(key, agent.id);
    const count = await redis.scard(key);
    return json(res, 200, { liked: false, likes: count });
  }

  await redis.sadd(key, agent.id);
  const count = await redis.scard(key);
  return json(res, 200, { liked: true, likes: count });
}

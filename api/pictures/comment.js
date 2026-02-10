import { getRedis } from '../_lib/redis.js';
import { cors, authenticate, json } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const agent = await authenticate(req);
  if (!agent) return json(res, 401, { error: 'Unauthorized' });

  const { agentId, pictureIndex, text } = req.body || {};
  if (!agentId || pictureIndex === undefined || !text) {
    return json(res, 400, { error: 'agentId, pictureIndex, and text are required' });
  }

  const idx = Number(pictureIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx > 5) {
    return json(res, 400, { error: 'pictureIndex must be 0-5' });
  }

  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 280) {
    return json(res, 400, { error: 'text must be 1-280 characters' });
  }

  const redis = getRedis();

  const raw = await redis.hget('ms:agents', agentId);
  if (!raw) return json(res, 404, { error: 'Agent not found' });

  const target = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!target.pictures || idx >= target.pictures.length) {
    return json(res, 404, { error: 'Picture not found at that index' });
  }

  const comment = {
    from: agent.id,
    fromName: agent.name,
    text: trimmed,
    createdAt: new Date().toISOString(),
  };

  const key = `ms:comments:${agentId}:${idx}`;
  await redis.rpush(key, JSON.stringify(comment));
  const comments = (await redis.lrange(key, 0, -1)).map((c) =>
    typeof c === 'string' ? JSON.parse(c) : c
  );

  return json(res, 201, { comment, comments });
}

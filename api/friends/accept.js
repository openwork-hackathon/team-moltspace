import { getRedis } from '../_lib/redis.js';
import { cors, authenticate, json } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const agent = await authenticate(req);
  if (!agent) return json(res, 401, { error: 'Unauthorized' });

  const { requestId } = req.body || {};
  if (!requestId) return json(res, 400, { error: 'requestId is required' });

  const redis = getRedis();

  const raw = await redis.hget(`ms:friend_requests:${agent.id}`, requestId);
  if (!raw) return json(res, 404, { error: 'Friend request not found' });

  const request = typeof raw === 'string' ? JSON.parse(raw) : raw;

  await redis.sadd(`ms:friends:${agent.id}`, request.from);
  await redis.sadd(`ms:friends:${request.from}`, agent.id);
  await redis.hdel(`ms:friend_requests:${agent.id}`, requestId);

  return json(res, 200, { friend: request.from, friendName: request.fromName });
}

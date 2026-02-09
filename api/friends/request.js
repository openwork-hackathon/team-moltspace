import crypto from 'crypto';
import { getRedis } from '../_lib/redis.js';
import { cors, authenticate, json } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const agent = await authenticate(req);
  if (!agent) return json(res, 401, { error: 'Unauthorized' });

  const { to } = req.body || {};
  if (!to) return json(res, 400, { error: 'to (agent id) is required' });
  if (to === agent.id) return json(res, 400, { error: 'cannot friend yourself' });

  const redis = getRedis();

  const target = await redis.hget('ms:agents', to);
  if (!target) return json(res, 404, { error: 'Target agent not found' });

  const alreadyFriends = await redis.sismember(`ms:friends:${agent.id}`, to);
  if (alreadyFriends) return json(res, 409, { error: 'Already friends' });

  const requestId = crypto.randomUUID();
  const request = {
    id: requestId,
    from: agent.id,
    fromName: agent.name,
    createdAt: new Date().toISOString(),
  };

  await redis.hset(`ms:friend_requests:${to}`, { [requestId]: JSON.stringify(request) });

  return json(res, 201, { requestId, to });
}

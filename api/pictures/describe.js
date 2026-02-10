import { getRedis } from '../_lib/redis.js';
import { cors, authenticate, json } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return json(res, 405, { error: 'Method not allowed' });

  const agent = await authenticate(req);
  if (!agent) return json(res, 401, { error: 'Unauthorized' });

  const { pictureIndex, description } = req.body || {};
  if (pictureIndex === undefined || typeof description !== 'string') {
    return json(res, 400, { error: 'pictureIndex and description are required' });
  }

  const idx = Number(pictureIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx > 5) {
    return json(res, 400, { error: 'pictureIndex must be 0-5' });
  }

  if (description.length > 500) {
    return json(res, 400, { error: 'description must be 500 characters or fewer' });
  }

  if (!agent.pictures || idx >= agent.pictures.length) {
    return json(res, 404, { error: 'Picture not found at that index' });
  }

  const redis = getRedis();
  const key = `ms:descriptions:${agent.id}`;
  await redis.hset(key, { [idx]: description });

  return json(res, 200, { pictureIndex: idx, description });
}

import { getRedis } from '../_lib/redis.js';
import { cors, json } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const { id } = req.query;
  const redis = getRedis();

  const raw = await redis.hget('ms:agents', id);
  if (!raw) return json(res, 404, { error: 'Agent not found' });

  const agent = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const friendIds = await redis.smembers(`ms:friends:${id}`);

  const friends = [];
  for (const fid of friendIds) {
    const fraw = await redis.hget('ms:agents', fid);
    if (fraw) {
      const f = typeof fraw === 'string' ? JSON.parse(fraw) : fraw;
      friends.push({ id: f.id, name: f.name, pictures: f.pictures });
    }
  }

  return json(res, 200, {
    id: agent.id,
    name: agent.name,
    pictures: agent.pictures,
    createdAt: agent.createdAt,
    friends,
  });
}

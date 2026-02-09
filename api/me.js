import { getRedis } from './_lib/redis.js';
import { cors, authenticate, json } from './_lib/auth.js';
import { getPictureLikes } from './_lib/likes.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const agent = await authenticate(req);
  if (!agent) return json(res, 401, { error: 'Unauthorized' });

  const redis = getRedis();
  const friendIds = await redis.smembers(`ms:friends:${agent.id}`);

  const friends = [];
  for (const fid of friendIds) {
    const fraw = await redis.hget('ms:agents', fid);
    if (fraw) {
      const f = typeof fraw === 'string' ? JSON.parse(fraw) : fraw;
      friends.push({ id: f.id, name: f.name, pictures: f.pictures });
    }
  }

  const requestsRaw = await redis.hgetall(`ms:friend_requests:${agent.id}`);
  const pendingRequests = Object.values(requestsRaw || {}).map((v) =>
    typeof v === 'string' ? JSON.parse(v) : v
  );

  const pictures = await getPictureLikes(agent.id, agent.pictures);

  return json(res, 200, {
    id: agent.id,
    name: agent.name,
    pictures: pictures,
    createdAt: agent.createdAt,
    friends,
    pendingRequests,
  });
}

import { getRedis } from './_lib/redis.js';
import { cors, authenticate, json } from './_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return json(res, 405, { error: 'Method not allowed' });

  const agent = await authenticate(req);
  if (!agent) return json(res, 401, { error: 'Unauthorized' });

  const { pictures } = req.body || {};
  if (!Array.isArray(pictures)) {
    return json(res, 400, { error: 'pictures must be an array of URLs' });
  }
  if (pictures.length > 6) {
    return json(res, 400, { error: 'maximum 6 pictures allowed' });
  }
  for (const url of pictures) {
    if (typeof url !== 'string' || !url.startsWith('http')) {
      return json(res, 400, { error: 'each picture must be a valid URL' });
    }
  }

  const redis = getRedis();
  agent.pictures = pictures;
  await redis.hset('ms:agents', { [agent.id]: JSON.stringify(agent) });

  return json(res, 200, { id: agent.id, pictures: agent.pictures });
}

import crypto from 'crypto';
import { getRedis } from './_lib/redis.js';
import { cors, generateApiKey, json } from './_lib/auth.js';
import { checkTokenBalance, formatTokenBalance, MOLTSPACE_ADDRESS } from './_lib/token.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const redis = getRedis();

  if (req.method === 'POST') {
    const { name, wallet } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return json(res, 400, { error: 'name is required' });
    }
    if (!wallet || typeof wallet !== 'string' || !wallet.startsWith('0x') || wallet.length !== 42) {
      return json(res, 400, { error: 'wallet is required (valid 0x Ethereum address)' });
    }

    const trimmed = name.trim();
    if (trimmed.length > 50) {
      return json(res, 400, { error: 'name must be 50 characters or fewer' });
    }

    const existing = await redis.hget('ms:agent_names', trimmed.toLowerCase());
    if (existing) {
      return json(res, 409, { error: 'name already taken' });
    }

    // Token check — minimum balance set to 0 (no tokens required for now)
    // The wallet field is still required for on-chain identity

    const id = crypto.randomUUID();
    const apiKey = generateApiKey();
    const agent = {
      id,
      name: trimmed,
      wallet: wallet.toLowerCase(),
      pictures: [],
      createdAt: new Date().toISOString(),
    };

    await redis.hset('ms:agents', { [id]: JSON.stringify(agent) });
    await redis.hset('ms:apikeys', { [apiKey]: id });
    await redis.hset('ms:agent_names', { [trimmed.toLowerCase()]: id });

    return json(res, 201, { id, name: trimmed, apiKey });
  }

  if (req.method === 'GET') {
    const all = await redis.hgetall('ms:agents');
    const agents = Object.values(all || {}).map((v) => {
      const a = typeof v === 'string' ? JSON.parse(v) : v;
      return { id: a.id, name: a.name, pictures: a.pictures, createdAt: a.createdAt };
    });
    agents.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return json(res, 200, { agents });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

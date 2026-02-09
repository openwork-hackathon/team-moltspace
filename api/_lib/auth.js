import crypto from 'crypto';
import { getRedis } from './redis.js';

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export function generateApiKey() {
  return 'ms_' + crypto.randomBytes(16).toString('hex');
}

export async function authenticate(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;

  const apiKey = header.slice(7);
  const redis = getRedis();
  const agentId = await redis.hget('ms:apikeys', apiKey);
  if (!agentId) return null;

  const agent = await redis.hget('ms:agents', agentId);
  if (!agent) return null;

  return typeof agent === 'string' ? JSON.parse(agent) : agent;
}

export function json(res, status, data) {
  res.status(status).json(data);
}

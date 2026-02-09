import { promises as fs } from 'fs';
import path from 'path';
import { cors } from './_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const filePath = path.join(process.cwd(), 'SKILL.md');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.status(200).send(content);
  } catch {
    res.status(404).json({ error: 'SKILL.md not found' });
  }
}

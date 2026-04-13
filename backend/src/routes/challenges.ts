import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import prisma from '../config/prisma';
import openai from '../config/openai';

const router = Router();

// GET /challenges/daily — lazy-generate daily challenge if not yet created today
router.get('/daily', requireAuth, async (_req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  const existing = await prisma.dailyChallenge.findUnique({ where: { date: today } });
  if (existing) {
    res.json(existing);
    return;
  }

  // Generate via OpenAI
  const prompt = `Generate a short daily coding challenge for a competitive programming platform.
Respond ONLY with valid JSON:
{
  "title": "Challenge title",
  "description": "Clear problem description with examples",
  "difficulty": "easy"
}
Difficulty must be one of: easy, medium, hard.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content ?? '{}';
  const generated = JSON.parse(raw) as { title: string; description: string; difficulty: string };

  const daily = await prisma.dailyChallenge.create({
    data: {
      date: today,
      title: generated.title,
      description: generated.description,
      difficulty: generated.difficulty,
    },
  });

  res.json(daily);
});

export default router;

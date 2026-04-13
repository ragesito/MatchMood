import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Judge0 language IDs for the languages we support
const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  cpp: 54,
};

interface SubmissionRequest {
  code: string;
  language: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
}

// Submit code for execution and evaluation
router.post('/submit', requireAuth, async (req: Request, res: Response) => {
  const { code, language, testCases } = req.body as SubmissionRequest;

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    res.status(400).json({ error: `Unsupported language: ${language}` });
    return;
  }

  try {
    const results = await Promise.all(
      testCases.map((tc) => runTestCase(code, languageId, tc.input, tc.expectedOutput))
    );

    const passed = results.filter((r) => r.passed).length;

    res.json({
      results,
      passed,
      total: testCases.length,
      allPassed: passed === testCases.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Code execution failed' });
  }
});

async function runTestCase(
  code: string,
  languageId: number,
  input: string,
  expectedOutput: string
): Promise<{ passed: boolean; output: string; expected: string; error?: string }> {
  const apiKey = process.env.JUDGE0_API_KEY!;
  const apiHost = process.env.JUDGE0_API_HOST!;

  // Step 1: Submit the code to Judge0
  const submitRes = await fetch('https://judge0-ce.p.rapidapi.com/submissions?wait=true', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': apiHost,
    },
    body: JSON.stringify({
      source_code: code,
      language_id: languageId,
      stdin: input,
      expected_output: expectedOutput,
    }),
  });

  const result = await submitRes.json() as any;

  const output = (result.stdout ?? '').trim();
  const expected = expectedOutput.trim();
  const passed = output === expected && !result.stderr && result.status?.id === 3;

  return {
    passed,
    output,
    expected,
    error: result.stderr ?? result.compile_output ?? undefined,
  };
}

export default router;

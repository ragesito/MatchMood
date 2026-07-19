import openai from '../config/openai';
import prisma from '../config/prisma';

type Level = 'EASY' | 'MEDIUM' | 'HARD';

interface GeneratedChallenge {
  title: string;
  description: string;
  starterCode: string;
  runnerCode: string;
  // A correct reference solution — used to COMPUTE the expected outputs (the AI
  // is unreliable at hand-computing them). Never sent to the client.
  solution: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
}

const JUDGE0_LANG: Record<string, number> = {
  javascript: 63, typescript: 74, python: 71, java: 62, cpp: 54, go: 60, rust: 73,
};

// Run one program+stdin through Judge0. Returns the trimmed stdout, or ok:false
// if it didn't run cleanly (compile/runtime error, timeout, or Judge0 down).
async function runViaJudge0(fullCode: string, languageId: number, stdin: string): Promise<{ ok: boolean; output: string }> {
  try {
    const res = await fetch('https://judge0-ce.p.rapidapi.com/submissions?wait=true', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'X-RapidAPI-Key':  process.env.JUDGE0_API_KEY!,
        'X-RapidAPI-Host': process.env.JUDGE0_API_HOST!,
      },
      body: JSON.stringify({ source_code: fullCode, language_id: languageId, stdin }),
    });
    const result = await res.json() as any;
    if (result.status?.id !== 3) return { ok: false, output: '' };
    return { ok: true, output: (result.stdout ?? '').trim() };
  } catch {
    return { ok: false, output: '' };
  }
}

function assembleFullCode(solution: string, runnerCode: string): string {
  return runnerCode.includes('// SOLVE_HERE')
    ? runnerCode.replace('// SOLVE_HERE', solution)
    : `${solution}\n\n${runnerCode}`;
}

// ── Per-language code structure guide for the AI ─────────────────────────────

const LANG_GUIDE: Record<string, { starterExample: string; runnerExample: string; notes: string }> = {
  javascript: {
    starterExample: `function solve(nums) {\n  // Write your solution here\n  return null;\n}`,
    runnerExample:  `// SOLVE_HERE\n\nconst _lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst _arg1 = JSON.parse(_lines[0]);\nconst _result = solve(_arg1);\nprocess.stdout.write(JSON.stringify(_result));`,
    notes: 'starterCode = ONLY the solve() function. runnerCode = "// SOLVE_HERE" marker then the runner. Use _prefixed variable names in runner to avoid conflicts with user code.',
  },
  typescript: {
    starterExample: `function solve(nums: number[]): number {\n  // Write your solution here\n  return -1;\n}`,
    runnerExample:  `declare var require: any;\ndeclare var process: any;\n\n// SOLVE_HERE\n\nconst _lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst _arg1 = JSON.parse(_lines[0]);\nconst _result = solve(_arg1);\nprocess.stdout.write(JSON.stringify(_result));`,
    notes: 'starterCode = ONLY the solve() function (WITH TypeScript type annotations). runnerCode = the two "declare var" lines, then the "// SOLVE_HERE" marker, then the runner. CRITICAL: the Judge0 TypeScript compiler has NO @types/node, so you MUST NOT use "import ... from" statements and MUST NOT reference process/require without the "declare var" lines shown. Use require(\'fs\') (never import) to read stdin. Use _prefixed variable names in the runner.',
  },
  python: {
    starterExample: `def solve(nums):\n    # Write your solution here\n    return None`,
    runnerExample:  `import sys as _sys, json as _json\n\n# SOLVE_HERE\n\n_lines = _sys.stdin.read().strip().split('\\n')\n_a1 = _json.loads(_lines[0])\n_result = solve(_a1)\nprint(_json.dumps(_result), end='')`,
    notes: 'starterCode = ONLY the solve() function. runnerCode = imports at top, "// SOLVE_HERE" marker, then runner. Use _prefixed names for imports and variables in runner to avoid conflicts.',
  },
  go: {
    starterExample: `func solve(nums []int) int {\n\t// Write your solution here\n\treturn -1\n}`,
    runnerExample:  `package main\n\nimport (\n\t"bufio"\n\t"encoding/json"\n\t"fmt"\n\t"os"\n)\n\n// SOLVE_HERE\n\nfunc main() {\n\treader := bufio.NewReader(os.Stdin)\n\tline, _ := reader.ReadString('\\n')\n\tvar arg1 []int\n\tjson.Unmarshal([]byte(line), &arg1)\n\tresult := solve(arg1)\n\tres, _ := json.Marshal(result)\n\tfmt.Print(string(res))\n}`,
    notes: 'starterCode = ONLY the solve() function (no package, no imports, no main). runnerCode = full Go file template with the marker "// SOLVE_HERE" where the solve function will be injected. The marker is replaced at submission time. Adjust imports and main() to match the actual argument types.',
  },
  rust: {
    starterExample: `fn solve(nums: Vec<i64>) -> i64 {\n    // Write your solution here\n    -1\n}`,
    runnerExample:  `use std::io::{self, Read};\n\n// SOLVE_HERE\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    let line = input.trim();\n    let inner = line.trim_start_matches('[').trim_end_matches(']');\n    let arg1: Vec<i64> = if inner.trim().is_empty() { vec![] } else {\n        inner.split(',').map(|s| s.trim().parse().unwrap()).collect()\n    };\n    let result = solve(arg1);\n    print!("{}", result);\n}`,
    notes: 'starterCode = ONLY the fn solve() function (no use statements, no main). runnerCode = full Rust file template with "// SOLVE_HERE" marker, replaced at submission time. CRITICAL: Judge0 Rust has the STANDARD LIBRARY ONLY — NO external crates (do NOT use serde, serde_json, itertools, etc.; they will not compile). Parse the JSON input manually with std string methods (see the example). Print a scalar result with print!("{}", result). If solve returns a Vec, format it manually as e.g. [1,2,3] with no spaces.',
  },
  java: {
    starterExample: `public static int solve(int[] nums) {\n    // Write your solution here\n    return -1;\n}`,
    runnerExample:  `import java.util.*;\nimport java.io.*;\n\nclass Solution {\n    // SOLVE_HERE\n}\n\nclass Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String line = br.readLine().trim();\n        if (line.startsWith("[")) line = line.substring(1, line.length() - 1);\n        int[] arg1 = line.isEmpty() ? new int[0]\n            : Arrays.stream(line.split(",")).map(String::trim).mapToInt(Integer::parseInt).toArray();\n        System.out.print(Solution.solve(arg1));\n    }\n}`,
    notes: 'starterCode = ONLY the static method (no class, no imports). runnerCode = full Java file with a Solution class containing the "// SOLVE_HERE" marker and a Main class with main(). Parse stdin manually. CRITICAL: do NOT use backslash escapes like \\[ or \\] inside Java string literals (they are illegal Java escapes and will not compile) — strip the [ ] brackets with substring as shown, never with a regex containing backslashes.',
  },
  cpp: {
    starterExample: `#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(int n) {\n    // Write your solution here\n    return -1;\n}`,
    runnerExample:  `int main() {\n    int n;\n    cin >> n;\n    cout << solve(n);\n    return 0;\n}`,
    notes: 'starterCode = the solve() function with #include at top. runnerCode = main() that reads from cin and calls solve(). For arrays use: int n; cin >> n; vector<int> a(n); for(auto& x:a) cin >> x;. Output with cout (no endl needed). testCase inputs must be simple whitespace-separated values, NOT JSON.',
  },
};

const PROMPT_TEMPLATE = (level: Level, language: string) => {
  const guide = LANG_GUIDE[language] ?? LANG_GUIDE['javascript'];
  return `Generate a coding challenge for a competitive programming platform.

Requirements:
- Difficulty: ${level}
- Language: ${language}
- Solvable in under 5 minutes
- Must be a pure function (no I/O, just logic — I/O is handled by runnerCode)
- Provide exactly 3 test cases

Language-specific code structure for ${language}:
${guide.notes}

starterCode example:
\`\`\`
${guide.starterExample}
\`\`\`

runnerCode example:
\`\`\`
${guide.runnerExample}
\`\`\`

CRITICAL RULES for starterCode:
- The function body must contain ONLY a placeholder comment, NEVER a working solution
- For ${language}: use the language-appropriate placeholder (e.g. "// Write your solution here" + a minimal default return value)
- Do NOT pre-fill the algorithm, formulas, or any logic — the user must write it
- Only the function signature and the empty body placeholder

Respond ONLY with valid JSON in this exact format:
{
  "title": "Challenge title",
  "description": "Clear problem description with examples",
  "starterCode": "...(full starter code in ${language} — signature + empty placeholder body ONLY)...",
  "runnerCode": "...(runner code in ${language} following the example above)...",
  "solution": "...(a CORRECT, working ${language} solution — same shape as starterCode but with the real algorithm filled in. This is used to compute the expected outputs and is never shown to players.)...",
  "testCases": [
    { "input": "...", "expectedOutput": "..." },
    { "input": "...", "expectedOutput": "..." },
    { "input": "...", "expectedOutput": "..." }
  ]
}

Rules for testCases.input:
- For javascript/typescript/python: each argument on its own line, arrays as JSON like [1,2,3]
- For cpp: simple whitespace/newline separated values (e.g. "5" or "3\\n1 2 3")
- For go/rust/java: each argument on its own line as JSON
Rules for testCases.expectedOutput:
- For javascript/typescript/python/go/rust: JSON.stringify equivalent (e.g. 42 → "42", [1,2] → "[1,2]")
- For java/cpp: plain string as printed by cout/System.out.print (e.g. "42")

CRITICAL — test case verification (do this before writing testCases):
For EACH test case, manually trace through the correct algorithm step by step and compute the expectedOutput.
Example for "sum of unique elements" with [4,5,6,4,3,5]:
  4→2 times, 5→2 times, 6→1 time, 3→1 time → unique={6,3} → sum=9 → expectedOutput="9"
Do NOT guess or copy wrong values. Wrong expectedOutput means both players fail every test and the match never ends.`;
};

async function generateWithAI(level: Level, language: string): Promise<ReturnType<typeof prisma.challenge.create> extends Promise<infer T> ? T & { runnerCode: string } : never> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: PROMPT_TEMPLATE(level, language) }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content ?? '{}';
  const generated = JSON.parse(raw) as GeneratedChallenge;

  if (!generated.solution || !generated.runnerCode || !generated.testCases?.length) {
    throw new Error('AI response missing solution / runnerCode / testCases');
  }

  // Compute the expected outputs before serving the challenge. A wrong
  // expectedOutput makes BOTH players score 0 → the match ends in a perpetual
  // draw, so the outputs must be trustworthy. The AI is unreliable at hand-
  // computing them (that WAS the draw bug), but it writes a working reference
  // solution. So the reference solution — executed in the sandbox — is our
  // source of truth: run it through Judge0 and OVERWRITE the AI's stated
  // outputs with the real computed ones.
  //   - solution won't run cleanly (compile/runtime error) -> reject: we can't
  //     compute a trustworthy output, so regenerate.
  //   - solution runs on every test case -> trust the computed output, whatever
  //     the AI claimed it would be. Do NOT require agreement with the AI's
  //     hand-written output — it's wrong often enough that demanding a match
  //     just rejects good challenges and falls back to the wrong language.
  const languageId = JUDGE0_LANG[language] ?? 63;
  const solutionCode = assembleFullCode(generated.solution, generated.runnerCode);
  const starterCode  = assembleFullCode(generated.starterCode, generated.runnerCode);

  // Run the reference solution AND the empty starter through Judge0 in parallel.
  const [refRuns, starterRuns] = await Promise.all([
    Promise.all(generated.testCases.map((tc) => runViaJudge0(solutionCode, languageId, tc.input))),
    Promise.all(generated.testCases.map((tc) => runViaJudge0(starterCode,  languageId, tc.input))),
  ]);

  // The reference solution must run cleanly on every case — otherwise we can't
  // compute a trustworthy expected output, so reject and regenerate.
  if (refRuns.some((r) => !r.ok)) {
    throw new Error('Reference solution failed to run cleanly on a test case');
  }
  const testCases = generated.testCases.map((tc, i) => ({ input: tc.input, expectedOutput: refRuns[i].output }));

  // Discrimination guard: a do-nothing submission (the empty starter) must NOT
  // win. If it passes every test, the challenge doesn't distinguish a correct
  // answer from an empty one — which happens when the AI's reference solution is
  // buggy (e.g. always returns 0, so the outputs are all "0" and the starter's
  // default matches them). Serving it would reproduce the perpetual-draw bug, so
  // reject and regenerate.
  const starterPassed = starterRuns.filter((r, i) => r.ok && r.output === testCases[i].expectedOutput).length;
  if (starterPassed === testCases.length) {
    throw new Error('Empty starter passes all tests — challenge does not discriminate a correct answer; regenerating');
  }

  const challenge = await prisma.challenge.create({
    data: {
      title: generated.title,
      description: generated.description,
      level,
      language,
      starterCode: generated.starterCode,
      testCases,
      isAiGenerated: true,
    },
  });

  return { ...challenge, runnerCode: generated.runnerCode };
}

// Generate a challenge: 70% curated (if available for that language), 30% AI. AI has 2 retries.
export async function generateChallenge(level: Level, language: string) {
  // Try curated 70% of the time — must match BOTH difficulty AND language
  if (Math.random() < 0.7) {
    const curated = await prisma.curatedChallenge.findFirst({
      where: { verified: true, difficulty: level.toLowerCase(), language: language.toLowerCase() },
      orderBy: { usedCount: 'asc' },
    });

    if (curated) {
      await prisma.curatedChallenge.update({ where: { id: curated.id }, data: { usedCount: { increment: 1 } } });

      const challenge = await prisma.challenge.create({
        data: {
          title: curated.title,
          description: curated.description,
          level,
          language,
          starterCode: curated.starterCode,
          testCases: curated.testCases ?? [],
          isAiGenerated: false,
        },
      });
      return { ...challenge, runnerCode: curated.runnerCode };
    }
  }

  // AI generation with up to 2 retries
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await generateWithAI(level, language);
    } catch (err) {
      console.error(`AI challenge generation attempt ${attempt + 1} failed:`, err);
      if (attempt === 2) {
        // Final fallback: curated in same language (any difficulty), then any curated
        const fallback =
          (await prisma.curatedChallenge.findFirst({ where: { verified: true, language: language.toLowerCase() }, orderBy: { usedCount: 'asc' } })) ??
          (await prisma.curatedChallenge.findFirst({ where: { verified: true }, orderBy: { usedCount: 'asc' } }));

        if (fallback) {
          await prisma.curatedChallenge.update({ where: { id: fallback.id }, data: { usedCount: { increment: 1 } } });
          const challenge = await prisma.challenge.create({
            data: { title: fallback.title, description: fallback.description, level, language: fallback.language, starterCode: fallback.starterCode, testCases: fallback.testCases ?? [], isAiGenerated: false },
          });
          return { ...challenge, runnerCode: fallback.runnerCode };
        }
        throw new Error('Challenge generation failed after 3 attempts and no curated fallback available');
      }
    }
  }

  throw new Error('Unreachable');
}

import openai from '../config/openai';
import prisma from '../config/prisma';

type Level = 'EASY' | 'MEDIUM' | 'HARD';

interface GeneratedChallenge {
  title: string;
  description: string;
  starterCode: string;
  runnerCode: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
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
    runnerExample:  `import * as fs from 'fs';\n\n// SOLVE_HERE\n\nconst _lines = fs.readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst _arg1 = JSON.parse(_lines[0]);\nconst _result = solve(_arg1);\nprocess.stdout.write(JSON.stringify(_result));`,
    notes: 'starterCode = ONLY the solve() function. runnerCode = full TS file with "import * as fs" at top, "// SOLVE_HERE" marker, then the runner. The marker is replaced at submission time. Use _prefixed variable names in runner to avoid conflicts.',
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
    runnerExample:  `use std::io::{self, Read};\n\n// SOLVE_HERE\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    let lines: Vec<&str> = input.trim().split('\\n').collect();\n    let arg1: Vec<i64> = serde_json::from_str(lines[0]).unwrap_or_default();\n    let result = solve(arg1);\n    print!("{}", serde_json::to_string(&result).unwrap());\n}`,
    notes: 'starterCode = ONLY the fn solve() function (no use statements, no main). runnerCode = full Rust file template with "// SOLVE_HERE" marker. The marker is replaced at submission time. Use serde_json for JSON parsing.',
  },
  java: {
    starterExample: `public static int solve(int[] nums) {\n    // Write your solution here\n    return -1;\n}`,
    runnerExample:  `import java.util.*;\nimport java.io.*;\n\nclass Solution {\n    // SOLVE_HERE\n}\n\nclass Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String line = br.readLine();\n        int[] arg1 = Arrays.stream(line.replaceAll("[\\\\[\\\\]]","").split(",")).mapToInt(Integer::parseInt).toArray();\n        System.out.print(Solution.solve(arg1));\n    }\n}`,
    notes: 'starterCode = ONLY the static method body (no class, no imports). runnerCode = full Java file with Solution class containing "// SOLVE_HERE" marker and a Main class with main(). The marker is replaced at submission time. Parse stdin manually without JSON libraries.',
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
  "starterCode": "...(full starter code in ${language} following the example above)...",
  "runnerCode": "...(runner code in ${language} following the example above — empty string for go/rust/java)...",
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

  const challenge = await prisma.challenge.create({
    data: {
      title: generated.title,
      description: generated.description,
      level,
      language,
      starterCode: generated.starterCode,
      testCases: generated.testCases,
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
          testCases: [],
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
            data: { title: fallback.title, description: fallback.description, level, language: fallback.language, starterCode: fallback.starterCode, testCases: [], isAiGenerated: false },
          });
          return { ...challenge, runnerCode: fallback.runnerCode };
        }
        throw new Error('Challenge generation failed after 3 attempts and no curated fallback available');
      }
    }
  }

  throw new Error('Unreachable');
}

// Genera testCases {input, expectedOutput} ejecutando la solución REAL de cada
// reto contra inputs definidos a mano. expectedOutput = stdout real, así los
// casos quedan garantizados correctos y las soluciones rotas se delatan solas.
// Uso: npx ts-node src/scripts/gen-testcases.ts
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { challenges } from './seed-challenges';

// stdin completo por reto (líneas \n), en el formato que parsea cada runnerCode.
const INPUTS: Record<string, string[]> = {
  'Two Sum': ['[2,7,11,15]\n9', '[3,2,4]\n6', '[3,3]\n6'],
  'Reverse a String': ['"hello"', '"MatchMood"', '"a"'],
  'Is Palindrome': ['"racecar"', '"Hello"', '"RaceCar"'],
  'FizzBuzz': ['5', '15', '3'],
  'Maximum Subarray': ['[-2,1,-3,4,-1,2,1,-5,4]', '[1]', '[5,4,-1,7,8]'],
  'Valid Anagram': ['"anagram"\n"nagaram"', '"rat"\n"car"', '"a"\n"a"'],
  'Fibonacci Number': ['6', '0', '10'],
  'Climbing Stairs': ['3', '2', '5'],
  'Contains Duplicate': ['[1,2,3,1]', '[1,2,3,4]', '[1,1,1,1]'],
  'Move Zeroes': ['[0,1,0,3,12]', '[0,0,1]', '[1,2,3]'],
  'Group Anagrams': ['["eat","tea","tan","ate","nat","bat"]', '[""]', '["a"]'],
  'Longest Substring Without Repeating Characters': ['"abcabcbb"', '"bbbbb"', '"pwwkew"'],
  'Product of Array Except Self': ['[1,2,3,4]', '[-1,1,0,-3,3]', '[2,3]'],
  'Valid Parentheses': ['"()[]{}"', '"([)]"', '"{[]}"'],
  'Sort Characters By Frequency': ['"tree"', '"cccaaa"', '"Aabb"'],
  'Top K Frequent Elements': ['[1,1,1,2,2,3]\n2', '[1]\n1', '[4,4,4,5,5,6]\n2'],
  'Merge Intervals': ['[[1,3],[2,6],[8,10],[15,18]]', '[[1,4],[4,5]]', '[[1,4],[2,3]]'],
  'Coin Change': ['[1,5,11]\n15', '[2]\n3', '[1]\n0'],
  'Longest Common Subsequence': ['"abcde"\n"ace"', '"abc"\n"abc"', '"abc"\n"def"'],
  'Word Break': ['"leetcode"\n["leet","code"]', '"applepenapple"\n["apple","pen"]', '"catsandog"\n["cats","dog","sand","and","cat"]'],
};

const out: Record<string, { input: string; expectedOutput: string }[]> = {};
const broken: string[] = [];

for (const ch of challenges) {
  const inputs = INPUTS[ch.title];
  if (!inputs) { broken.push(`${ch.title}: SIN INPUTS`); continue; }
  // runnerCode lee '/dev/stdin' (Judge0/Linux). Local: fd 0, cross-platform.
  const runner = ch.runnerCode.replace(/'\/dev\/stdin'/g, '0');
  const program = `${ch.solution}\n${runner}`;
  const cases: { input: string; expectedOutput: string }[] = [];
  for (const input of inputs) {
    try {
      const stdout = execFileSync('node', ['-e', program], { input, encoding: 'utf8' });
      cases.push({ input, expectedOutput: stdout.trim() });
    } catch (e: any) {
      const msg = String(e.stderr || e.message).split('\n').find((l: string) => l.includes('Error')) || String(e.message);
      broken.push(`${ch.title} <= ${JSON.stringify(input)} : ${msg.trim()}`);
    }
  }
  out[ch.title] = cases;
}

if (broken.length) {
  console.error('Soluciones rotas — corrígelas antes de regenerar:\n' + broken.join('\n'));
  process.exit(1);
}

const dest = join(__dirname, 'challenge-testcases.json');
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
const total = Object.values(out).reduce((n, cs) => n + cs.length, 0);
console.log(`OK — ${total} test cases para ${Object.keys(out).length} retos escritos en ${dest}`);

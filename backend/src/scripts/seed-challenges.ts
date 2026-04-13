import prisma from '../config/prisma';

const challenges = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\nExample: nums=[2,7,11,15], target=9 → [0,1]',
    difficulty: 'easy', tags: ['arrays', 'hashmap'], language: 'javascript',
    starterCode: 'function solve(nums, target) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = JSON.parse(lines[0]);\nconst target = parseInt(lines[1]);\nconsole.log(JSON.stringify(solve(nums, target)));`,
    solution: 'function solve(nums, target) {\n  const map = {};\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map[comp] !== undefined) return [map[comp], i];\n    map[nums[i]] = i;\n  }\n}',
  },
  {
    title: 'Reverse a String',
    description: 'Given a string `s`, return it reversed.\n\nExample: "hello" → "olleh"',
    difficulty: 'easy', tags: ['strings'], language: 'javascript',
    starterCode: 'function solve(s) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst s = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(s)));`,
    solution: 'function solve(s) { return s.split("").reverse().join(""); }',
  },
  {
    title: 'Is Palindrome',
    description: 'Given a string, return true if it is a palindrome (reads the same forwards and backwards), false otherwise. Ignore case.\n\nExample: "racecar" → true, "hello" → false',
    difficulty: 'easy', tags: ['strings'], language: 'javascript',
    starterCode: 'function solve(s) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst s = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(s)));`,
    solution: 'function solve(s) { const t = s.toLowerCase(); return t === t.split("").reverse().join(""); }',
  },
  {
    title: 'FizzBuzz',
    description: 'Given an integer n, return an array of strings for numbers 1 to n. Use "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for both.\n\nExample: n=5 → ["1","2","Fizz","4","Buzz"]',
    difficulty: 'easy', tags: ['arrays'], language: 'javascript',
    starterCode: 'function solve(n) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst n = parseInt(lines[0]);\nconsole.log(JSON.stringify(solve(n)));`,
    solution: 'function solve(n) { return Array.from({length:n},(_,i)=>{ const x=i+1; return x%15===0?"FizzBuzz":x%3===0?"Fizz":x%5===0?"Buzz":String(x); }); }',
  },
  {
    title: 'Maximum Subarray',
    description: 'Given an array of integers, find the contiguous subarray with the largest sum and return that sum.\n\nExample: [-2,1,-3,4,-1,2,1,-5,4] → 6 (subarray [4,-1,2,1])',
    difficulty: 'easy', tags: ['arrays', 'dp'], language: 'javascript',
    starterCode: 'function solve(nums) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(nums)));`,
    solution: 'function solve(nums) { let max=nums[0],cur=nums[0]; for(let i=1;i<nums.length;i++){cur=Math.max(nums[i],cur+nums[i]);max=Math.max(max,cur);} return max; }',
  },
  {
    title: 'Valid Anagram',
    description: 'Given two strings s and t, return true if t is an anagram of s.\n\nExample: s="anagram", t="nagaram" → true',
    difficulty: 'easy', tags: ['strings', 'hashmap'], language: 'javascript',
    starterCode: 'function solve(s, t) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst s = JSON.parse(lines[0]);\nconst t = JSON.parse(lines[1]);\nconsole.log(JSON.stringify(solve(s,t)));`,
    solution: 'function solve(s,t){if(s.length!==t.length)return false;const m={};for(const c of s)m[c]=(m[c]||0)+1;for(const c of t){if(!m[c])return false;m[c]--;}return true;}',
  },
  {
    title: 'Fibonacci Number',
    description: 'Return the nth Fibonacci number (0-indexed). F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).\n\nExample: n=6 → 8',
    difficulty: 'easy', tags: ['dp', 'recursion'], language: 'javascript',
    starterCode: 'function solve(n) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst n = parseInt(lines[0]);\nconsole.log(JSON.stringify(solve(n)));`,
    solution: 'function solve(n){let a=0,b=1;for(let i=0;i<n;i++){[a,b]=[b,a+b];}return a;}',
  },
  {
    title: 'Climbing Stairs',
    description: 'You can climb 1 or 2 steps at a time. Given n steps, return the number of distinct ways to reach the top.\n\nExample: n=3 → 3 (1+1+1, 1+2, 2+1)',
    difficulty: 'easy', tags: ['dp'], language: 'javascript',
    starterCode: 'function solve(n) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst n = parseInt(lines[0]);\nconsole.log(JSON.stringify(solve(n)));`,
    solution: 'function solve(n){if(n<=2)return n;let a=1,b=2;for(let i=3;i<=n;i++){[a,b]=[b,a+b];}return b;}',
  },
  {
    title: 'Contains Duplicate',
    description: 'Given an array of integers, return true if any value appears at least twice.\n\nExample: [1,2,3,1] → true, [1,2,3,4] → false',
    difficulty: 'easy', tags: ['arrays', 'hashmap'], language: 'javascript',
    starterCode: 'function solve(nums) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(nums)));`,
    solution: 'function solve(nums){return new Set(nums).size !== nums.length;}',
  },
  {
    title: 'Move Zeroes',
    description: 'Given an array, move all zeroes to the end while maintaining relative order of non-zero elements.\n\nExample: [0,1,0,3,12] → [1,3,12,0,0]',
    difficulty: 'easy', tags: ['arrays'], language: 'javascript',
    starterCode: 'function solve(nums) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(nums)));`,
    solution: 'function solve(nums){const r=[...nums.filter(x=>x!==0),...nums.filter(x=>x===0)];return r;}',
  },
  {
    title: 'Group Anagrams',
    description: 'Given an array of strings, group the anagrams together.\n\nExample: ["eat","tea","tan","ate","nat","bat"] → [["eat","tea","ate"],["tan","nat"],["bat"]]',
    difficulty: 'medium', tags: ['strings', 'hashmap'], language: 'javascript',
    starterCode: 'function solve(strs) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst strs = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(strs)));`,
    solution: 'function solve(strs){const m=new Map();for(const s of strs){const k=s.split("").sort().join("");if(!m.has(k))m.set(k,[]);m.get(k).push(s);}return [...m.values()];}',
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.\n\nExample: "abcabcbb" → 3 ("abc")',
    difficulty: 'medium', tags: ['strings', 'sliding-window'], language: 'javascript',
    starterCode: 'function solve(s) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst s = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(s)));`,
    solution: 'function solve(s){let map=new Map(),l=0,max=0;for(let r=0;r<s.length;r++){if(map.has(s[r]))l=Math.max(l,map.get(s[r])+1);map.set(s[r],r);max=Math.max(max,r-l+1);}return max;}',
  },
  {
    title: 'Product of Array Except Self',
    description: 'Return an array where each element is the product of all other elements in the input array. No division allowed.\n\nExample: [1,2,3,4] → [24,12,8,6]',
    difficulty: 'medium', tags: ['arrays'], language: 'javascript',
    starterCode: 'function solve(nums) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(nums)));`,
    solution: 'function solve(nums){const n=nums.length,res=new Array(n).fill(1);let l=1;for(let i=0;i<n;i++){res[i]=l;l*=nums[i];}let r=1;for(let i=n-1;i>=0;i--){res[i]*=r;r*=nums[i];}return res;}',
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string of brackets, return true if the brackets are valid (properly opened and closed).\n\nExample: "()[]{}" → true, "([)]" → false',
    difficulty: 'medium', tags: ['strings', 'stack'], language: 'javascript',
    starterCode: 'function solve(s) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst s = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(s)));`,
    solution: 'function solve(s){const st=[],m={")":" (","]}":"[","}":" {"};for(const c of s){if("([{".includes(c))st.push(c);else if(st.pop()!==m[c])return false;}return st.length===0;}',
  },
  {
    title: 'Sort Characters By Frequency',
    description: 'Given a string s, sort it in decreasing order based on character frequency.\n\nExample: "tree" → "eert" or "eetr"',
    difficulty: 'medium', tags: ['strings', 'sorting'], language: 'javascript',
    starterCode: 'function solve(s) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst s = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(s)));`,
    solution: 'function solve(s){const m={};for(const c of s)m[c]=(m[c]||0)+1;return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([c,n])=>c.repeat(n)).join("");}',
  },
  {
    title: 'Top K Frequent Elements',
    description: 'Given an integer array nums and an integer k, return the k most frequent elements.\n\nExample: nums=[1,1,1,2,2,3], k=2 → [1,2]',
    difficulty: 'medium', tags: ['arrays', 'hashmap', 'sorting'], language: 'javascript',
    starterCode: 'function solve(nums, k) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = JSON.parse(lines[0]);\nconst k = parseInt(lines[1]);\nconsole.log(JSON.stringify(solve(nums,k)));`,
    solution: 'function solve(nums,k){const m={};for(const n of nums)m[n]=(m[n]||0)+1;return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,k).map(([n])=>parseInt(n));}',
  },
  {
    title: 'Merge Intervals',
    description: 'Given an array of intervals, merge all overlapping intervals.\n\nExample: [[1,3],[2,6],[8,10],[15,18]] → [[1,6],[8,10],[15,18]]',
    difficulty: 'medium', tags: ['arrays', 'sorting'], language: 'javascript',
    starterCode: 'function solve(intervals) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst intervals = JSON.parse(lines[0]);\nconsole.log(JSON.stringify(solve(intervals)));`,
    solution: 'function solve(iv){iv.sort((a,b)=>a[0]-b[0]);const r=[iv[0]];for(let i=1;i<iv.length;i++){const last=r[r.length-1];if(iv[i][0]<=last[1])last[1]=Math.max(last[1],iv[i][1]);else r.push(iv[i]);}return r;}',
  },
  {
    title: 'Coin Change',
    description: 'Given coins of different denominations and a total amount, find the fewest coins needed to make up that amount. Return -1 if not possible.\n\nExample: coins=[1,5,11], amount=15 → 3 (5+5+5)',
    difficulty: 'hard', tags: ['dp'], language: 'javascript',
    starterCode: 'function solve(coins, amount) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst coins = JSON.parse(lines[0]);\nconst amount = parseInt(lines[1]);\nconsole.log(JSON.stringify(solve(coins,amount)));`,
    solution: 'function solve(coins,amount){const dp=new Array(amount+1).fill(Infinity);dp[0]=0;for(let i=1;i<=amount;i++)for(const c of coins)if(c<=i)dp[i]=Math.min(dp[i],dp[i-c]+1);return dp[amount]===Infinity?-1:dp[amount];}',
  },
  {
    title: 'Longest Common Subsequence',
    description: 'Given two strings text1 and text2, return the length of their longest common subsequence.\n\nExample: text1="abcde", text2="ace" → 3',
    difficulty: 'hard', tags: ['dp', 'strings'], language: 'javascript',
    starterCode: 'function solve(text1, text2) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst text1 = JSON.parse(lines[0]);\nconst text2 = JSON.parse(lines[1]);\nconsole.log(JSON.stringify(solve(text1,text2)));`,
    solution: 'function solve(a,b){const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>new Array(n+1).fill(0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);return dp[m][n];}',
  },
  {
    title: 'Word Break',
    description: 'Given a string s and a dictionary of strings wordDict, return true if s can be segmented into space-separated words from the dictionary.\n\nExample: s="leetcode", wordDict=["leet","code"] → true',
    difficulty: 'hard', tags: ['dp', 'strings'], language: 'javascript',
    starterCode: 'function solve(s, wordDict) {\n  // Write your solution here\n}',
    runnerCode: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst s = JSON.parse(lines[0]);\nconst wordDict = JSON.parse(lines[1]);\nconsole.log(JSON.stringify(solve(s,wordDict)));`,
    solution: 'function solve(s,d){const set=new Set(d),n=s.length,dp=new Array(n+1).fill(false);dp[0]=true;for(let i=1;i<=n;i++)for(let j=0;j<i;j++)if(dp[j]&&set.has(s.slice(j,i))){dp[i]=true;break;}return dp[n];}',
  },
];

async function main() {
  console.log('Seeding curated challenges...');
  let created = 0;
  for (const ch of challenges) {
    const exists = await prisma.curatedChallenge.findFirst({ where: { title: ch.title } });
    if (!exists) {
      await prisma.curatedChallenge.create({ data: { ...ch, verified: true } });
      created++;
    }
  }
  console.log(`Done. Created ${created} new challenges (${challenges.length - created} already existed).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

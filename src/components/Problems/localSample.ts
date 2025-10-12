import type { Problem } from "./types";

type TestCase = { id: string; input: unknown[]; expected: unknown };
type Resource = { title: string; url: string };
type LocalProblem = Problem & {
  functionName?: string;
  tests?: TestCase[];
  resources?: Resource[];
  solutionUrl?: string;
  hints?: string[];
};

export const localProblems: LocalProblem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "easy",
    tags: ["array", "hash-map"],
    statement:
      "Найти индексы двух чисел в массиве, сумма которых равна target.",
    functionName: "twoSum",
    starterCode:
      "" +
      "function twoSum(nums, target) {\n" +
      "  // Ваш код здесь\n" +
      "  const map = new Map();\n" +
      "  for (let i = 0; i < nums.length; i++) {\n" +
      "    const need = target - nums[i];\n" +
      "    if (map.has(need)) return [map.get(need), i];\n" +
      "    map.set(nums[i], i);\n" +
      "  }\n" +
      "  return [-1, -1];\n" +
      "}\n",
    tests: [
      { id: "t1", input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { id: "t2", input: [[3, 2, 4], 6], expected: [1, 2] },
      { id: "t3", input: [[3, 3], 6], expected: [0, 1] },
    ],
    resources: [
      {
        title: "Hash Map Technique",
        url: "https://leetcode.com/problems/two-sum/solutions/",
      },
    ],
    solutionUrl: "https://leetcode.com/problems/two-sum/solutions/",
    videoUrl:
      "https://www.youtube.com/results?search_query=two+sum+explanation",
    hints: [
      "Подумайте о хранении индексов в Map",
      "Ищите комплимент target - nums[i]",
    ],
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "easy",
    tags: ["stack", "string"],
    statement: "Проверить корректность скобочной последовательности.",
    functionName: "isValid",
    starterCode:
      "" +
      "function isValid(s) {\n" +
      "  const stack = [];\n" +
      "  const map = {')':'(', ']':'[', '}':'{'};\n" +
      "  for (const ch of s) {\n" +
      "    if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);\n" +
      "    else {\n" +
      "      if (stack.pop() !== map[ch]) return false;\n" +
      "    }\n" +
      "  }\n" +
      "  return stack.length === 0;\n" +
      "}\n",
    tests: [
      { id: "p1", input: ["()"], expected: true },
      { id: "p2", input: ["()[]{}"], expected: true },
      { id: "p3", input: ["(]"], expected: false },
      { id: "p4", input: ["([)]"], expected: false },
      { id: "p5", input: ["{[]}"], expected: true },
    ],
    resources: [
      {
        title: "Stack pattern",
        url: "https://leetcode.com/problems/valid-parentheses/solutions/",
      },
    ],
    solutionUrl: "https://leetcode.com/problems/valid-parentheses/solutions/",
    videoUrl:
      "https://www.youtube.com/results?search_query=valid+parentheses+stack",
    hints: [
      "Используйте стек",
      "Сопоставляйте закрывающие и открывающие скобки",
    ],
  },
];

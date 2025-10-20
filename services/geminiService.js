const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
const model = genAI.getGenerativeModel({ model: MODEL });

const practicePrompt = `Generate an array of 5 unique coding challenges in JSON format. Each challenge should have the following structure:
{
  "id": "unique-id",
  "title": "Challenge title",
  "description": "Detailed problem description",
  "difficulty": "easy|medium|hard",
  "timeLimit": 300,
  "inputFormat": "Description of input format",
  "outputFormat": "Description of expected output format",
  "constraints": ["List of constraints"],
  "examples": [
    {
      "input": "Sample input",
      "output": "Expected output",
      "explanation": "Explanation of the example"
    }
  ],
  "testCases": [
    {
      "input": "Test input",
      "output": "Expected output"
    }
  ],
  "boilerplateCode": {
    "python": "Python starter code",
    "cpp": "C++ starter code",
    "java": "Java starter code"
  }
}
Return only the JSON array.`;

const challengePrompt = `Generate a unique, non-trivial coding challenge in JSON format. 
Do NOT generate a problem about reversing a string, palindrome, anagrams, or other classic beginner problems. 
The challenge should be suitable for a coding competition and should not repeat previous examples. 
Vary the topic and difficulty. Use the following structure:
{
  "id": "unique-id",
  "title": "Challenge title",
  "description": "Detailed problem description",
  "difficulty": "easy|medium|hard",
  "timeLimit": 300,
  "inputFormat": "Description of input format",
  "outputFormat": "Description of expected output format",
  "constraints": ["List of constraints"],
  "examples": [
    {
      "input": "Sample input",
      "output": "Expected output",
      "explanation": "Explanation of the example"
    }
  ],
  "testCases": [
    {
      "input": "Test input",
      "output": "Expected output"
    }
  ],
  "boilerplateCode": {
    "python": "Python starter code",
    "cpp": "C++ starter code",
    "java": "Java starter code"
  }
}
Return only the JSON object.`;

function enforceTraditionalBoilerplate(challenge) {
  if (!challenge.boilerplateCode) challenge.boilerplateCode = {};
  challenge.boilerplateCode.cpp = `#include<iostream>\nint main(){\n    return 0;\n}`;
  challenge.boilerplateCode.java = `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n    }\n}`;
  challenge.boilerplateCode.python = `# Enter your python code below`;
}

async function generatePracticeChallengesGemini(n = 5, difficulty = 'Beginner') {
  // Map user-friendly difficulty to prompt values
  const difficultyMap = {
    'Beginner': 'easy',
    'Intermediate': 'medium',
    'Advanced': 'hard'
  };
  const promptDifficulty = difficultyMap[difficulty] || 'easy';
  const prompt = `Generate an array of ${n} unique coding challenges in JSON format. Each challenge should have the following structure:\n\n{
  "id": "unique-id",
  "title": "Challenge title",
  "description": "Detailed problem description",
  "difficulty": "${promptDifficulty}",
  "timeLimit": 300,
  "inputFormat": "Description of input format",
  "outputFormat": "Description of expected output format",
  "constraints": ["List of constraints"],
  "examples": [
    {
      "input": "Sample input",
      "output": "Expected output",
      "explanation": "Explanation of the example"
    }
  ],
  "testCases": [
    {
      "input": "Test input",
      "output": "Expected output"
    }
  ],
  "boilerplateCode": {
    "python": "Python starter code",
    "cpp": "C++ starter code",
    "java": "Java starter code"
  }
}\n\nAll challenges must be at the ${promptDifficulty} difficulty level. Do NOT generate classic problems like reversing a string, palindrome, or anagrams. Return only the JSON array.`;
  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.();
    if (!text) throw new Error('No content from Gemini');

    let challenges;
    try {
      challenges = JSON.parse(text);
    } catch (e) {
      const match = text.match(/```json([\s\S]*?)```/);
      if (match) {
        challenges = JSON.parse(match[1]);
      } else {
        throw new Error('Failed to parse Gemini JSON');
      }
    }

    challenges = Array.isArray(challenges) ? challenges.slice(0, n) : [];

    challenges.forEach(challenge => {
      if (challenge.testCases && Array.isArray(challenge.testCases)) {
        challenge.testCases = challenge.testCases.map(testCase => {
          if (Array.isArray(testCase.input)) {
            console.log('Warning: AI generated array input in practice challenge, converting to string:', testCase.input);
          }
          if (Array.isArray(testCase.output)) {
            console.log('Warning: AI generated array output in practice challenge, converting to string:', testCase.output);
          }
          return {
            input: Array.isArray(testCase.input) ? testCase.input.join('\n') : String(testCase.input || ''),
            output: Array.isArray(testCase.output) ? testCase.output.join('\n') : String(testCase.output || '')
          };
        });
      }
      enforceTraditionalBoilerplate(challenge);
    });

    return challenges;
  } catch (error) {
    console.error('Gemini API error:', error.message || error);
    throw error;
  }
}

async function generateChallengeGemini(difficulty = 'Beginner') {
  // Map user-friendly difficulty to prompt values
  const difficultyMap = {
    'Beginner': 'easy',
    'Intermediate': 'medium',
    'Advanced': 'hard'
  };
  const promptDifficulty = difficultyMap[difficulty] || 'easy';
  const prompt = `Generate a unique, non-trivial coding challenge in JSON format.\nDo NOT generate a problem about reversing a string, palindrome, anagrams, or other classic beginner problems.\nThe challenge should be suitable for a coding competition and should not repeat previous examples.\nThe challenge must be at the ${promptDifficulty} difficulty level.\nUse the following structure:\n{\n  "id": "unique-id",\n  "title": "Challenge title",\n  "description": "Detailed problem description",\n  "difficulty": "${promptDifficulty}",\n  "timeLimit": 300,\n  "inputFormat": "Description of input format",\n  "outputFormat": "Description of expected output format",\n  "constraints": ["List of constraints"],\n  "examples": [\n    {\n      "input": "Sample input",\n      "output": "Expected output",\n      "explanation": "Explanation of the example"\n    }\n  ],\n  "testCases": [\n    {\n      "input": "Test input",\n      "output": "Expected output"\n    }\n  ],\n  "boilerplateCode": {\n    "python": "Python starter code",\n    "cpp": "C++ starter code",\n    "java": "Java starter code"\n  }\n}\nReturn only the JSON object.`;
  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.();
    if (!text) throw new Error('No content from Gemini');

    let challenge;
    try {
      challenge = JSON.parse(text);
    } catch (e) {
      const match = text.match(/```json([\s\S]*?)```/);
      if (match) {
        challenge = JSON.parse(match[1]);
      } else {
        throw new Error('Failed to parse Gemini JSON');
      }
    }

    if (challenge.testCases && Array.isArray(challenge.testCases)) {
      challenge.testCases = challenge.testCases.map(testCase => {
        if (Array.isArray(testCase.input)) {
          console.log('Warning: AI generated array input, converting to string:', testCase.input);
        }
        if (Array.isArray(testCase.output)) {
          console.log('Warning: AI generated array output, converting to string:', testCase.output);
        }
        return {
          input: Array.isArray(testCase.input) ? testCase.input.join('\n') : String(testCase.input || ''),
          output: Array.isArray(testCase.output) ? testCase.output.join('\n') : String(testCase.output || '')
        };
      });
    }

    enforceTraditionalBoilerplate(challenge);
    return challenge;
  } catch (error) {
    console.error('Gemini API error:', error.message || error);
    throw error;
  }
}

module.exports = { generatePracticeChallengesGemini, generateChallengeGemini };

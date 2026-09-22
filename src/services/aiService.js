require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { NotImplementedError, BadGatewayError } = require('../utils/errors');

async function generateContentWithRetry(ai, model, prompt, maxAttempts = 3) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      if (response && response.text) {
        return response;
      }
    } catch (err) {
      lastErr = err;
      // If model not found or no longer available, break out early to try fallback model
      if (
        err.status === 404 ||
        (err.message &&
          (err.message.toLowerCase().includes('not_found') ||
            err.message.toLowerCase().includes('no longer available') ||
            err.message.toLowerCase().includes('not found')))
      ) {
        throw err;
      }
      // Wait before retrying on 503 / transient errors
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  throw lastErr;
}

async function suggestTasksForProject(projectName, projectDescription) {
  let geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    geminiApiKey = geminiApiKey.trim().replace(/^["']|["']$/g, '');
  }

  if (!geminiApiKey || geminiApiKey === 'your-gemini-api-key') {
    throw new NotImplementedError('AI feature not configured', 'AI_NOT_CONFIGURED');
  }

  let rawContent = '';

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const prompt = `You are a software engineering project manager. Analyze the following project and generate 3 to 7 high-impact, actionable development tasks.

Project Name: ${projectName}
Project Description: ${projectDescription || 'N/A'}

Your output MUST be ONLY valid JSON matching this exact structure without any markdown backticks, preambles, or commentary:
[
  {
    "title": "Task title here",
    "priority": "high",
    "rationale": "Why this task is important"
  }
]

Requirements for priority field: must be strictly one of "low", "medium", or "high".
Generate between 3 and 7 tasks.`;

    const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    let response;
    try {
      response = await generateContentWithRetry(ai, preferredModel, prompt);
    } catch (apiErr) {
      // Fallback model sequence if primary model returns 404
      const fallbackModels = ['gemini-3.5-flash', 'gemini-flash-latest'];
      for (const fallbackModel of fallbackModels) {
        try {
          response = await generateContentWithRetry(ai, fallbackModel, prompt);
          if (response) break;
        } catch (fErr) {
          // continue fallback loop
        }
      }
      if (!response) {
        throw apiErr;
      }
    }

    if (response && response.text) {
      rawContent = response.text;
    }
  } catch (err) {
    if (err instanceof NotImplementedError) throw err;
    console.error('[AI SERVICE ERROR]', err);
    throw new BadGatewayError('Failed to communicate with AI provider', 'AI_PROVIDER_ERROR');
  }

  // Parse and validate rawContent
  let tasks = null;
  try {
    let cleanText = rawContent.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
    }
    tasks = JSON.parse(cleanText);
  } catch (parseErr) {
    throw new BadGatewayError('AI returned an invalid response', 'AI_INVALID_RESPONSE');
  }

  if (!Array.isArray(tasks) || tasks.length < 3 || tasks.length > 7) {
    throw new BadGatewayError('AI returned an invalid response', 'AI_INVALID_RESPONSE');
  }

  const validPriorities = ['low', 'medium', 'high'];
  for (const task of tasks) {
    if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
      throw new BadGatewayError('AI returned an invalid response', 'AI_INVALID_RESPONSE');
    }
    if (!task.priority || !validPriorities.includes(task.priority)) {
      task.priority = 'medium';
    }
    if (!task.rationale || typeof task.rationale !== 'string') {
      task.rationale = 'Suggested development task.';
    }
  }

  return tasks;
}

module.exports = {
  suggestTasksForProject,
};

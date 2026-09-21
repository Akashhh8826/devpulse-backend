const Anthropic = require('@anthropic-ai/sdk');
const { NotImplementedError, BadGatewayError } = require('../utils/errors');

async function suggestTasksForProject(projectName, projectDescription) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!anthropicKey && !openaiKey) {
    throw new NotImplementedError('AI feature not configured', 'AI_NOT_CONFIGURED');
  }

  let rawContent = '';

  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey });
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

      const preferredModel = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
      let response;
      try {
        response = await client.messages.create({
          model: preferredModel,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        });
      } catch (apiErr) {
        // If preferredModel (claude-sonnet-4-6) is not recognized by endpoint, fallback to standard sonnet model
        if (apiErr.status === 404 || (apiErr.message && (apiErr.message.includes('model') || apiErr.message.includes('not_found')))) {
          response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          });
        } else {
          throw apiErr;
        }
      }

      if (response && response.content && response.content.length > 0) {
        rawContent = response.content[0].text;
      }
    } catch (err) {
      if (err instanceof NotImplementedError) throw err;
      console.error('[AI SERVICE ERROR]', err);
      throw new BadGatewayError('Failed to communicate with AI provider', 'AI_PROVIDER_ERROR');
    }
  } else if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Analyze the following project and generate 3 to 7 actionable development tasks as valid JSON only:
Project Name: ${projectName}
Project Description: ${projectDescription || 'N/A'}

JSON format:
[
  {
    "title": "Task title",
    "priority": "low" | "medium" | "high",
    "rationale": "Reason"
  }
]`,
            },
          ],
        }),
      });
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        rawContent = data.choices[0].message.content;
      }
    } catch (err) {
      console.error('[AI SERVICE ERROR]', err);
      throw new BadGatewayError('Failed to communicate with AI provider', 'AI_PROVIDER_ERROR');
    }
  }

  // Parse and validate rawContent
  let tasks = null;
  try {
    // Strip code block markers if LLM includes them
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

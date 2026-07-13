require('dotenv').config({ path: '.env.local' });
const { generateObject } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');
const { z } = require('zod');

// Using openai wrapper for groq
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

async function test() {
  try {
    const { object } = await generateObject({
      model: groq('llama-3.1-8b-instant'),
      schema: z.object({
        summary: z.string(),
        points: z.array(z.string()),
        last_objection: z.string().nullable(),
        action: z.string(),
        lead_score: z.enum(['hot', 'warm', 'cold']),
        sentiment: z.enum(['positive', 'neutral', 'negative']),
        priority: z.enum(['high', 'medium', 'low']),
        confidence: z.number().min(0).max(100)
      }),
      prompt: `Analyze this conversation:\nCustomer: Hi\nAgent: Hello`
    });
    console.log("SUCCESS:", object);
  } catch (e) {
    console.error("ERROR:", e);
  }
}

test();

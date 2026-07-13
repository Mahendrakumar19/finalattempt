import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

async function main() {
  try {
    const { text } = await generateText({
      model: groq('llama3-8b-8192'),
      prompt: 'Hello world',
    });
    console.log(text);
  } catch (error) {
    console.error(error);
  }
}

main();

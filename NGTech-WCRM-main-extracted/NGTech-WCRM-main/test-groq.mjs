import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

async function main() {
  try {
    const { text } = await generateText({
      model: groq('llama3-8b-8192'),
      prompt: 'Hello',
    });
    console.log("Success:", text);
  } catch (error) {
    console.error("Error:", error);
  }
}
main();

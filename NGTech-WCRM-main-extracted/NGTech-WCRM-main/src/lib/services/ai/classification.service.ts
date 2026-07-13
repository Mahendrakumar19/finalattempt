import { generateObject } from 'ai';
import { z } from 'zod';
import { AIProviderService } from './provider.service';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase admin
let _adminClient: any = null;
function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _adminClient;
}

const ClassificationSchema = z.object({
  intent: z.string().describe("The primary intent or purpose of the message."),
  department: z.string().nullable().describe("The name of the best matching department from the provided list, or null if unknown."),
  confidence: z.number().min(0).max(100).describe("Confidence score (0-100) of this classification."),
  priority: z.enum(["low", "medium", "high", "vip"]).describe("The urgency/priority of the message."),
  sentiment: z.string().describe("The tone/sentiment of the customer (e.g., Neutral, Angry, Happy)."),
  language: z.string().describe("The detected language of the message."),
  tags: z.array(z.string()).describe("2-4 relevant topic tags (e.g. ['ERP', 'Pricing'])."),
  reason: z.string().describe("Brief 1-sentence reasoning for this classification.")
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;

export class AIClassificationService {
  /**
   * Classifies an incoming message to determine routing data.
   */
  static async classifyIncomingMessage(
    accountId: string,
    messageContent: string
  ): Promise<ClassificationResult | null> {
    try {
      const supabase = supabaseAdmin();
      
      // 1. Fetch AI Settings and Departments
      const [aiRes, deptRes] = await Promise.all([
        supabase
          .from('ai_assistant_settings')
          .select('provider, model')
          .eq('account_id', accountId)
          .single(),
        supabase
          .from('departments')
          .select('name')
          .eq('account_id', accountId)
          .eq('status', 'active')
      ]);

      const aiSettings = aiRes.data;
      const departments = deptRes.data || [];
      const departmentNames = departments.map(d => d.name).join(', ');

      // If no AI configured, fallback to basic defaults
      const provider = aiSettings?.provider || 'gemini';
      const modelName = aiSettings?.model || 'gemini-1.5-pro';

      const model = AIProviderService.getModel(provider, modelName);

      // 2. Build structured prompt
      const systemPrompt = `You are an Enterprise Routing AI.
Your job is to analyze incoming customer messages and output a structured classification to route them correctly.

Available Departments: [${departmentNames}]

Instructions:
1. ONLY pick a department from the exactly provided Available Departments list. Do not invent departments.
2. If none match or you are unsure, set department to null and confidence lower.
3. Priority can be 'low', 'medium', 'high', or 'vip'.
4. Confidence should be an integer between 0 and 100.
`;

      // 3. Generate structured object
      const { object } = await generateObject({
        model,
        schema: ClassificationSchema,
        system: systemPrompt,
        prompt: `Message from customer:\n\n"${messageContent}"`,
      });

      return object;
    } catch (err) {
      console.error('[AIClassificationService] Failed to classify message:', err);
      return null;
    }
  }
}

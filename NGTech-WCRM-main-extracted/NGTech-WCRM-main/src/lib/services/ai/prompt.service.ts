import type { AIAssistantSettings } from '@/types';

export class AIPromptService {
  /**
   * Constructs the master system prompt dynamically based on configured rules,
   * structured knowledge base, and base settings.
   */
  static buildSystemPrompt(config: Partial<AIAssistantSettings>, history: string = ''): string {
    const { 
      system_prompt = 'You are a helpful customer support assistant for this business.',
      personality,
      knowledge_base,
      knowledge_base_structured,
      ai_rules,
      handoff_rules,
      advanced_settings
    } = config;

    let finalPrompt = `System: ${system_prompt}\n\nIMPORTANT INSTRUCTIONS:\n1. Detect the language of the customer's message and ALWAYS reply in that exact same language. Never switch languages unless the customer does first.\n2. Answer the user's question concisely using ONLY the provided Knowledge Base below.\n3. CONVERSATIONAL GREETING: If the user only says "Hi", "Hello", or gives a simple greeting, DO NOT dump company information. Reply with a brief, friendly greeting and ask how you can help them today.\n4. If the user explicitly asks to speak to a human, expresses extreme frustration, or asks a complex question entirely unrelated to the Knowledge Base, you MUST call the requestHumanHandoff tool.\n5. Do not offer a human specialist unless they ask for one or you absolutely cannot help them with the Knowledge Base.\n\nFORMATTING RULES (WhatsApp):\n- Use *bold* for headings and key terms.\n- Put each point on its OWN line using a line break.\n- Use bullet points (• or -) when listing items. NEVER combine multiple points into one paragraph.\n- Keep responses short and scannable — max 3-5 bullet points per answer.\n- Add an empty line between sections for readability.\n- NEVER use markdown links, headers (#), or HTML. WhatsApp only supports *bold*, _italic_, ~strikethrough~, and \`monospace\`.`;
    
    // 1. Language constraint override
    if (advanced_settings?.response_language && advanced_settings.response_language !== 'auto') {
      finalPrompt += `\n6. EXCEPTION to Instruction 1: You must ONLY reply in ${advanced_settings.response_language}.`;
    }

    // 2. Personality
    if (personality) {
      finalPrompt += `\n\nPersonality / Persona:\n${personality}`;
    }

    // 3. AI Rules Constraints
    if (ai_rules) {
      const { 
        allowed_topics, restricted_topics, max_length, 
        never_answer, always_mention, preferred_tone, 
        response_style, emoji_usage, reply_format 
      } = ai_rules;

      if (allowed_topics) finalPrompt += `\n\nAllowed Topics:\n${allowed_topics}`;
      if (restricted_topics) finalPrompt += `\n\nRestricted Topics (DO NOT DISCUSS THESE):\n${restricted_topics}`;
      if (never_answer) finalPrompt += `\n\nNever Answer Questions About:\n${never_answer}`;
      if (always_mention) finalPrompt += `\n\nAlways Mention (if relevant):\n${always_mention}`;
      if (preferred_tone) finalPrompt += `\n\nTone:\n${preferred_tone}`;
      if (response_style) finalPrompt += `\n\nResponse Style:\n${response_style}`;
      if (emoji_usage) finalPrompt += `\n\nEmoji Usage:\n${emoji_usage}`;
      if (reply_format) finalPrompt += `\n\nReply Format:\n${reply_format === 'bullet_points' ? 'Use bullet points for readability.' : 'Use professional paragraphs.'}`;
      if (max_length) finalPrompt += `\n\nKeep your responses strictly under ${max_length} characters.`;
    }

    // 4. Handoff Rules Constraints
    if (handoff_rules) {
      if (handoff_rules.escalate_when && handoff_rules.escalate_when.length > 0) {
        finalPrompt += `\n\nESCALATION RULES: You MUST call the requestHumanHandoff tool if the customer's intent matches ANY of the following:\n- ${handoff_rules.escalate_when.join('\n- ')}`;
      }
    }

    // 5. Build Comprehensive Knowledge Base
    finalPrompt += `\n\n--- KNOWLEDGE BASE START ---`;
    
    // Legacy single text field
    if (knowledge_base?.trim()) {
      finalPrompt += `\n\n[General Information]\n${knowledge_base}`;
    }

    // Structured JSONB Fields
    if (knowledge_base_structured) {
      if (knowledge_base_structured.manual_text?.trim()) {
        finalPrompt += `\n\n[Additional Context]\n${knowledge_base_structured.manual_text}`;
      }
      
      if (knowledge_base_structured.company_info) {
        const ci = knowledge_base_structured.company_info;
        finalPrompt += `\n\n[Company Profile]`;
        if (ci.vision) finalPrompt += `\nVision: ${ci.vision}`;
        if (ci.mission) finalPrompt += `\nMission: ${ci.mission}`;
        if (ci.services) finalPrompt += `\nServices: ${ci.services}`;
        if (ci.office_locations) finalPrompt += `\nLocations: ${ci.office_locations}`;
        if (ci.working_hours) finalPrompt += `\nHours: ${ci.working_hours}`;
        if (ci.phone) finalPrompt += `\nPhone: ${ci.phone}`;
        if (ci.email) finalPrompt += `\nEmail: ${ci.email}`;
        if (ci.website) finalPrompt += `\nWebsite: ${ci.website}`;
      }

      if (knowledge_base_structured.faqs && knowledge_base_structured.faqs.length > 0) {
        finalPrompt += `\n\n[Frequently Asked Questions]`;
        knowledge_base_structured.faqs.forEach(faq => {
          finalPrompt += `\nQ: ${faq.question}\nA: ${faq.answer}`;
        });
      }

      if (knowledge_base_structured.products && knowledge_base_structured.products.length > 0) {
        finalPrompt += `\n\n[Product Catalog]`;
        knowledge_base_structured.products.forEach(p => {
          finalPrompt += `\n- Product: ${p.name}`;
          if (p.category) finalPrompt += ` (Category: ${p.category})`;
          if (p.pricing) finalPrompt += ` | Price: ${p.pricing}`;
          finalPrompt += `\n  Description: ${p.description}`;
          if (p.features) finalPrompt += `\n  Features: ${p.features}`;
        });
      }
    }
    
    finalPrompt += `\n--- KNOWLEDGE BASE END ---`;

    if (history) {
      finalPrompt += `\n\nRecent Conversation History:\n${history}`;
    }
    
    finalPrompt += `\n\nAssistant:`;

    return finalPrompt;
  }
}

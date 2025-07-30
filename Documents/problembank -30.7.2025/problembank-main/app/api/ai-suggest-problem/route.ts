import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ProblemSuggestions {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  tags: string[];
  deadline: string;
  resources: string;
  criteria: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.json();

    /** ------------  OpenAI client ------------- **/
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    /** ----------- SYSTEM MSG (tone-setter) -------------- **/
    const systemPrompt = `
You are a concise technical writer.
Write every field in SIMPLE English, first-person singular
("I / my").  Do not use "we / our / us" or "you".
Keep sentences short and direct.  Avoid filler words.
`.trim();

    /** ----------- USER MSG (instructions) --------------- **/
    let userPrompt: string;
    
    if (formData.isRewriteRequest && formData.description) {
      // For rewrite requests, use the description as the basis for rewriting
      userPrompt = `
### Task
Rewrite and improve the following problem description with fresh perspective, different wording, and alternative approaches while keeping the same core problem concept:

**Current Description:** ${formData.description}
**Title:** ${formData.title}

### Output — return **only** valid JSON with keys:
• "title"        — keep original title: "${formData.title}"
• "description"  — rewritten version, 60-100 words, first-person ("I notice… My aim…")  
• "category"     — technology | healthcare | education | environment | finance | social  
• "difficulty"   — beginner | intermediate | advanced | expert  
• "tags"         — 3–5 lower-case strings  
• "deadline"     — YYYY-MM-DD, 14-28 days from today  
• "resources"    — markdown bullets, ≤40 chars each (max 3 bullets)  
• "criteria"     — numbered list inside one string, each line ≤15 words

### Style rules
1. Use "I / my"; never "we / our / you".  
2. Present tense, active voice.  
3. No jargon; plain words.  
4. Output pure JSON — no code fences or comments.
`.trim();
    } else {
      // Original suggestion logic
      userPrompt = `
### Task
Create a compact problem object for the title **${formData.title}**.

### Output — return **only** valid JSON with keys:
• "title"        — keep as given  
• "description"  — 60-100 words, first-person ("I notice… My aim…")  
• "category"     — technology | healthcare | education | environment | finance | social  
• "difficulty"   — beginner | intermediate | advanced | expert  
• "tags"         — 3–5 lower-case strings  
• "deadline"     — YYYY-MM-DD, 14-28 days from today  
• "resources"    — markdown bullets, ≤40 chars each (max 3 bullets)  
• "criteria"     — numbered list inside one string, each line ≤15 words  

### Style rules
1. Use "I / my"; never "we / our / you".  
2. Present tense, active voice.  
3. No jargon; plain words.  
4. Output pure JSON — no code fences or comments.
`.trim();
    }

    /** -------------  Chat completion --------- **/
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 800,
      response_format: { type: 'json_object' }
    });

    /* ---------  Safety: truncated answer?  ------ */
    if (completion.choices[0].finish_reason === 'length') {
      throw new Error(
        'Response was truncated. Try a shorter prompt or increase max_completion_tokens.'
      );
    }

    /* ---------  Parse & validate  -------------- */
    const text = completion.choices[0].message.content;
    if (!text) throw new Error('Empty response from AI');

    const suggestions = JSON.parse(text) as Partial<ProblemSuggestions>;

    const required = [
      'title',
      'description',
      'category',
      'difficulty',
      'tags',
      'deadline',
      'resources',
      'criteria',
    ];
    const missing = required.filter((f) => !(f in suggestions));
    if (missing.length) {
      throw new Error(`AI response missing required fields: ${missing.join(', ')}`);
    }
    if (!Array.isArray(suggestions.tags)) throw new Error('tags must be an array');

    /* --------- Pronoun enforcer -------------- */
    const banned = /\b(you|your|yours|we|our|ours|us)\b/i;
    const requiredPronouns = /\b(i|my|mine)\b/i;
    
    // Fields that should have first-person singular voice (prose content)
    const proseFields = ['description'];
    // Fields to completely skip from pronoun checking
    const exemptFields = ['title', 'category', 'difficulty', 'tags', 'deadline'];

    function checkPronouns(obj: Record<string, any>) {
      const problems: string[] = [];

      const scan = (val: any, path = '', requireSingular = false, skipBanned = false) => {
        if (typeof val === 'string') {
          // Check for banned pronouns unless field is exempt
          if (!skipBanned && banned.test(val)) {
            problems.push(`Forbidden pronoun in ${path || 'root'}: "${val.match(banned)![0]}"`);
          }
          // Only require "I/my" in prose fields
          if (requireSingular && !requiredPronouns.test(val)) {
            problems.push(`Missing "I/my" in ${path || 'root'}`);
          }
        } else if (Array.isArray(val)) {
          val.forEach((v, i) => scan(v, `${path}[${i}]`, requireSingular, skipBanned));
        } else if (val && typeof val === 'object') {
          for (const k in val) {
            const fieldPath = `${path ? path + '.' : ''}${k}`;
            const shouldRequireSingular = proseFields.includes(k);
            const shouldSkipBanned = exemptFields.includes(k) || skipBanned; // Propagate exemption
            
            // If this field is exempt, skip all pronoun checking for its contents
            if (exemptFields.includes(k)) {
              continue; // Skip this entire field and its contents
            }
            
            scan(val[k], fieldPath, shouldRequireSingular, shouldSkipBanned);
          }
        }
      };

      scan(obj);
      return problems;
    }

    const pronounIssues = checkPronouns(suggestions);
    if (pronounIssues.length) {
      throw new Error(`Pronoun style violations:\n- ${pronounIssues.join('\n- ')}`);
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('AI suggest error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate AI suggestions' },
      { status: 500 }
    );
  }
} 
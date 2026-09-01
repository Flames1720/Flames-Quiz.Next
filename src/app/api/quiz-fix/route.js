import { NextResponse } from 'next/server';

/**
 * POST /api/quiz-fix
 * Body: { text: string, errors?: Array<{line,message,code}> }
 * Returns: { text: string, fixes: Array<{line, reason, before?, after?}>, source: 'llm'|'local' }
 *
 * Env (server-only):
 *   AI_API_KEY     – required for LLM path (OpenAI / Groq / xAI / any OpenAI-compatible)
 *   AI_BASE_URL    – default https://api.openai.com/v1
 *                    Groq:  https://api.groq.com/openai/v1
 *                    xAI:   https://api.x.ai/v1
 *   AI_MODEL       – default gpt-4o-mini (Groq: llama-3.3-70b-versatile, xAI: grok-2-latest)
 */

const SYSTEM = `You are a quiz content repair tool for Flames Quiz.

INPUT is raw multi-question quiz text using this format:
Q: question text (LaTeX allowed as $...$ or bare)
A: option
B: option ##    ← ## marks the CORRECT option (exactly one per question)
C: option
D: option
R: optional explanation

Questions are separated by a blank line.

Your job: fix STRUCTURE only so the parser accepts the content.
- Normalize option prefixes (A. / A) / A- → A:)
- Add missing "Q:" on the first line of a block if it looks like a question
- If a block has options but no ##, mark the most likely correct option with ## (if ambiguous, mark the first option and note it)
- Insert blank lines between glued question blocks
- Preserve all original wording, numbers, and LaTeX — do NOT rewrite questions
- Do NOT invent new options or change meanings
- Keep ## on the correct answer line (same line as the option text)

CRITICAL — line numbers:
Lines are 1-based indices into the ORIGINAL input (before your edits).
When you inject or change something, report the line number in the ORIGINAL input that the change relates to (the option line you marked, the line you prefixed with Q:, etc.).
If you insert a blank line, use the line number of the following Q: in the original text.

Respond with ONLY valid JSON (no markdown fences):
{
  "text": "<full fixed quiz text>",
  "fixes": [
    { "line": <number>, "reason": "<short reason>", "before": "<snippet>", "after": "<snippet>" }
  ]
}`;

function localFallback(text) {
  // Inline minimal local fix so the API still works without a key
  const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const fixes = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*([A-Da-d])\s*[.)\-]\s+(.*)$/);
    if (m && !/^\s*[A-Da-d]\s*:/.test(lines[i])) {
      const after = `${m[1].toUpperCase()}: ${m[2]}`;
      fixes.push({ line: i + 1, before: lines[i], after, reason: 'Normalized option prefix' });
      lines[i] = after;
    }
  }

  const blocks = [];
  let cur = [];
  let start = 1;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) {
      if (cur.length) { blocks.push({ indices: cur, startLine: start }); cur = []; }
      start = i + 2;
    } else {
      if (!cur.length) start = i + 1;
      cur.push(i);
    }
  }
  if (cur.length) blocks.push({ indices: cur, startLine: start });

  blocks.forEach((block, bi) => {
    const hasQ = block.indices.some(i => /^\s*Q\s*:/i.test(lines[i]));
    const optionIdx = block.indices.filter(i => /^\s*[A-D]\s*:/i.test(lines[i]));
    const hasCorrect = optionIdx.some(i => lines[i].includes('##'));

    if (!hasQ && block.indices.length) {
      const firstIdx = block.indices[0];
      if (!/^\s*[A-DR]\s*:/i.test(lines[firstIdx])) {
        const after = `Q: ${lines[firstIdx].trim()}`;
        fixes.push({ line: firstIdx + 1, before: lines[firstIdx], after, reason: `Block ${bi + 1}: added Q:` });
        lines[firstIdx] = after;
      }
    }
    if (optionIdx.length && !hasCorrect) {
      const target = optionIdx[0];
      const after = lines[target].replace(/\s*$/, '') + ' ##';
      fixes.push({ line: target + 1, before: lines[target], after, reason: `Block ${bi + 1}: marked first option with ## (review!)` });
      lines[target] = after;
    }
  });

  return { text: lines.join('\n'), fixes, source: 'local' };
}

function extractJson(raw) {
  if (!raw) throw new Error('Empty model response');
  let s = raw.trim();
  // Strip markdown fences if the model ignores instructions
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // Find outermost object
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in model response');
  return JSON.parse(s.slice(start, end + 1));
}

export async function POST(req) {
  try {
    const body = await req.json();
    const text = body?.text;
    const parseErrors = Array.isArray(body?.errors) ? body.errors : [];

    if (!text || !String(text).trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
    const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      const fallback = localFallback(text);
      return NextResponse.json({
        ...fallback,
        warning: 'No AI_API_KEY (or OPENAI_API_KEY / GROQ_API_KEY / XAI_API_KEY) set — used local structural fix.',
      });
    }

    const userPayload = {
      originalText: String(text),
      knownParseErrors: parseErrors.map(e => ({
        line: e.line,
        message: e.message,
        code: e.code,
      })),
      instruction: 'Return fixed text + fixes with ORIGINAL line numbers.',
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: JSON.stringify(userPayload) },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('AI provider error', res.status, errText);
      // Soft-fail to local so the creator still works
      const fallback = localFallback(text);
      return NextResponse.json({
        ...fallback,
        warning: `LLM request failed (${res.status}) — used local fix. ${errText.slice(0, 200)}`,
      });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = extractJson(content);

    if (!parsed || typeof parsed.text !== 'string') {
      const fallback = localFallback(text);
      return NextResponse.json({
        ...fallback,
        warning: 'LLM returned invalid shape — used local fix.',
      });
    }

    const fixes = Array.isArray(parsed.fixes)
      ? parsed.fixes.map(f => ({
          line: Number(f.line) || 1,
          reason: String(f.reason || 'Fixed'),
          before: f.before != null ? String(f.before) : undefined,
          after: f.after != null ? String(f.after) : undefined,
        }))
      : [];

    return NextResponse.json({
      text: parsed.text,
      fixes,
      source: 'llm',
      model,
    });
  } catch (err) {
    console.error('/api/quiz-fix error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

/**
 * POST /api/ai-fix
 * Body: { text: string, errors?: Array<{line, message, code}> }
 *
 * Uses an OpenAI-compatible Chat Completions API.
 * Env:
 *   AI_API_KEY   (required for cloud AI)
 *   AI_BASE_URL  (optional, default https://api.openai.com/v1)
 *   AI_MODEL     (optional, default gpt-4o-mini)
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text : '';
    const parseErrors = Array.isArray(body?.errors) ? body.errors : [];

    if (!text.trim()) {
      return NextResponse.json({ error: 'No quiz text provided' }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'AI_API_KEY not configured',
          code: 'NO_API_KEY',
          hint: 'Set AI_API_KEY (and optionally AI_BASE_URL, AI_MODEL) in Vercel / .env.local',
        },
        { status: 503 }
      );
    }

    // Number every line so the model can report accurate line numbers
    const numbered = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line, i) => `${String(i + 1).padStart(4, ' ')}|${line}`)
      .join('\n');

    const errorHint = parseErrors.length
      ? `Known parser issues:\n${parseErrors.map((e) => `- Line ${e.line}: ${e.message}`).join('\n')}`
      : 'No prior parser errors provided.';

    const system = `You are a quiz-format repair tool for Flames Quiz.

STRICT FORMAT rules for the quiz language:
- Questions are separated by a blank line.
- Each question block:
  Q: <question text, LaTeX allowed as $...$>
  A: <option>
  B: <option>
  C: <option>   (optional)
  D: <option>   (optional)
  R: <explanation> (optional)
- Exactly one option in each block must end with ## to mark the correct answer.
- Prefer $...$ around math (e.g. $P_{\\text{O}_2}$).

Your job:
1. Fix structure only when needed (missing Q:, missing ##, bad option prefixes A./A), missing blank lines).
2. Do NOT invent new facts or change the meaning of questions/answers unless required to mark a correct answer that was clearly intended.
3. If no ## exists, choose the most plausible correct option and mark it with ##.
4. Preserve the author's wording as much as possible.
5. Return ONLY valid JSON (no markdown fences) with this shape:
{
  "fixedText": "<full fixed quiz text, WITHOUT the line-number prefixes>",
  "fixes": [
    { "line": <1-based line in the ORIGINAL text>, "reason": "<short reason>" }
  ],
  "summary": "<one sentence>"
}`;

    const user = `${errorHint}

ORIGINAL TEXT (each line is "LINE|content" — use LINE for the "line" field in fixes):
${numbered}`;

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('AI provider error', resp.status, errText);
      return NextResponse.json(
        {
          error: `AI provider error (${resp.status})`,
          detail: errText.slice(0, 500),
          code: 'PROVIDER_ERROR',
        },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON object if model wrapped it
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          return NextResponse.json(
            { error: 'AI returned non-JSON', detail: content.slice(0, 400), code: 'BAD_JSON' },
            { status: 502 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'AI returned non-JSON', detail: content.slice(0, 400), code: 'BAD_JSON' },
          { status: 502 }
        );
      }
    }

    const fixedText = typeof parsed.fixedText === 'string' ? parsed.fixedText : text;
    const fixes = Array.isArray(parsed.fixes)
      ? parsed.fixes
          .filter((f) => f && (f.line || f.reason))
          .map((f) => ({
            line: Number(f.line) || 1,
            reason: String(f.reason || 'AI adjustment'),
            before: f.before,
            after: f.after,
          }))
      : [];

    return NextResponse.json({
      fixedText,
      fixes,
      summary: parsed.summary || `AI applied ${fixes.length} fix(es)`,
      model,
      source: 'llm',
    });
  } catch (err) {
    console.error('AI fix route error', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

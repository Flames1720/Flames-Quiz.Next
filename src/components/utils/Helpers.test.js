import { describe, it, expect } from 'vitest';
import { parseQuizContent, autoFixQuizContent } from './parser';

describe('parseQuizContent', () => {
  it('parses a valid single question block', () => {
    const raw = `Q: What is 2+2?\nA: 3\nB: 4 ##\nC: 5\nR: Because 2+2=4`;
    const { questions, error } = parseQuizContent(raw);
    expect(error).toBeNull();
    expect(questions.length).toBe(1);
    const q = questions[0];
    expect(q.text).toBe('What is 2+2?');
    expect(q.options.B).toBe('4');
    expect(q.correct).toBe('B');
    expect(q.explanation).toBe('Because 2+2=4');
  });

  it('reports the real line number when correct answer is missing', () => {
    const raw = `Q: First is fine\nA: one ##\nB: two\n\nQ: Missing correct\nA: one\nB: two\nC: three`;
    const { error, errors } = parseQuizContent(raw);
    expect(error).toBeTruthy();
    const miss = errors.find(e => e.code === 'missing_correct');
    expect(miss).toBeTruthy();
    // Second block starts around line 5
    expect(miss.line).toBeGreaterThan(4);
    expect(miss.message).toMatch(/line \d+/i);
  });

  it('returns an error when a block is missing Q:', () => {
    const raw = `A: no question here\nB: answer ##`;
    const { error, errors } = parseQuizContent(raw);
    expect(error).toBeTruthy();
    expect(errors[0].code).toBe('missing_q');
    expect(errors[0].line).toBe(1);
  });

  it('tracks line numbers across multiple blocks', () => {
    const raw = [
      'Q: One',
      'A: a ##',
      'B: b',
      '',
      'Q: Two',
      'A: x',
      'B: y ##',
    ].join('\n');
    const { questions, error } = parseQuizContent(raw);
    expect(error).toBeNull();
    expect(questions[0]._startLine).toBe(1);
    expect(questions[1]._startLine).toBe(5);
  });
});

describe('autoFixQuizContent', () => {
  it('injects ## on the first option at the correct line', () => {
    const raw = `Q: No marker\nA: first\nB: second`;
    const { text, fixes } = autoFixQuizContent(raw);
    expect(fixes.length).toBeGreaterThan(0);
    expect(fixes[0].line).toBe(2); // A: line
    expect(text).toMatch(/A: first ##/);
  });

  it('adds Q: prefix when missing', () => {
    const raw = `What is life?\nA: 42 ##\nB: 7`;
    const { text, fixes } = autoFixQuizContent(raw);
    expect(text.startsWith('Q:')).toBe(true);
    expect(fixes.some(f => f.reason.includes('Q:'))).toBe(true);
  });

  it('normalizes A. style options', () => {
    const raw = `Q: Style\nA. one ##\nB. two`;
    const { text } = autoFixQuizContent(raw);
    expect(text).toMatch(/A: one/);
    expect(text).toMatch(/B: two/);
  });
});

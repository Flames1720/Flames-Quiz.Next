import { describe, it, expect } from 'vitest';
import { parseQuizContent } from './parser';

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

  it('returns an error when a block is missing a correct answer', () => {
    const raw = `Q: Missing correct\nA: one\nB: two\nC: three`;
    const { questions, error } = parseQuizContent(raw);
    expect(error).toBeTruthy();
    expect(error).toMatch(/missing a correct answer/i);
  });

  it('returns an error when a block is missing Q:', () => {
    const raw = `A: no question here\nB: answer ##`;
    const { questions, error } = parseQuizContent(raw);
    expect(error).toBeTruthy();
    expect(error).toMatch(/missing the question text/i);
  });
});

export const stringifyQuizContent = (qs) => qs.map(q => {
    let block = `Q: ${q.text}\n`;
    ['A','B','C','D'].forEach(k => {
        if (q.options[k]) block += `${k}: ${q.options[k]} ${q.correct === k ? '##' : ''}\n`;
    });
    if (q.explanation) block += `R: ${q.explanation}\n`;
    return block;
}).join('\n\n');

/**
 * Parse quiz text into questions with accurate line numbers for errors.
 * Returns { questions, error, errors } where errors is an array of
 * { line, message, blockIndex } for UI / auto-fix injection.
 */
export const parseQuizContent = (text) => {
    if (!text || !String(text).trim()) {
        return {
            questions: [],
            error: 'Content is empty',
            errors: [{ line: 1, message: 'Content is empty', blockIndex: 0 }],
        };
    }

    // Normalize line endings and keep original line map
    const normalized = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const allLines = normalized.split('\n');

    // Split into blocks by blank lines, but track the starting line (1-based) of each block
    const blocks = [];
    let current = [];
    let blockStartLine = 1;

    for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i];
        const isBlank = !line.trim();

        if (isBlank) {
            if (current.length) {
                blocks.push({ lines: current, startLine: blockStartLine });
                current = [];
            }
            // next non-blank starts a new block
            blockStartLine = i + 2;
        } else {
            if (!current.length) blockStartLine = i + 1;
            current.push({ text: line, lineNum: i + 1 });
        }
    }
    if (current.length) {
        blocks.push({ lines: current, startLine: blockStartLine });
    }

    const questions = [];
    const errors = [];

    blocks.forEach((block, blockIndex) => {
        const q = {
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `q-${Date.now()}-${blockIndex}`,
            text: '',
            options: {},
            correct: '',
            explanation: '',
            _startLine: block.startLine,
        };

        let qLine = null;
        let correctLine = null;

        block.lines.forEach(({ text: line, lineNum }) => {
            const trimmed = line.trim();

            // Q: ...
            if (/^Q\s*:/i.test(trimmed)) {
                q.text = trimmed.replace(/^Q\s*:/i, '').trim();
                qLine = lineNum;
                return;
            }
            // R: explanation
            if (/^R\s*:/i.test(trimmed)) {
                q.explanation = trimmed.replace(/^R\s*:/i, '').trim();
                return;
            }
            // A:/B:/C:/D: with optional ## marker
            const optMatch = trimmed.match(/^([A-Da-d])\s*[:.)\-]\s*(.*)$/);
            if (optMatch) {
                const key = optMatch[1].toUpperCase();
                let val = optMatch[2].trim();
                if (val.includes('##') || /\s##\s*$/.test(val) || val.endsWith('##')) {
                    q.correct = key;
                    correctLine = lineNum;
                    val = val.replace(/##/g, '').trim();
                }
                q.options[key] = val;
                return;
            }

            // Continuation of previous field (multi-line Q) — append to text if Q already started and no options yet
            if (q.text && Object.keys(q.options).length === 0 && !/^R\s*:/i.test(trimmed)) {
                q.text += ' ' + trimmed;
            }
        });

        if (!q.text) {
            errors.push({
                line: block.startLine,
                message: `Block ${blockIndex + 1} (line ${block.startLine}): missing question text (Q:)`,
                blockIndex,
                code: 'missing_q',
            });
        }
        if (!q.correct) {
            errors.push({
                line: qLine || block.startLine,
                message: `Block ${blockIndex + 1} (line ${qLine || block.startLine}): missing correct answer (mark one option with ##)`,
                blockIndex,
                code: 'missing_correct',
            });
        }
        // Soft warn: fewer than 2 options
        if (Object.keys(q.options).length < 2 && q.text) {
            errors.push({
                line: qLine || block.startLine,
                message: `Block ${blockIndex + 1} (line ${qLine || block.startLine}): needs at least 2 options (A/B/...)`,
                blockIndex,
                code: 'few_options',
            });
        }

        questions.push(q);
    });

    // Primary error string for backward compatibility (first real problem)
    const hard = errors.filter(e => e.code === 'missing_q' || e.code === 'missing_correct');
    const error = hard.length ? hard.map(e => e.message).join(' · ') : (errors.length ? errors.map(e => e.message).join(' · ') : null);

    // Only treat as fatal if missing Q or correct; few_options is soft
    const fatal = hard.length > 0;

    return {
        questions: fatal ? questions : questions,
        error: fatal ? error : null,
        errors,
        fatal,
    };
};

/**
 * Local auto-fix: inject missing markers / structure at the correct lines.
 * Does NOT invent answer content — only structural fixes.
 *
 * Fixes:
 *  - If a block has options but no ##, mark the first option as correct and annotate
 *  - Ensure blank line between blocks
 *  - Normalize "A." / "A)" to "A:"
 *  - Ensure Q: prefix if first line looks like a bare question
 */
export const autoFixQuizContent = (text) => {
    const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');
    const fixes = []; // { line (1-based), before, after, reason }

    // Pass 1: normalize option prefixes A. / A) -> A:
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^\s*([A-Da-d])\s*[.)\-]\s+(.*)$/);
        if (m && !/^\s*[A-Da-d]\s*:/.test(lines[i])) {
            const next = `${m[1].toUpperCase()}: ${m[2]}`;
            fixes.push({ line: i + 1, before: lines[i], after: next, reason: 'Normalized option prefix to A:/B:/C:/D:' });
            lines[i] = next;
        }
    }

    // Pass 2: group into blocks with line numbers
    const blocks = [];
    let cur = [];
    let start = 1;
    for (let i = 0; i < lines.length; i++) {
        if (!lines[i].trim()) {
            if (cur.length) {
                blocks.push({ indices: cur, startLine: start });
                cur = [];
            }
            start = i + 2;
        } else {
            if (!cur.length) start = i + 1;
            cur.push(i);
        }
    }
    if (cur.length) blocks.push({ indices: cur, startLine: start });

    blocks.forEach((block, bi) => {
        const blockLines = block.indices.map(i => lines[i]);
        const hasQ = blockLines.some(l => /^\s*Q\s*:/i.test(l));
        const optionIdx = block.indices.filter(i => /^\s*[A-D]\s*:/i.test(lines[i]));
        const hasCorrect = optionIdx.some(i => lines[i].includes('##'));

        // Inject Q: on first line if missing and it doesn't look like an option
        if (!hasQ && block.indices.length) {
            const firstIdx = block.indices[0];
            if (!/^\s*[A-DR]\s*:/i.test(lines[firstIdx])) {
                const next = `Q: ${lines[firstIdx].trim()}`;
                fixes.push({ line: firstIdx + 1, before: lines[firstIdx], after: next, reason: `Block ${bi + 1}: added missing Q: prefix` });
                lines[firstIdx] = next;
            }
        }

        // Inject ## on first option if none marked
        if (optionIdx.length && !hasCorrect) {
            const target = optionIdx[0];
            const next = lines[target].replace(/\s*$/, '') + ' ##';
            fixes.push({
                line: target + 1,
                before: lines[target],
                after: next,
                reason: `Block ${bi + 1}: no correct answer — marked first option with ## (review this!)`,
            });
            lines[target] = next;
        }
    });

    // Pass 3: ensure a blank line between consecutive non-empty blocks that got glued
    // (if user used single newlines between questions starting with Q:)
    const joined = [];
    for (let i = 0; i < lines.length; i++) {
        joined.push(lines[i]);
        if (
            i < lines.length - 1 &&
            lines[i].trim() &&
            /^\s*Q\s*:/i.test(lines[i + 1]) &&
            !/^\s*Q\s*:/i.test(lines[i])
        ) {
            // previous line is not blank and next starts a new Q → insert blank
            // only if current line looks like end of previous block (option or R)
            if (/^\s*([A-D]|R)\s*:/i.test(lines[i])) {
                joined.push('');
                fixes.push({ line: i + 2, before: '(missing blank line)', after: '', reason: 'Inserted blank line before next Q: block' });
            }
        }
    }

    const fixedText = joined.join('\n');
    return { text: fixedText, fixes };
};

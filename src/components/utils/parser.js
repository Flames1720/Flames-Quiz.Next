export const stringifyQuizContent = (qs) => qs.map(q => {
    let block = `Q: ${q.text}\n`;
    ['A','B','C','D'].forEach(k => { if(q.options[k]) block += `${k}: ${q.options[k]} ${q.correct===k?'##':''}\n`; });
    if(q.explanation) block += `R: ${q.explanation}\n`; return block;
}).join('\n\n');

export const parseQuizContent = (text) => {
    const blocks = text.split(/\n\s*\n/); const qs = []; let err = null;
    blocks.forEach((b, i) => {
        if(!b.trim()) return; const lines = b.split('\n').map(l=>l.trim()).filter(Boolean);
        const q = { id: crypto.randomUUID(), text: '', options: {}, correct: '', explanation: '' };
        lines.forEach(l => {
            if(l.startsWith('Q:')) q.text = l.substring(2).trim();
            else if(l.startsWith('R:')) q.explanation = l.substring(2).trim();
            else { const key = l[0]; if(['A','B','C','D'].includes(key)) { if(l.includes('##')) { q.correct = key; q.options[key] = l.substring(2).replace('##','').trim(); } else q.options[key] = l.substring(2).trim(); } }
        });
        if(!q.text) {
            err = `Block ${i+1} is missing the question text (Q:)`;
        } else if(!q.correct) {
            err = `Block ${i+1} is missing a correct answer (mark one option with ##)`;
        }
        qs.push(q);
    });
    return { questions: qs, error: err };
};

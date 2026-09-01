"use client";
import React, { useState, useEffect, useRef } from 'react';
import { serverTimestamp, collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GlassCard, Button } from './ui/Shared';
import { LatexText, stringifyQuizContent, parseQuizContent, autoFixQuizContent } from './utils/Helpers';
import { Eye, EyeOff, Wand2, AlertTriangle, Loader2 } from 'lucide-react';

const parseTime = (str) => {
    if (!str) return 0;
    const m = String(str).match(/(\d+)\s*m/i);
    if (m) return parseInt(m[1], 10) * 60;
    const n = parseInt(str, 10);
    return Number.isFinite(n) ? n * 60 : 0;
};

export default function QuizCreator({ user, initialData, onPublish }) {
    const [title, setTitle] = useState('');
    const [timeStr, setTimeStr] = useState('');
    const [category, setCategory] = useState('');
    const [rawText, setRawText] = useState('');
    const [mode, setMode] = useState('study');
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState([]);
    const [fixLog, setFixLog] = useState([]);
    const [fixMeta, setFixMeta] = useState(null); // { source, warning, model }
    const [isPublishing, setIsPublishing] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const textareaRef = useRef(null);

    const appId = "flames_quiz_app";

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setTimeStr(initialData.timeLimit ? Math.floor(initialData.timeLimit / 60) + "m" : '');
            setCategory(initialData.category || '');
            setRawText(stringifyQuizContent(initialData.questions));
            setMode(initialData.mode || 'study');
            setPreview(initialData.questions);
        }
    }, [initialData]);

    const jumpToLine = (lineNum) => {
        const el = textareaRef.current;
        if (!el || !lineNum) return;
        const lines = el.value.split('\n');
        let pos = 0;
        for (let i = 0; i < Math.min(lineNum - 1, lines.length); i++) {
            pos += lines[i].length + 1;
        }
        el.focus();
        el.setSelectionRange(pos, pos + (lines[lineNum - 1]?.length || 0));
        const lineHeight = el.scrollHeight / Math.max(lines.length, 1);
        el.scrollTop = Math.max(0, (lineNum - 3) * lineHeight);
    };

    const applyParseResult = (result) => {
        setErrors(result.errors || []);
        if (result.fatal || result.error) {
            setError(result.error);
            setPreview(null);
        } else {
            setError(null);
            setPreview(result.questions);
        }
    };

    const handleParse = () => {
        setFixLog([]);
        setFixMeta(null);
        applyParseResult(parseQuizContent(rawText));
    };

    /** Prefer server LLM; fall back to local autoFixQuizContent */
    const handleAutoFix = async () => {
        setIsFixing(true);
        setFixMeta(null);
        try {
            // Current parse errors help the model target the right lines
            const pre = parseQuizContent(rawText);

            let fixedText = null;
            let fixes = [];
            let meta = { source: 'local' };

            try {
                const res = await fetch('/api/quiz-fix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: rawText,
                        errors: pre.errors || [],
                    }),
                });
                const data = await res.json();
                if (res.ok && data?.text) {
                    fixedText = data.text;
                    fixes = Array.isArray(data.fixes) ? data.fixes : [];
                    meta = {
                        source: data.source || 'llm',
                        warning: data.warning,
                        model: data.model,
                    };
                } else {
                    throw new Error(data?.error || 'AI Fix request failed');
                }
            } catch (netErr) {
                // Offline / API down → pure client local fix
                const local = autoFixQuizContent(rawText);
                fixedText = local.text;
                fixes = local.fixes;
                meta = {
                    source: 'local',
                    warning: `Could not reach AI API (${netErr.message}). Used local structural fix.`,
                };
            }

            setRawText(fixedText);
            setFixLog(fixes);
            setFixMeta(meta);
            applyParseResult(parseQuizContent(fixedText));

            if (fixes.length) {
                setTimeout(() => jumpToLine(fixes[0].line), 50);
            }
        } finally {
            setIsFixing(false);
        }
    };

    const handlePublish = async () => {
        if (!title || !preview) return;
        setIsPublishing(true);
        try {
            const quizData = {
                title,
                category: category || 'General',
                timeLimit: parseTime(timeStr),
                questions: preview,
                mode,
                active: true,
                createdAt: serverTimestamp(),
                creatorId: user.uid,
                creatorName: user.displayName || 'Anonymous',
            };
            if (initialData?.id) {
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', initialData.id), quizData);
            } else {
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), quizData);
            }
            alert("Published!");
            onPublish();
        } catch (e) {
            alert(e.message);
        }
        setIsPublishing(false);
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8 animate-fade-in">
            <GlassCard>
                <h3 className="text-xl font-bold mb-4">{initialData ? 'Edit Quiz' : 'Create Quiz'}</h3>
                <div className="space-y-4">
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-lg bg-slate-950/50 border border-white/20 text-white" placeholder="Title" />
                    <div className="flex gap-4">
                        <input value={category} onChange={e => setCategory(e.target.value)} className="flex-1 p-3 rounded-lg bg-slate-950/50 border border-white/20 text-white" placeholder="Category (e.g. Physics)" />
                        <input value={timeStr} onChange={e => setTimeStr(e.target.value)} className="flex-1 p-3 rounded-lg bg-slate-950/50 border border-white/20 text-white" placeholder="Time (10m)" />
                    </div>
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-white/10 h-[50px]">
                        <Button onClick={() => setMode('study')} className={`flex-1 rounded ${mode === 'study' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}><Eye size={16}/> Study</Button>
                        <Button onClick={() => setMode('test')} className={`flex-1 rounded ${mode === 'test' ? 'bg-red-600 text-white' : 'text-slate-400'}`}><EyeOff size={16}/> Test</Button>
                    </div>

                    <div className="text-xs text-slate-500 p-2 bg-slate-900 rounded border border-white/5 font-mono whitespace-pre-wrap">
                        {`Format: Q: text (math: $P_{\\text{O}_2}$)\nA: opt  B: opt ##  C: opt  R: explanation\nBlank line between questions`}
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={rawText}
                        onChange={e => setRawText(e.target.value)}
                        className="w-full h-64 p-3 rounded-lg font-mono text-sm bg-slate-950/50 border border-white/20 text-white"
                        placeholder={"Q: What is $2+2$?\nA: 3\nB: 4 ##\nC: 5\nR: Basic arithmetic\n\nQ: Next question..."}
                    />

                    <div className="flex gap-2">
                        <Button onClick={handleParse} className="flex-1" disabled={isFixing}>Parse</Button>
                        <Button onClick={handleAutoFix} variant="secondary" className="flex-1" disabled={isFixing || !rawText.trim()}>
                            {isFixing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                            {isFixing ? 'Fixing…' : 'AI Fix'}
                        </Button>
                    </div>

                    {error && (
                        <div className="text-red-400 text-xs space-y-1 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="font-bold flex items-center gap-1"><AlertTriangle size={14}/> Parse errors</div>
                            {(errors.length ? errors : [{ line: 1, message: error }]).map((e, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => jumpToLine(e.line)}
                                    className="block w-full text-left hover:underline"
                                >
                                    Line {e.line}: {e.message}
                                </button>
                            ))}
                        </div>
                    )}

                    {(fixLog.length > 0 || fixMeta?.warning) && (
                        <div className="text-amber-300 text-xs space-y-1 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <div className="font-bold flex flex-wrap items-center gap-2">
                                <span>AI Fix ({fixLog.length} change{fixLog.length === 1 ? '' : 's'})</span>
                                {fixMeta?.source && (
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] uppercase tracking-wide">
                                        {fixMeta.source}{fixMeta.model ? ` · ${fixMeta.model}` : ''}
                                    </span>
                                )}
                            </div>
                            {fixMeta?.warning && (
                                <p className="text-amber-200/80">{fixMeta.warning}</p>
                            )}
                            {fixLog.map((f, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => jumpToLine(f.line)}
                                    className="block w-full text-left hover:underline"
                                >
                                    Line {f.line}: {f.reason}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </GlassCard>

            <div className="space-y-6">
                {preview ? (
                    <GlassCard className="border-green-500/30">
                        <h3 className="text-green-400 font-bold mb-4">Ready ({preview.length} Qs)</h3>
                        <div className="space-y-3 mb-6 max-h-[320px] overflow-y-auto pr-2 text-sm">
                            {preview.slice(0, 8).map((q, i) => (
                                <div key={q.id || i} className="p-3 bg-white/5 rounded border border-white/5">
                                    <div className="font-medium mb-1"><LatexText text={`${i + 1}. ${q.text}`} /></div>
                                    <div className="text-green-400 text-xs">Answer: <LatexText text={q.options[q.correct] || ''} /></div>
                                </div>
                            ))}
                            {preview.length > 8 && <div className="text-slate-500 text-xs">+{preview.length - 8} more…</div>}
                        </div>
                        <Button onClick={handlePublish} className="w-full bg-green-600" disabled={isPublishing}>
                            {isPublishing ? 'Publishing…' : 'Publish'}
                        </Button>
                    </GlassCard>
                ) : (
                    <div className="text-center text-slate-500 mt-20">Preview appears after a successful Parse / AI Fix</div>
                )}
            </div>
        </div>
    );
}

"use client";
import React, { useState, useEffect } from 'react';
import { serverTimestamp, collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GlassCard, Button } from './ui/Shared';
import { LatexText } from './utils/Helpers';
import { Eye, EyeOff, LayoutDashboard, Tag } from 'lucide-react';

const formatTime = (seconds) => { if(!seconds) return ""; return Math.floor(seconds/60) + "m"; }; 
const parseTime = (str) => { return parseInt(str)*60 || 0; };
const stringifyQuizContent = (qs) => qs.map(q => {
    let block = `Q: ${q.text}\n`;
    ['A','B','C','D'].forEach(k => { if(q.options[k]) block += `${k}: ${q.options[k]} ${q.correct===k?'##':''}\n`; });
    if(q.explanation) block += `R: ${q.explanation}\n`; return block;
}).join('\n\n');
const parseQuizContent = (text) => {
    const blocks = text.split(/\n\s*\n/); const qs = []; let err = null;
    blocks.forEach((b, i) => {
        if(!b.trim()) return; const lines = b.split('\n').map(l=>l.trim()).filter(Boolean);
        const q = { id: crypto.randomUUID(), text: '', options: {}, correct: '', explanation: '' };
        lines.forEach(l => {
            if(l.startsWith('Q:')) q.text = l.substring(2).trim();
            else if(l.startsWith('R:')) q.explanation = l.substring(2).trim();
            else { const key = l[0]; if(['A','B','C','D'].includes(key)) { if(l.includes('##')) { q.correct = key; q.options[key] = l.substring(2).replace('##','').trim(); } else q.options[key] = l.substring(2).trim(); } }
        });
        if(!q.text || !q.correct) err = `Block ${i+1} incomplete`; qs.push(q);
    });
    return { questions: qs, error: err };
};

export default function QuizCreator({ user, initialData, onPublish }) {
    const [title, setTitle] = useState('');
    const [timeStr, setTimeStr] = useState('');
    const [category, setCategory] = useState('');
    const [rawText, setRawText] = useState('');
    const [mode, setMode] = useState('study');
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [isPublishing, setIsPublishing] = useState(false);
    
    const appId = "flames_quiz_app";

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setTimeStr(initialData.timeLimit ? Math.floor(initialData.timeLimit/60)+"m" : '');
            setCategory(initialData.category || ''); 
            setRawText(stringifyQuizContent(initialData.questions));
            setMode(initialData.mode || 'study');
            setPreview(initialData.questions);
        }
    }, [initialData]);

    const handleParse = () => { const { questions, error } = parseQuizContent(rawText); if (error) setError(error); else { setError(null); setPreview(questions); } };

    const handlePublish = async () => {
        if (!title || !preview) return;
        setIsPublishing(true);
        try {
            const quizData = { 
                title, 
                category: category || 'General', 
                timeLimit: parseTime(timeStr), 
                questions: preview, mode, active: true, createdAt: serverTimestamp(),
                creatorId: user.uid, creatorName: user.displayName || 'Anonymous' 
            };
            if (initialData?.id) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', initialData.id), quizData);
            else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), quizData);
            alert("Published!"); onPublish(); 
        } catch (e) { alert(e.message); }
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
                        <button onClick={() => setMode('study')} className={`flex-1 rounded ${mode === 'study' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}><Eye size={16}/> Study</button>
                        <button onClick={() => setMode('test')} className={`flex-1 rounded ${mode === 'test' ? 'bg-red-600 text-white' : 'text-slate-400'}`}><EyeOff size={16}/> Test</button>
                    </div>
                    <textarea value={rawText} onChange={e => setRawText(e.target.value)} className="w-full h-64 p-3 rounded-lg font-mono text-sm bg-slate-950/50 border border-white/20 text-white" placeholder="Q: Question..." />
                    <Button onClick={handleParse} className="w-full">Parse</Button>
                    {error && <div className="text-red-400 text-xs">{error}</div>}
                </div>
            </GlassCard>
            <div className="space-y-6">
                {preview ? <GlassCard className="border-green-500/30"><h3 className="text-green-400 font-bold mb-4">Ready ({preview.length} Qs)</h3><Button onClick={handlePublish} className="w-full bg-green-600" disabled={isPublishing}>Publish</Button></GlassCard> : <div className="text-center text-slate-500 mt-20">Preview</div>}
            </div>
        </div>
    );
}
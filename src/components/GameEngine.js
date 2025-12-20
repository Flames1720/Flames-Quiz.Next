"use client";
import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { GlassCard, Button } from './ui/Shared';
import { LatexText, CircularTimer } from './utils/Helpers';

export default function GameEngine({ quiz, user, playerName, onFinish, onExit }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [skipped, setSkipped] = useState(new Set());
    const [timeLeft, setTimeLeft] = useState(quiz.timeLimit || null);
    const [startTime] = useState(Date.now());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const timerRef = useRef(null);
    
    const mode = quiz.mode || 'study'; 
    const appId = "flames_quiz_app";

    const answersRef = useRef(answers);
    const skippedRef = useRef(skipped);

    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { skippedRef.current = skipped; }, [skipped]);

    const finishGame = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);
        
        if (typeof window !== 'undefined') {
            localStorage.setItem(`flames_completed_${quiz.id}`, 'true');
        }
        
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        let score = 0; 
        const stats = {};
        const finalAnswers = answersRef.current;
        const finalSkipped = skippedRef.current;

        quiz.questions.forEach((q, idx) => {
            const isCorrect = finalAnswers[idx] === q.correct;
            if (isCorrect) score++;
            stats[q.id] = { correct: isCorrect, answered: finalAnswers[idx] || 'skipped' };
        });

        const accuracy = Math.round((score / quiz.questions.length) * 100);
        const resultData = { 
            quizId: quiz.id, 
            quizTitle: quiz.title, 
            playerName: playerName || 'Guest', 
            score, 
            totalQuestions: quiz.questions.length, 
            accuracy, 
            skippedCount: finalSkipped.size, 
            timeSpent, 
            stats, 
            timestamp: Date.now() 
        };
        
        if (typeof window !== 'undefined') {
            localStorage.setItem(`flames_result_${quiz.id}`, JSON.stringify(resultData));
        }

        try { 
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'results'), resultData); 
        } catch (err) { console.error("Save failed", err); }
        
        onFinish(resultData);
    };

    useEffect(() => {
        if (quiz.timeLimit) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        finishGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timerRef.current);
        }
    }, []);

    const handleAnswer = (choiceKey) => { 
        if (mode === 'study' && answers[currentIdx]) return; 
        setAnswers(prev => ({ ...prev, [currentIdx]: choiceKey })); 
    };
    
    const handleSkip = () => { 
        setSkipped(prev => new Set(prev).add(currentIdx)); 
        if (currentIdx < quiz.questions.length - 1) setCurrentIdx(curr => curr + 1); 
    };
    
    const handleNext = () => { 
        if (currentIdx < quiz.questions.length - 1) setCurrentIdx(curr => curr + 1); 
        else finishGame(); 
    };

    const q = quiz.questions[currentIdx];
    const answered = !!answers[currentIdx];
    const isLast = currentIdx === quiz.questions.length - 1;
    const progress = ((currentIdx) / quiz.questions.length) * 100;

    return (
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col animate-fade-in relative">
            <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-xl border border-white/5 relative z-20">
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="secondary" className="px-3 py-1 text-xs" onClick={onExit}>Exit</Button>
                    <div className="flex-1 max-w-md">
                        <h3 className="text-sm text-slate-400">Question {currentIdx + 1} / {quiz.questions.length} <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded bg-white/10">{mode} Mode</span></h3>
                        <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
                {quiz.timeLimit && <div className="ml-4"><CircularTimer timeLeft={timeLeft} totalTime={quiz.timeLimit} /></div>}
            </div>

            <GlassCard className="flex-1 flex flex-col justify-center mb-6 relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-tight">
                    <LatexText text={q.text} />
                </h2>
                <div className="grid gap-4">
                    {['A', 'B', 'C', 'D'].map(key => { 
                        if (!q.options[key]) return null; 
                        let stateStyle = "hover:bg-white/5 border-white/10";
                        if (mode === 'study' && answered) {
                            if (key === q.correct) stateStyle = "text-green-400 bg-green-500/10 border-green-500/30"; 
                            else if (answers[currentIdx] === key) stateStyle = "text-red-400 bg-red-500/10 border-red-500/30"; 
                            else stateStyle = "opacity-40 border-transparent";
                        } else if (mode === 'test' && answers[currentIdx] === key) {
                            stateStyle = "bg-orange-500/20 border-orange-500 text-orange-200"; 
                        }
                        return (
                            <button key={key} onClick={() => handleAnswer(key)} disabled={mode === 'study' && answered} className={`w-full text-left p-5 rounded-xl border transition-all flex justify-between items-center ${stateStyle} ${(!answered || mode === 'test') ? 'hover:scale-[1.01]' : ''}`}>
                                <span className="text-lg font-medium"><span className="opacity-50 mr-4 font-mono">{key}</span> <LatexText text={q.options[key]} /></span>
                                {mode === 'study' && answered && key === q.correct && <CheckCircle size={20} />}
                                {mode === 'study' && answered && answers[currentIdx] === key && key !== q.correct && <XCircle size={20} />}
                            </button>
                        ); 
                    })}
                </div>
                {mode === 'study' && answered && q.explanation && <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-200 text-sm animate-fade-in"><span className="font-bold mr-2">Insight:</span> <LatexText text={q.explanation} /></div>}
            </GlassCard>

            <div className="flex justify-between items-center">
                <Button variant="secondary" onClick={() => setCurrentIdx(p => Math.max(0, p-1))} disabled={currentIdx === 0}><ArrowLeft size={20} /></Button>
                <div className="flex gap-4">
                    {!answered && <Button variant="secondary" onClick={handleSkip}>Skip</Button>}
                    <Button onClick={handleNext} disabled={!answered && !skipped.has(currentIdx) && mode === 'study'}>{isLast ? (isSubmitting ? 'Submitting...' : 'Finish Challenge') : 'Next Question'}{!isLast && <ArrowRight size={20} />}</Button>
                </div>
            </div>
        </div>
    );
}
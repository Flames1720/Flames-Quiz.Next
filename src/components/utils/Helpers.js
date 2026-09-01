"use client";
import { useEffect, useRef } from 'react';
import katex from 'katex';

/**
 * Render text that may contain LaTeX.
 * Supports:
 *  - $...$ / $$...$$
 *  - \(...\) / \[...\]
 *  - Bare math tokens (e.g. P_{\\text{O}_2}, 2400\\text{mL}) via a light pre-pass
 */
export const LatexText = ({ text }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || text == null) return;

        const source = String(text);

        // Prefer KaTeX auto-render when available (CDN scripts in layout.js)
        if (typeof window !== 'undefined' && window.renderMathInElement) {
            containerRef.current.innerHTML = source;
            try {
                window.renderMathInElement(containerRef.current, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '\\[', right: '\\]', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                    ],
                    throwOnError: false,
                    strict: 'ignore',
                });
            } catch (e) {
                // fall through to manual path
            }
            // If auto-render left raw LaTeX visible (no $ wrappers), try a safe wrap pass
            const stillRaw = /\\text\{|_\{|\^\{|\\frac|\\mathrm|\\mathrm/.test(containerRef.current.textContent || '');
            if (!stillRaw) return;
        }

        // Manual path: wrap common bare math fragments, then render with katex package
        try {
            let html = source
                // Already delimited blocks — leave alone for now; handle whole-string later
                .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => {
                    try { return katex.renderToString(m, { displayMode: true, throwOnError: false }); }
                    catch { return _; }
                })
                .replace(/\$([^$\n]+?)\$/g, (_, m) => {
                    try { return katex.renderToString(m, { displayMode: false, throwOnError: false }); }
                    catch { return _; }
                });

            // Bare patterns often seen in physiology quizzes
            html = html.replace(
                /\bP_\{\\text\{O\}_2\}/g,
                () => katex.renderToString('P_{\\text{O}_2}', { throwOnError: false })
            );
            html = html.replace(
                /(\d+)\\text\{([a-zA-Zμµ°%\/]+)\}/g,
                (_, n, unit) => katex.renderToString(`${n}\\,\\text{${unit}}`, { throwOnError: false })
            );
            html = html.replace(
                /\\text\{([a-zA-Zμµ°%\/]+)\}/g,
                (_, unit) => katex.renderToString(`\\text{${unit}}`, { throwOnError: false })
            );

            containerRef.current.innerHTML = html;
        } catch (e) {
            containerRef.current.textContent = source;
        }
    }, [text]);

    return <span ref={containerRef}>{text}</span>;
};

export const CircularTimer = ({ timeLeft, totalTime }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const safeTotal = totalTime && totalTime > 0 ? totalTime : 1;
    const safeTime = typeof timeLeft === 'number' ? Math.max(0, timeLeft) : 0;
    const progress = safeTime / safeTotal;
    const strokeDashoffset = circumference - Math.max(0, Math.min(1, progress)) * circumference;
    let color = "text-blue-500";
    if (timeLeft < totalTime * 0.5) color = "text-yellow-400";
    if (timeLeft <= 10) color = "text-red-500";
    const minutes = Math.floor(safeTime / 60);
    const seconds = safeTime % 60;
    const displayTime = safeTime >= 60 ? `${minutes}:${String(seconds).padStart(2, '0')}` : String(safeTime);

    return (
        <div className={`relative flex items-center justify-center ${safeTime <= 10 ? 'animate-pulse' : ''}`}>
            <svg viewBox="0 0 64 64" className="transform -rotate-90 w-16 h-16">
                <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`${color} transition-all duration-700 ease-linear`} strokeLinecap="round" />
            </svg>
            <span className={`absolute font-bold font-mono ${color} text-xs`}>{displayTime}</span>
        </div>
    );
};

export const validateNickname = (name) => {
    if (name.length < 3) return "Name too short (min 3 chars).";
    if (!/[a-zA-Z]/.test(name)) return "Must contain at least one letter.";
    if (/(.)\1{3}/.test(name)) return "Please avoid spamming repeated letters.";
    return null;
};

export { parseQuizContent, stringifyQuizContent, autoFixQuizContent } from './parser';

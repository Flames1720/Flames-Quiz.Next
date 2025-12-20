import React from 'react';

export const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-6 relative z-10 ${className}`}>
    {children}
  </div>
);

export const Button = ({ onClick, children, variant = 'primary', className = "", disabled = false }) => {
  const base = "px-6 py-3 rounded-lg font-bold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: `bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg`,
    secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10",
    danger: "bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/20",
    ghost: "text-slate-400 hover:text-white"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
};
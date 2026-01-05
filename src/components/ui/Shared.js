import React from 'react';

export const GlassCard = ({ children, className = "" }) => (
  <div className={`glass-card shadow-xl p-6 relative z-10 ${className}`}>
    {children}
  </div>
);

export const Button = ({ onClick, children, variant = 'primary', className = "", disabled = false, type='button' }) => {
  const base = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: `bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg`,
    secondary: "bg-white/6 hover:bg-white/12 text-white border border-white/10",
    danger: "bg-red-600/10 hover:bg-red-600/20 text-red-300 border border-red-600/10",
    ghost: "bg-transparent text-slate-300 hover:text-white"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant] || variants.primary} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
};
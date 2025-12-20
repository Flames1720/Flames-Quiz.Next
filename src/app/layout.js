import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
// We import CSS here, but we also need the scripts in the head
import "katex/dist/katex.min.css"; 

export const metadata = {
  title: "Flames Quiz",
  description: "Ignite your mind with futuristic quizzes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
          {/* KaTeX CSS */}
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
          {/* KaTeX JS Library */}
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
          {/* KaTeX Auto-Render Extension */}
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
      </head>
      <body className="bg-slate-950 text-slate-200 overflow-x-hidden">
        <AuthProvider>
           {/* Background Animation */}
           <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600 rounded-full blur-[120px] opacity-20 animate-blob"></div>
              <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-orange-500 rounded-full blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
           </div>
           
           <div className="relative z-10 min-h-screen">
             {children}
           </div>
        </AuthProvider>
      </body>
    </html>
  );
}
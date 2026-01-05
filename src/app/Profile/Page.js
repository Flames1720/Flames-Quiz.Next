"use client";
import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PerformanceCard from "../../components/PerformanceCard";
import { GlassCard, Button } from "../../components/ui/Shared";
import { Download, ArrowLeft, User } from "lucide-react";
import { toPng } from 'html-to-image';
import Link from "next/link";

export default function Profile() {
    const { user, userData } = useAuth();
    const cardRef = useRef();
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        setTimeout(async () => {
            try {
                const url = await toPng(cardRef.current, { cacheBust: true, backgroundColor: '#020617' });
                const a = document.createElement('a');
                a.download = 'My_Performance_Card.png';
                a.href = url;
                a.click();
            } catch(e) { alert("Download failed"); }
            setDownloading(false);
        }, 100);
    };

    if(!user) {
        if (typeof window !== 'undefined') { window.location.href = '/auth'; return null; }
        return <div className="p-10 text-center">Please login.</div>;
    }

    return (
        <div className="min-h-screen p-4 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                <Link href="/dashboard"><Button variant="secondary" className="mb-6"><ArrowLeft size={16}/> Back</Button></Link>
                
                <h1 className="text-3xl font-bold mb-6">My Profile</h1>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Visual Card Preview */}
                    <div className="flex flex-col gap-4">
                         <div className="overflow-hidden rounded-2xl border border-white/20 shadow-2xl transform scale-95 lg:scale-100 origin-top-left">
                             <PerformanceCard ref={cardRef} user={user} userData={userData} />
                         </div>
                         <Button onClick={handleDownload} disabled={downloading} className="w-full bg-blue-600">
                             {downloading ? "Generating..." : <><Download size={18}/> Download Card</>}
                         </Button>
                    </div>

                    {/* Detailed Stats */}
                    <GlassCard>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><User size={20}/> Account Details</h3>
                        <div className="space-y-4 text-sm text-slate-300">
                            <div className="flex justify-between border-b border-white/5 pb-2"><span>Email</span> <span className="text-white">{user.email}</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-2"><span>Nickname</span> <span className="text-orange-400">{userData?.displayName || "Not Set"}</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-2"><span>Role</span> <span className="text-green-400">{userData?.isCreator ? "Creator" : "Player"}</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-2"><span>Status</span> <span className="text-purple-400">Active</span></div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
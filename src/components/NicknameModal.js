"use client";
import { useState } from "react";
import { GlassCard, Button } from "./ui/Shared";
import { validateNickname } from "./utils/Helpers";
import { UserCheck } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function NicknameModal({ user, onComplete }) {
    const [name, setName] = useState("");
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const validationMsg = validateNickname(name);
        if (validationMsg) { setError(validationMsg); return; }

        setSaving(true);
        try {
            await updateDoc(doc(db, 'artifacts', 'flames_quiz_app', 'users', user.uid), {
                displayName: name,
                nicknameSetAt: serverTimestamp() // Lock date
            });
            onComplete(name);
        } catch (e) {
            setError("Failed to save nickname.");
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
            <GlassCard className="max-w-md w-full text-center">
                <div className="flex justify-center mb-4"><div className="p-3 bg-blue-600/20 rounded-full"><UserCheck className="text-blue-400" size={32}/></div></div>
                <h2 className="text-2xl font-bold mb-2">Identify Yourself</h2>
                <p className="text-slate-400 text-sm mb-6">Set your unique nickname. This will appear on your results.</p>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-200 mb-6 text-left">
                    ⚠️ <strong>Warning:</strong> You cannot change this name again for <strong>30 days</strong>. Choose wisely!
                </div>

                <input 
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(null); }}
                    placeholder="Enter nickname (e.g. Phoenix🔥)"
                    className="w-full p-4 rounded-lg bg-slate-950 border border-white/20 text-white mb-2 focus:border-blue-500 outline-none"
                />
                {error && <p className="text-red-400 text-xs mb-4 text-left">{error}</p>}

                <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500">
                    {saving ? "Locking Identity..." : "Set Nickname"}
                </Button>
            </GlassCard>
        </div>
    );
}
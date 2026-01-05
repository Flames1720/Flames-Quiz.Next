import { NextResponse } from 'next/server';
import { getAdmin } from '../../../../lib/firebaseAdmin';

export async function GET(req, { params }) {
  try {
    const admin = getAdmin();
    const db = admin.firestore();
    const quizId = params.id;
    const docRef = db.doc(`artifacts/flames_quiz_app/public/data/quizzes/${quizId}`);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = snap.data();
    // Firestore Timestamps are not JSON-serializable; convert if present
    if (data && data.createdAt && data.createdAt.toMillis) data.createdAt = data.createdAt.toMillis();
    return NextResponse.json({ id: snap.id, ...data });
  } catch (err) {
    console.error('API /api/quizzes/[id] error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

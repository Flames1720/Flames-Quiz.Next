import { getAdmin } from "../../../lib/firebaseAdmin";
import GameWrapper from "../../../components/GameWrapper";

export async function generateMetadata({ params }) {
  try {
    const admin = getAdmin();
    const db = admin.firestore();
    const quizId = params.id;
    const docRef = db.doc(`artifacts/flames_quiz_app/public/data/quizzes/${quizId}`);
    const snap = await docRef.get();
    if (!snap.exists) return { title: "Not Found" };
    const quiz = snap.data();
    return {
      title: `${quiz.title} | Flames Quiz`,
      description: `Category: ${quiz.category || 'General'} • ${quiz.questions?.length || 0} Qs`,
      openGraph: {
        title: `${quiz.title} | Flames Quiz`,
        description: `Category: ${quiz.category || 'General'} • ${quiz.questions?.length || 0} Qs`,
      },
    };
  } catch (e) {
    return { title: "Flames Quiz" };
  }
}

export default async function QuizPage({ params }) {
  const admin = getAdmin();
  const db = admin.firestore();
  const quizId = params.id;
  const docRef = db.doc(`artifacts/flames_quiz_app/public/data/quizzes/${quizId}`);
  const snap = await docRef.get();

  if (!snap.exists) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Quiz not found.</div>;
  }

  const quiz = { id: snap.id, ...snap.data() };
  if (quiz.createdAt && typeof quiz.createdAt.toMillis === "function") quiz.createdAt = quiz.createdAt.toMillis();

  return (
    <div className="p-4 min-h-screen flex flex-col items-center justify-center">
      <GameWrapper quiz={quiz} />
    </div>
  );
}
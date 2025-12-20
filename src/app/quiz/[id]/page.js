import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase"; 
import GameWrapper from "../../../components/GameWrapper";

export async function generateMetadata({ params }) {
  const quizId = params.id;
  const docRef = doc(db, 'artifacts', 'flames_quiz_app', 'public', 'data', 'quizzes', quizId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const quiz = snap.data();
    return { title: `${quiz.title} | Flames Quiz`, description: `Category: ${quiz.category} • ${quiz.questions.length} Qs` };
  }
  return { title: "Not Found" };
}

export default async function QuizPage({ params }) {
  const quizId = params.id;
  const docRef = doc(db, 'artifacts', 'flames_quiz_app', 'public', 'data', 'quizzes', quizId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return <div className="min-h-screen flex items-center justify-center text-red-500">Quiz not found.</div>;

  const quiz = { id: snap.id, ...snap.data() };
  if(quiz.createdAt) quiz.createdAt = quiz.createdAt.toMillis();

  return (
     <div className="p-4 min-h-screen flex flex-col items-center justify-center">
       <GameWrapper quiz={quiz} />
     </div>
  );
}
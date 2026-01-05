import admin from 'firebase-admin';

function getServiceAccountFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!privateKey) return null;
  // When setting FIREBASE_PRIVATE_KEY in environments like Vercel, newlines may be escaped.
  privateKey = privateKey.replace(/\\n/g, '\n');

  return { projectId, clientEmail, privateKey };
}

export function getAdmin() {
  if (admin.apps && admin.apps.length) return admin;

  const svc = getServiceAccountFromEnv();
  if (!svc || !svc.privateKey || !svc.clientEmail || !svc.projectId) {
    throw new Error('Missing Firebase Admin credentials. Set FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: svc.projectId,
      clientEmail: svc.clientEmail,
      privateKey: svc.privateKey,
    }),
    projectId: svc.projectId,
  });

  return admin;
}

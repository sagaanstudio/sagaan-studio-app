const admin = require('firebase-admin');

let firebaseApp;

function initFirebase() {
  if (firebaseApp) return firebaseApp;

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  return firebaseApp;
}

async function verifyFirebaseToken(idToken) {
  const app = initFirebase();
  const decoded = await admin.auth(app).verifyIdToken(idToken);
  return decoded;
}

module.exports = { initFirebase, verifyFirebaseToken };

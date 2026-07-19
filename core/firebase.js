// =============================================================
// FIREBASE — connection layer (Auth + Firestore) for the online AWord.
//
// Zero-build: the SDK is pulled from Google's CDN as ES modules and loaded
// LAZILY (dynamic import) the first time it is actually needed, so pages that
// stay offline never pay for it.
//
// NOTE ON THE CONFIG BELOW: a Firebase web config is PUBLIC BY DESIGN — the
// apiKey only identifies the project, it is not a password and grants nothing
// on its own. The real protection is the Firestore Security Rules published in
// the console (see docs/08-FIREBASE-SETUP.md). So keeping this in a public
// GitHub repo is normal and safe.
//
// Project: AWord (aword-70dae) — owned by namdaptrai01@gmail.com
// =============================================================

const SDK = "https://www.gstatic.com/firebasejs/12.9.0";

export const firebaseConfig = {
  apiKey: "AIzaSyAV_yoyAQM2fKKdOsJyuAxxf4AN7MsF7XY",
  authDomain: "aword-70dae.firebaseapp.com",
  projectId: "aword-70dae",
  storageBucket: "aword-70dae.firebasestorage.app",
  messagingSenderId: "399279049436",
  appId: "1:399279049436:web:b9b34dcfb34732aa744219"
};

// The one account allowed to create/edit/delete. MUST stay in sync with the
// isTeacher() check in the published Firestore rules — changing it here alone
// changes nothing on the server, it only lets the UI show a friendly message.
export const TEACHER_EMAIL = "namdaptrai01@gmail.com";

// ---- lazy singletons -------------------------------------------------------
let _appP = null, _authP = null, _dbP = null;

async function app() {
  if (!_appP) {
    _appP = (async () => {
      const { initializeApp } = await import(`${SDK}/firebase-app.js`);
      return initializeApp(firebaseConfig);
    })();
  }
  return _appP;
}

export async function auth() {
  if (!_authP) {
    _authP = (async () => {
      const [{ getAuth }, a] = await Promise.all([import(`${SDK}/firebase-auth.js`), app()]);
      return getAuth(a);
    })();
  }
  return _authP;
}

export async function db() {
  if (!_dbP) {
    _dbP = (async () => {
      const [{ getFirestore }, a] = await Promise.all([import(`${SDK}/firebase-firestore.js`), app()]);
      return getFirestore(a);
    })();
  }
  return _dbP;
}

// Re-export the Firestore functions callers need, so nothing else in the app
// has to know the CDN URL or the SDK version.
export async function fs() {
  return import(`${SDK}/firebase-firestore.js`);
}

// ---- auth ------------------------------------------------------------------

// Sign in with a Google popup. Returns the signed-in user.
// Throws { code: "aw/not-teacher" } if someone else's account is used — the
// server rules would reject them anyway; this just fails early and clearly.
export async function signIn() {
  const [{ GoogleAuthProvider, signInWithPopup }, a] =
    await Promise.all([import(`${SDK}/firebase-auth.js`), auth()]);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const { user } = await signInWithPopup(a, provider);
  if (!isTeacher(user)) {
    await signOutNow();
    const err = new Error(`Signed in as ${user.email}. Only ${TEACHER_EMAIL} can manage this library.`);
    err.code = "aw/not-teacher";
    throw err;
  }
  return user;
}

export async function signOutNow() {
  const [{ signOut }, a] = await Promise.all([import(`${SDK}/firebase-auth.js`), auth()]);
  return signOut(a);
}

// Watch the sign-in state. Calls back with the user (or null) and keeps
// calling on every change. Returns an unsubscribe function (async).
export async function onUser(cb) {
  const [{ onAuthStateChanged }, a] = await Promise.all([import(`${SDK}/firebase-auth.js`), auth()]);
  return onAuthStateChanged(a, u => cb(isTeacher(u) ? u : null));
}

// Resolves once the FIRST auth state is known (avoids the UI flashing
// "signed out" while Firebase restores a previous session).
export async function currentUser() {
  const a = await auth();
  if (a.currentUser) return isTeacher(a.currentUser) ? a.currentUser : null;
  const { onAuthStateChanged } = await import(`${SDK}/firebase-auth.js`);
  return new Promise(resolve => {
    const stop = onAuthStateChanged(a, u => { stop(); resolve(isTeacher(u) ? u : null); });
  });
}

export function isTeacher(user) {
  return !!user && user.email === TEACHER_EMAIL && user.emailVerified;
}

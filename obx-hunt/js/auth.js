/* ============================================================
   AUTH.JS
   Anonymous sign-in so every visitor gets a stable uid without
   a login screen. Player docs live in /players/{uid}:

   {
     name: "Ava",
     totalCompleted: 2,
     completedDays: { "1": { path: "marsh", completedAt }, ... },
     inProgress: { day: 3, path: "shoreline", stepsDone: 2 } | null,
     createdAt, updatedAt
   }
   ============================================================ */

function waitForAuth() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        resolve(user);
      } else {
        auth.signInAnonymously().catch((err) => {
          console.error("Anonymous sign-in failed:", err);
        });
      }
    });
  });
}

async function getPlayerDoc(uid) {
  const snap = await db.collection("players").doc(uid).get();
  return snap.exists ? snap.data() : null;
}

async function createPlayer(uid, name) {
  const player = {
    name: name.trim().slice(0, 40),
    totalCompleted: 0,
    completedDays: {},
    inProgress: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection("players").doc(uid).set(player);
  return player;
}

/* Player picks a route for today — starts (or restarts) that day's attempt. */
async function startDayProgress(uid, day, pathId) {
  const inProgress = { day, path: pathId, stepsDone: 0 };
  await db.collection("players").doc(uid).update({
    inProgress,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return inProgress;
}

/* One more clue solved on today's chosen route. */
async function advanceProgress(uid, stepsDone) {
  await db.collection("players").doc(uid).update({
    "inProgress.stepsDone": stepsDone,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

/* Final clue on the route solved — day is complete. */
async function completeDay(uid, day, pathId) {
  await db.collection("players").doc(uid).update({
    [`completedDays.${day}`]: {
      path: pathId,
      completedAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    totalCompleted: firebase.firestore.FieldValue.increment(1),
    inProgress: null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

/* Player wants to abandon today's route and try the other one instead. */
async function clearProgress(uid) {
  await db.collection("players").doc(uid).update({
    inProgress: null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

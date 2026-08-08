/* ============================================================
   SIGNUP.JS — logic for index.html
   Just collects a name. Route choice now happens fresh each
   day on the game page.
   ============================================================ */

function nameIsValid() {
  return document.getElementById("name-input").value.trim().length > 0;
}

async function handleBegin(evt) {
  evt.preventDefault();
  const name = document.getElementById("name-input").value.trim();
  if (!name) return;

  const btn = document.getElementById("begin-btn");
  btn.disabled = true;
  btn.textContent = "Setting sail…";

  const user = await waitForAuth();
  const existing = await getPlayerDoc(user.uid);

  if (!existing) {
    await createPlayer(user.uid, name);
  }

  window.location.href = "game.html";
}

async function checkExistingPlayer() {
  const user = await waitForAuth();
  const existing = await getPlayerDoc(user.uid);
  if (existing) {
    const banner = document.getElementById("returning-banner");
    banner.hidden = false;
    banner.querySelector("span").textContent = existing.name;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("name-input").addEventListener("input", () => {
    const btn = document.getElementById("begin-btn");
    const ready = nameIsValid();
    btn.disabled = !ready;
    btn.textContent = ready ? "Begin the Hunt" : "Enter your name to begin";
  });
  document.getElementById("signup-form").addEventListener("submit", handleBegin);
  checkExistingPlayer();
});

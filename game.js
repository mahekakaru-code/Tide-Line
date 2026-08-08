/* ============================================================
   GAME.JS — logic for game.html
   Flow per day:
     1. Not started today  -> show route-choice cards
     2. Route chosen, not finished -> show board + next clue
     3. Route finished today -> show "solved" state
   ============================================================ */

let CURRENT_UID = null;
let PLAYER = null;
let TODAY = null; // { status, day }

async function init() {
  const user = await waitForAuth();
  CURRENT_UID = user.uid;
  PLAYER = await getPlayerDoc(CURRENT_UID);

  if (!PLAYER) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("player-name").textContent = PLAYER.name;
  TODAY = currentDayNumber();

  render();
}

function render() {
  document.getElementById("choice-section").hidden = true;
  document.getElementById("clue-section").hidden = true;
  document.getElementById("solved-section").hidden = true;
  document.getElementById("locked-section").hidden = true;
  document.getElementById("board-panel").hidden = true;
  document.getElementById("game-layout").style.display = "grid";

  if (TODAY.status === "not-started") {
    document.getElementById("game-layout").style.display = "none";
    showLocked("The first puzzle hasn't washed ashore yet. Check back soon.");
    return;
  }
  if (TODAY.status === "no-more-puzzles") {
    document.getElementById("game-layout").style.display = "none";
    showLocked("You've caught up with every puzzle so far — nice work. More are on the way.");
    return;
  }

  const day = TODAY.day;
  document.getElementById("day-badge").textContent = `Day ${day}`;

  const finished = PLAYER.completedDays && PLAYER.completedDays[day];
  if (finished) {
    showSolved(day, finished.path);
    return;
  }

  const inProgress = PLAYER.inProgress;
  if (inProgress && inProgress.day === day) {
    showBoardAndClue(day, inProgress.path, inProgress.stepsDone);
    return;
  }

  document.getElementById("game-layout").style.display = "none";
  showChoice(day);
}

function showLocked(message) {
  const section = document.getElementById("locked-section");
  section.hidden = false;
  section.querySelector("p").textContent = message;
}

function showSolved(day, pathId) {
  const puzzle = getPuzzle(day);
  const path = puzzle.paths[pathId];
  document.getElementById("board-panel").hidden = false;
  renderBoard(document.getElementById("board-svg"), day, pathId, path.moves.length);

  const section = document.getElementById("solved-section");
  section.hidden = false;
  document.getElementById("solved-route").textContent = path.name;
  document.getElementById("solved-dest").textContent = path.destinationName;
}

function showChoice(day) {
  const puzzle = getPuzzle(day);
  const section = document.getElementById("choice-section");
  section.hidden = false;

  const container = document.getElementById("choice-cards");
  container.innerHTML = "";

  Object.entries(puzzle.paths).forEach(([pathId, path]) => {
    const card = document.createElement("div");
    card.className = "route-card";
    card.dataset.path = pathId;
    card.innerHTML = `
      <h3>${path.name}</h3>
      <div class="route-tag">${path.tagline}</div>
      <svg class="mini-map" id="mini-${pathId}"></svg>
      <div class="route-dest">${path.moves.length} clues &middot; ends at ${path.destinationName}</div>
    `;
    card.addEventListener("click", () => choosePath(day, pathId));
    container.appendChild(card);
  });

  Object.keys(puzzle.paths).forEach((pathId) => {
    drawMiniRoute(document.getElementById(`mini-${pathId}`), day, pathId);
  });
}

async function choosePath(day, pathId) {
  const inProgress = await startDayProgress(CURRENT_UID, day, pathId);
  PLAYER.inProgress = inProgress;
  render();
}

function showBoardAndClue(day, pathId, stepsDone) {
  const puzzle = getPuzzle(day);
  const path = puzzle.paths[pathId];

  document.getElementById("board-panel").hidden = false;
  document.documentElement.style.setProperty("--route-color", path.color);
  renderBoard(document.getElementById("board-svg"), day, pathId, stepsDone);

  const section = document.getElementById("clue-section");
  section.hidden = false;
  document.getElementById("active-route-name").textContent = path.name;
  document.getElementById("clue-progress").textContent = `Clue ${stepsDone + 1} of ${path.moves.length}`;

  const move = path.moves[stepsDone];
  document.getElementById("clue-text").textContent = move.clue;
  document.getElementById("answer-input").value = "";
  document.getElementById("answer-feedback").textContent = "";
  document.getElementById("answer-feedback").className = "feedback";

  document.getElementById("answer-form").onsubmit = (evt) => submitAnswer(evt, day, pathId, stepsDone);
  document.getElementById("switch-route-btn").onclick = () => switchRoute(day);
}

async function submitAnswer(evt, day, pathId, stepsDone) {
  evt.preventDefault();
  const puzzle = getPuzzle(day);
  const path = puzzle.paths[pathId];
  const guess = document.getElementById("answer-input").value;
  const feedback = document.getElementById("answer-feedback");

  if (checkAnswer(day, pathId, stepsDone, guess)) {
    const nextSteps = stepsDone + 1;
    if (nextSteps >= path.moves.length) {
      await completeDay(CURRENT_UID, day, pathId);
      PLAYER.completedDays = PLAYER.completedDays || {};
      PLAYER.completedDays[day] = { path: pathId };
      PLAYER.inProgress = null;
      feedback.textContent = `That's it — you've reached ${path.destinationName}!`;
      feedback.className = "feedback feedback-good";
      setTimeout(render, 1000);
    } else {
      await advanceProgress(CURRENT_UID, nextSteps);
      PLAYER.inProgress.stepsDone = nextSteps;
      const move = path.moves[stepsDone];
      feedback.textContent = `Correct! Move ${move.steps} ${move.direction}.`;
      feedback.className = "feedback feedback-good";
      setTimeout(render, 800);
    }
  } else {
    feedback.textContent = "Not quite — give it another look.";
    feedback.className = "feedback feedback-bad";
  }
}

async function switchRoute(day) {
  const ok = window.confirm(
    "Switch routes? You'll lose progress on today's current route and start the other one from the beginning."
  );
  if (!ok) return;
  await clearProgress(CURRENT_UID);
  PLAYER.inProgress = null;
  render();
}

document.addEventListener("DOMContentLoaded", init);

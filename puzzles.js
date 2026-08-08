/* ============================================================
   PUZZLES.JS
   Each day is its own standalone puzzle: a small maze with two
   route options (e.g. a short/easy Marsh Route and a longer
   Shoreline Route). A player picks ONE route for the day and
   must solve every clue on it, in order, to "get out of the
   maze" and complete that day. Miss a day and it's gone — a
   fresh puzzle (and fresh choice) shows up tomorrow.

   Add more days by copying a block below and giving it the
   next day number as its key.
   ============================================================ */

const DAILY_PUZZLES = {
  1: {
    gridSize: 9,
    start: { x: 4, y: 8 },
    paths: {
      marsh: {
        name: "The Marsh Route",
        tagline: "Short and quiet — fewer stops.",
        color: "#2F5D5A",
        destinationName: "The Boathouse",
        moves: [
          { clue: "Small paddle-powered boat, good for water too shallow for a motor.", answer: "CANOE", direction: "up", steps: 2 },
          { clue: "What the tide is called when it pulls back out to sea.", answer: "EBB", direction: "left", steps: 2 },
          { clue: "Wooden structure at the water's edge where boats are kept.", answer: "BOATHOUSE", direction: "up", steps: 4 },
        ],
      },
      shoreline: {
        name: "The Shoreline Route",
        tagline: "Longer, but you'll be in the open.",
        color: "#B4502A",
        destinationName: "The Lighthouse",
        moves: [
          { clue: "Spiral shellfish you might find washed up after a storm.", answer: "CONCH", direction: "up", steps: 1 },
          { clue: "Bird that dives headfirst into the water to catch fish.", answer: "PELICAN", direction: "right", steps: 3 },
          { clue: "Small wooden pier that juts out into the water.", answer: "DOCK", direction: "up", steps: 4 },
          { clue: "What sailors once read in the night sky to find their way home.", answer: "STARS", direction: "left", steps: 4 },
          { clue: "Tall structure that warns ships away from the rocks.", answer: "LIGHTHOUSE", direction: "up", steps: 1 },
        ],
      },
    },
  },

  2: {
    gridSize: 9,
    start: { x: 4, y: 8 },
    paths: {
      marsh: {
        name: "The Marsh Route",
        tagline: "Short and quiet — fewer stops.",
        color: "#2F5D5A",
        destinationName: "The Boathouse",
        moves: [
          { clue: "Long-legged bird that stands frozen, waiting to spear a fish.", answer: "HERON", direction: "left", steps: 2 },
          { clue: "Tall grass that lines the edge of brackish water.", answer: "REEDS", direction: "up", steps: 5 },
          { clue: "Wooden structure where boats are kept, out of the weather.", answer: "BOATHOUSE", direction: "right", steps: 1 },
        ],
      },
      shoreline: {
        name: "The Shoreline Route",
        tagline: "Longer, but you'll be in the open.",
        color: "#B4502A",
        destinationName: "The Lighthouse",
        moves: [
          { clue: "The ridge of loose sand piled up by wind at the back of a beach.", answer: "DUNE", direction: "right", steps: 2 },
          { clue: "Compass point where the sun rises over the water.", answer: "EAST", direction: "up", steps: 2 },
          { clue: "Small flatfish that buries itself in the sand.", answer: "FLOUNDER", direction: "left", steps: 1 },
          { clue: "A rope loop used to secure a boat to a piling.", answer: "HITCH", direction: "up", steps: 4 },
          { clue: "Structure that guides ships home at night.", answer: "LIGHTHOUSE", direction: "left", steps: 2 },
        ],
      },
    },
  },

  3: {
    gridSize: 9,
    start: { x: 4, y: 8 },
    paths: {
      marsh: {
        name: "The Marsh Route",
        tagline: "Short and quiet — fewer stops.",
        color: "#2F5D5A",
        destinationName: "The Boathouse",
        moves: [
          { clue: "Opposite of ebb — when the tide comes in.", answer: "FLOOD", direction: "up", steps: 3 },
          { clue: "Narrow channel of water cutting through the marsh.", answer: "CREEK", direction: "right", steps: 2 },
          { clue: "Wooden structure at the water's edge where boats are stored.", answer: "BOATHOUSE", direction: "up", steps: 3 },
        ],
      },
      shoreline: {
        name: "The Shoreline Route",
        tagline: "Longer, but you'll be in the open.",
        color: "#B4502A",
        destinationName: "The Lighthouse",
        moves: [
          { clue: "Sand-colored crab that scuttles sideways into its burrow.", answer: "GHOST CRAB", direction: "left", steps: 1 },
          { clue: "Anchored float that marks a channel or hazard.", answer: "BUOY", direction: "up", steps: 2 },
          { clue: "Net thrown by hand to catch bait fish.", answer: "CAST NET", direction: "right", steps: 4 },
          { clue: "Wide, flat board used to skim across the surface of the water.", answer: "SURFBOARD", direction: "up", steps: 4 },
          { clue: "Structure that guides ships home at night.", answer: "LIGHTHOUSE", direction: "left", steps: 3 },
        ],
      },
    },
  },
};

/* When Day 1 unlocks. Day N unlocks N-1 days after this date. */
const GAME_START_DATE = "2026-08-10"; // yyyy-mm-dd, edit to your launch day

function normalizeAnswer(str) {
  return (str || "").trim().toUpperCase().replace(/\s+/g, "");
}

/* Which day number "today" is, or null if the hunt hasn't started
   yet, or if we're past the last authored day. */
function currentDayNumber() {
  const start = new Date(GAME_START_DATE + "T00:00:00");
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const day = diffDays + 1;
  const maxDay = Object.keys(DAILY_PUZZLES).length;
  if (day < 1) return { status: "not-started", day: 1 };
  if (day > maxDay) return { status: "no-more-puzzles", day: maxDay };
  return { status: "ok", day };
}

function getPuzzle(day) {
  return DAILY_PUZZLES[day] || null;
}

function checkAnswer(day, pathId, moveIndex, guess) {
  const puzzle = getPuzzle(day);
  if (!puzzle) return false;
  const move = puzzle.paths[pathId].moves[moveIndex];
  if (!move) return false;
  return normalizeAnswer(guess) === normalizeAnswer(move.answer);
}

function positionAfterMoves(day, pathId, movesCompleted) {
  const puzzle = getPuzzle(day);
  const path = puzzle.paths[pathId];
  let pos = { ...puzzle.start };
  for (let i = 0; i < movesCompleted && i < path.moves.length; i++) {
    const mv = path.moves[i];
    if (mv.direction === "up") pos.y -= mv.steps;
    if (mv.direction === "down") pos.y += mv.steps;
    if (mv.direction === "left") pos.x -= mv.steps;
    if (mv.direction === "right") pos.x += mv.steps;
  }
  return pos;
}

/* Full route as an array of {x,y} points, for drawing the path line. */
function routePoints(day, pathId) {
  const puzzle = getPuzzle(day);
  const path = puzzle.paths[pathId];
  const pts = [{ ...puzzle.start }];
  for (let i = 1; i <= path.moves.length; i++) {
    pts.push(positionAfterMoves(day, pathId, i));
  }
  return pts;
}

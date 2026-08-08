# Tide Line — a daily route-choice scavenger hunt

A coastal-mystery scavenger hunt for a group of friends. Every day is a
fresh, standalone maze with two ways out — a short, quiet **Marsh Route**
and a longer **Shoreline Route**. Each player picks one route for the day
and has to solve every clue on it, in order, to get out. Miss a day and
that puzzle is gone — a brand new maze (and a new choice) is waiting
tomorrow.

It's a fully static site (works on GitHub Pages) with Firebase handling
anonymous sign-in and storing player progress.

## How it works

- `js/puzzles.js` defines `DAILY_PUZZLES` — one entry per day. Each day has
  its own small grid and two named routes, each an ordered list of moves
  (a clue, its answer, and a direction + distance).
- On the landing page, a player just gives their name. No route is chosen
  yet — that happens fresh each day on the game page.
- Each day (based on real calendar time from `GAME_START_DATE`), that
  day's puzzle unlocks. The player sees both routes as preview cards
  (clue count + destination) and picks one.
- Solving a clue moves their marker and reveals the next clue on that
  route. Reach the last clue and the day is marked complete.
- A player can switch to the other route before finishing — it resets
  their progress for the day and starts the new route from clue one.
- Once a day is marked complete, it's locked in — that puzzle won't
  reappear. If a player never finishes a day, it's simply gone once the
  next day unlocks; there's no catch-up. (If you'd rather let people
  finish old days late, see "Allowing catch-up" below.)
- The leaderboard ranks everyone by **total days completed** (not which
  route they took), with ties broken by whoever's most recent solve came
  first. It also shows which route each person picked today.

## 1. Set up Firebase (free tier is plenty)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and create a new project.
2. **Build > Authentication > Get started > Sign-in method** — enable
   **Anonymous**.
3. **Build > Firestore Database > Create database** — start in
   **production mode** (rules below lock it down).
4. **Project settings (gear icon) > General > Your apps > Web app (`</>`)**
   — register an app, and copy the `firebaseConfig` object it gives you.
5. Paste those values into `js/firebase-config.js` in this repo, replacing
   the placeholders.

### Firestore security rules

In **Firestore Database > Rules**, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{playerId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == playerId;
      allow update: if request.auth != null && request.auth.uid == playerId;
      allow delete: if false;
    }
  }
}
```

This lets anyone read the leaderboard, but a player can only create or
update their **own** document — no one can edit someone else's progress.

## 2. Customize the hunt

Edit `js/puzzles.js`:

- `GAME_START_DATE` — when Day 1 unlocks. Day N unlocks N-1 days later.
- Each day in `DAILY_PUZZLES` needs a `gridSize`, a `start` point, and two
  (or more — you're not limited to exactly two) entries under `paths`,
  each with a `name`, `tagline`, `color`, `destinationName`, and an
  ordered `moves` array of `{ clue, answer, direction, steps }`.
- Directions are `"up"`, `"down"`, `"left"`, or `"right"`; `steps` is how
  many grid cells that clue moves the player. Keep every route's running
  position within `0` to `gridSize - 1` on both axes — sketch it on paper
  first, or use the Node snippet below to check.
- Add more days by copying a whole day block and bumping its key (`4`,
  `5`, ...). There's no fixed limit.
- Answers are matched case-insensitively with spaces stripped, so
  multi-word answers like `"GHOST CRAB"` work fine either way it's typed.

To sanity-check a day's routes stay on the board before publishing:

```
node -e "
$(cat js/puzzles.js)
console.log(routePoints(4, 'marsh'));
console.log(routePoints(4, 'shoreline'));
"
```

### Allowing catch-up instead of "use it or lose it"

By default, only today's puzzle is playable. To let players finish a
missed day later instead, you'd change `render()` in `js/game.js` to look
at the earliest **unsolved** day up to today rather than always today's
day, and adjust `currentDayNumber()` in `js/puzzles.js` accordingly. This
is a bigger change to the day-selection logic — ask if you want a hand
with it.

## 3. Run it locally

No build step. Just serve the folder, e.g.:

```
npx serve .
```

or open `index.html` directly in a browser (Firestore/Auth need a real
`http://` origin to work reliably, so a local server is safer than
double-clicking the file).

## 4. Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo, go to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a
   branch," pick your default branch and `/ (root)`, and save.
4. GitHub will give you a URL like
   `https://your-username.github.io/your-repo/` — that's your game.
5. In Firebase, go to **Authentication > Settings > Authorized domains**
   and add your `github.io` domain, or anonymous sign-in will be blocked.

## File structure

```
index.html         Landing page — just name entry
game.html           Today's puzzle: route choice, board, clues
leaderboard.html    Live rankings
css/style.css        All styling
js/puzzles.js        Daily puzzles: routes, clues, answers, moves — edit this to build your hunt
js/firebase-config.js   Your Firebase project keys (fill this in)
js/auth.js           Anonymous sign-in + player doc helpers
js/board.js          SVG grid/route/marker renderer
js/game.js           Game page logic (choice -> clues -> solved)
js/signup.js         Landing page logic
js/leaderboard.js    Leaderboard page logic
```

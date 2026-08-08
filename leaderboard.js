/* ============================================================
   LEADERBOARD.JS — logic for leaderboard.html
   Ranked by total days completed (any route counts equally).
   Ties broken by whoever's most recent update came first.
   ============================================================ */

async function loadLeaderboard() {
  await waitForAuth();
  const tbody = document.getElementById("leaderboard-body");
  tbody.innerHTML = `<tr><td colspan="4" class="empty">Loading crew list…</td></tr>`;

  const totalDays = Object.keys(DAILY_PUZZLES).length;
  const today = currentDayNumber();
  const todayKey = today.status === "ok" ? String(today.day) : null;

  const snap = await db.collection("players").orderBy("totalCompleted", "desc").get();

  if (snap.empty) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">No hunters yet — be the first.</td></tr>`;
    return;
  }

  const rows = [];
  snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
  rows.sort((a, b) => {
    if (b.totalCompleted !== a.totalCompleted) return b.totalCompleted - a.totalCompleted;
    const at = a.updatedAt ? a.updatedAt.toMillis() : Infinity;
    const bt = b.updatedAt ? b.updatedAt.toMillis() : Infinity;
    return at - bt;
  });

  tbody.innerHTML = "";
  rows.forEach((p, i) => {
    const todaysEntry = todayKey && p.completedDays ? p.completedDays[todayKey] : null;
    const todaysPath = todaysEntry ? getPuzzle(today.day).paths[todaysEntry.path] : null;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="rank">${i + 1}</td>
      <td class="name">${escapeHtml(p.name)}</td>
      <td class="route" style="color:${todaysPath ? todaysPath.color : "inherit"}">${todaysPath ? todaysPath.name : "—"}</td>
      <td class="progress">${p.totalCompleted || 0} / ${totalDays}</td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", loadLeaderboard);

/* ============================================================
   BOARD.JS
   Renders one day's maze as an SVG: cell grid, the full dotted
   route for the player's chosen path, a flag at the exit, and
   a marker at their current position along it.
   ============================================================ */

function renderBoard(svgEl, day, pathId, movesCompleted) {
  const puzzle = getPuzzle(day);
  const path = puzzle.paths[pathId];
  const cell = 44; // px per grid cell
  const size = puzzle.gridSize * cell;
  svgEl.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svgEl.innerHTML = "";

  const points = routePoints(day, pathId);
  const current = positionAfterMoves(day, pathId, movesCompleted);
  const toPx = (p) => ({ x: p.x * cell + cell / 2, y: p.y * cell + cell / 2 });

  const ns = "http://www.w3.org/2000/svg";
  const make = (tag, attrs) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  // grid lines
  const grid = make("g", { class: "board-grid" });
  for (let i = 0; i <= puzzle.gridSize; i++) {
    grid.appendChild(make("line", { x1: i * cell, y1: 0, x2: i * cell, y2: size }));
    grid.appendChild(make("line", { x1: 0, y1: i * cell, x2: size, y2: i * cell }));
  }
  svgEl.appendChild(grid);

  // full route, dotted
  const pathStr = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toPx(p).x} ${toPx(p).y}`)
    .join(" ");
  svgEl.appendChild(
    make("path", { d: pathStr, class: "board-route", style: `stroke:${path.color}` })
  );

  // start marker
  const s = toPx(puzzle.start);
  svgEl.appendChild(make("circle", { cx: s.x, cy: s.y, r: 8, class: "board-start" }));
  const startLabel = make("text", { x: s.x, y: s.y + 24, class: "board-label" });
  startLabel.textContent = "START";
  svgEl.appendChild(startLabel);

  // destination marker (flag)
  const dest = toPx(points[points.length - 1]);
  const flagGroup = make("g", { class: "board-flag" });
  flagGroup.appendChild(make("line", { x1: dest.x, y1: dest.y - 16, x2: dest.x, y2: dest.y + 10 }));
  flagGroup.appendChild(
    make("polygon", { points: `${dest.x},${dest.y - 16} ${dest.x + 14},${dest.y - 10} ${dest.x},${dest.y - 4}` })
  );
  svgEl.appendChild(flagGroup);
  const destLabel = make("text", { x: dest.x, y: dest.y + 26, class: "board-label" });
  destLabel.textContent = path.destinationName;
  svgEl.appendChild(destLabel);

  // player marker at current position
  const c = toPx(current);
  const player = make("g", { class: "board-player", transform: `translate(${c.x},${c.y})` });
  player.appendChild(make("circle", { cx: 0, cy: 0, r: 11, style: `fill:${path.color}` }));
  player.appendChild(make("circle", { cx: 0, cy: 0, r: 15, class: "board-player-ring", style: `stroke:${path.color}` }));
  svgEl.appendChild(player);
}

/* Small route preview used on the path-choice cards. */
function drawMiniRoute(svgEl, day, pathId) {
  const points = routePoints(day, pathId);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 1;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svgEl.innerHTML = "";

  const ns = "http://www.w3.org/2000/svg";
  const toLocal = (p) => ({ x: p.x - minX + pad, y: p.y - minY + pad });
  const d = points
    .map((p, i) => {
      const lp = toLocal(p);
      return `${i === 0 ? "M" : "L"} ${lp.x} ${lp.y}`;
    })
    .join(" ");
  const pathEl = document.createElementNS(ns, "path");
  pathEl.setAttribute("d", d);
  pathEl.setAttribute("class", "mini-route");
  pathEl.setAttribute("style", `stroke:${getPuzzle(day).paths[pathId].color}`);
  svgEl.appendChild(pathEl);

  const dot = (pt, cls) => {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", pt.x);
    c.setAttribute("cy", pt.y);
    c.setAttribute("r", 0.35);
    c.setAttribute("class", cls);
    svgEl.appendChild(c);
  };
  dot(toLocal(points[0]), "mini-start");
  dot(toLocal(points[points.length - 1]), "mini-end");
}

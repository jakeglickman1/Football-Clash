const field = document.getElementById("field");
const playLayer = document.getElementById("play-layer");
const ballEl = document.getElementById("ball");
const offenseScoreEl = document.getElementById("offense-score");
const defenseScoreEl = document.getElementById("defense-score");
const downTextEl = document.getElementById("down-text");
const ballSpotEl = document.getElementById("ball-spot");
const messageEl = document.getElementById("play-message");
const powerFillEl = document.getElementById("power-fill");
const losMarkerEl = document.getElementById("los-marker");
const firstDownMarkerEl = document.getElementById("firstdown-marker");
const routeOverlay = document.getElementById("routes-overlay");
const opponentLabelEl = document.getElementById("opponent-name");
const seasonInfoEl = document.getElementById("season-info");
const awayEndzoneEl = document.getElementById("away-endzone");

const FIELD_PADDING = 35;
const RECEIVER_PRESETS = [
  { label: "WR1", role: "WR", lane: 0.24, breakLane: 0.15, depth: 220, finalLane: 0.12, finalDepth: 140, speed: 150, color: "#ff9c63" },
  { label: "WR2", role: "WR", lane: 0.38, breakLane: 0.5, depth: 250, finalLane: 0.52, finalDepth: 140, speed: 148, color: "#ffda63" },
  { label: "WR3", role: "WR", lane: 0.62, breakLane: 0.75, depth: 230, finalLane: 0.8, finalDepth: 130, speed: 146, color: "#ffa3d6" },
  { label: "TE", role: "TE", lane: 0.48, breakLane: 0.34, depth: 160, finalLane: 0.4, finalDepth: 80, speed: 143, color: "#fff5a1" },
  { label: "RB", role: "RB", lane: 0.7, breakLane: 0.82, depth: 90, finalLane: 0.88, finalDepth: 50, speed: 138, color: "#9de3ff" },
];
const DEFENDER_LANES = [0.22, 0.34, 0.52, 0.68, 0.82];
const OFFENSIVE_LINE_PRESETS = [
  { label: "LT", lane: 0.42 },
  { label: "LG", lane: 0.5 },
  { label: "RG", lane: 0.58 },
  { label: "RT", lane: 0.66 },
];
const DEFENSIVE_LINE_PRESETS = [
  { label: "DE1", lane: 0.4 },
  { label: "DT1", lane: 0.5 },
  { label: "DT2", lane: 0.6 },
  { label: "DE2", lane: 0.7 },
];
const TEAM_POOL = [
  { name: "Cyclones", difficulty: 1.0 },
  { name: "Gladiators", difficulty: 1.05 },
  { name: "Kodiaks", difficulty: 0.95 },
  { name: "Volt", difficulty: 1.1 },
  { name: "Phantoms", difficulty: 1.08 },
  { name: "Outlaws", difficulty: 1.02 },
  { name: "Lynx", difficulty: 0.92 },
  { name: "Comets", difficulty: 1.12 },
  { name: "Sharks", difficulty: 1.04 },
  { name: "Guardians", difficulty: 0.98 },
];
const PLAYOFF_ROUNDS = ["Semifinal", "Championship"];
const GAME_RULES = {
  regularWeeks: 8,
  drivesPerGame: 6,
  targetScore: 35,
};
const ROUTE_PREVIEW_DURATION = 2000;

let fieldSize = getFieldSize();

const THROW_MIN_SPEED = 200;
const THROW_MAX_SPEED = 420;
const THROW_CHARGE_TIME = 1.2;

const state = {
  offenseScore: 0,
  defenseScore: 0,
  drive: 1,
  down: 1,
  ballOn: 20,
  nextFirstDown: 30,
  lineOfScrimmage: 20,
  playClock: 0,
  playActive: false,
  keyState: new Set(),
  lastTime: performance.now(),
  players: {
    qb: null,
    receivers: [],
    defenders: [],
    offensiveLine: [],
    defensiveLine: [],
  },
  controlledPlayer: null,
  ball: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    z: 0,
    vz: 0,
    gravity: -900,
    flightDuration: 0,
    inFlight: false,
    flightTime: 0,
    carrier: null,
    targetPoint: null,
  },
  chargingThrow: false,
  throwCharge: 0,
  pointer: {
    x: 0,
    y: 0,
    inside: false,
  },
  routePreviewVisible: false,
  routePreviewTimeout: null,
  franchise: null,
};

function getFieldSize() {
  const rect = field.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function yardsToX(yards) {
  const playableWidth = fieldSize.width - FIELD_PADDING * 2;
  return FIELD_PADDING + (yards / 100) * playableWidth;
}

function xToYards(x) {
  const playableWidth = fieldSize.width - FIELD_PADDING * 2;
  return clamp(((x - FIELD_PADDING) / playableWidth) * 100, 0, 100);
}

function createPlayer(label, team, role) {
  const el = document.createElement("div");
  el.className = `player ${team} ${role}`;
  el.textContent = label;
  playLayer.appendChild(el);
  return {
    label,
    team,
    role,
    x: 0,
    y: 0,
    speed: 200,
    baseSpeed: 200,
    element: el,
    routePhase: 0,
    breakPoint: null,
    goPoint: null,
    assignment: null,
  };
}

function createPlayers() {
  state.players.qb = createPlayer("QB", "offense", "qb");
  state.players.qb.speed = 140;
  state.players.qb.baseSpeed = 140;
  state.players.receivers = RECEIVER_PRESETS.map((preset) => {
    const receiver = createPlayer(preset.label, "offense", "receiver");
    receiver.speed = preset.speed;
    receiver.baseSpeed = preset.speed;
    receiver.preset = preset;
    receiver.routeColor = preset.color;
    return receiver;
  });
  state.players.defenders = DEFENDER_LANES.map((lane, index) => {
    const defender = createPlayer(`DB${index + 1}`, "defense", "defender");
    defender.speed = 125 + index * 8;
    defender.baseSpeed = defender.speed;
    defender.lane = lane;
    defender.assignmentIndex = index;
    return defender;
  });
  state.players.offensiveLine = OFFENSIVE_LINE_PRESETS.map((preset) => {
    const blocker = createPlayer(preset.label, "offense", "lineman");
    blocker.speed = 115;
    blocker.baseSpeed = blocker.speed;
    blocker.anchor = { lane: preset.lane };
    return blocker;
  });
  state.players.defensiveLine = DEFENSIVE_LINE_PRESETS.map((preset, index) => {
    const rusher = createPlayer(preset.label, "defense", "lineman");
    rusher.speed = 130 + index * 5;
    rusher.baseSpeed = rusher.speed;
    rusher.anchor = { lane: preset.lane };
    return rusher;
  });
}

function generateSchedule(weeks, seasonNumber = 1) {
  const schedule = [];
  const pool = [...TEAM_POOL];
  for (let i = 0; i < weeks; i += 1) {
    if (pool.length === 0) {
      pool.push(...TEAM_POOL);
    }
    const index = Math.floor(Math.random() * pool.length);
    const team = pool.splice(index, 1)[0];
    const difficultyBoost = 0.05 * Math.min(seasonNumber - 1, 4) + 0.02 * i;
    schedule.push({
      name: team.name,
      difficulty: Math.max(0.85, team.difficulty + difficultyBoost),
    });
  }
  return schedule;
}

function generatePlayoffOpponents(seasonNumber = 1) {
  return PLAYOFF_ROUNDS.map((round, index) => {
    const team = TEAM_POOL[(index + seasonNumber) % TEAM_POOL.length];
    const difficulty = team.difficulty + 0.1 * (index + 1) + 0.06 * seasonNumber;
    return {
      name: `${team.name} ${round === "Championship" ? "Elite" : ""}`.trim(),
      difficulty: Math.min(1.4, difficulty),
    };
  });
}

function applyOpponentDifficulty(opponent) {
  const multiplier = opponent ? Math.min(1.4, Math.max(0.8, opponent.difficulty)) : 1;
  state.players.defenders.forEach((player) => {
    player.speed = player.baseSpeed * multiplier;
  });
  state.players.defensiveLine.forEach((player) => {
    player.speed = player.baseSpeed * multiplier;
  });
}

function updateOpponentBranding() {
  const opponentName = state.franchise?.opponent?.name || "CPU";
  if (opponentLabelEl) {
    opponentLabelEl.textContent = opponentName;
  }
  if (awayEndzoneEl) {
    awayEndzoneEl.textContent = opponentName.toUpperCase();
  }
}

function updateSeasonHud() {
  if (!seasonInfoEl) {
    return;
  }
  const franchise = state.franchise;
  if (!franchise) {
    seasonInfoEl.textContent = "Season setup...";
    return;
  }
  let stageLabel = "";
  if (franchise.stage === "regular") {
    stageLabel = `Week ${Math.min(franchise.week, franchise.regularWeeks)}/${franchise.regularWeeks}`;
  } else if (franchise.stage === "playoffs") {
    stageLabel = `Playoffs · ${PLAYOFF_ROUNDS[franchise.playoffRound] || "Final"}`;
  } else {
    stageLabel = "Exhibition";
  }
  const opponentName = franchise.opponent ? `vs ${franchise.opponent.name}` : "";
  const recordText = `Record ${franchise.record.wins}-${franchise.record.losses}`;
  const trophyText = franchise.trophies > 0 ? ` · Rings ${franchise.trophies}` : "";
  seasonInfoEl.textContent = `Season ${franchise.season} · ${stageLabel} · ${opponentName} · ${recordText}${trophyText}`;
}

function pickNextOpponent() {
  const franchise = state.franchise;
  if (!franchise) {
    return;
  }
  let opponent = null;
  if (franchise.stage === "regular") {
    opponent = franchise.schedule[Math.min(franchise.week - 1, franchise.schedule.length - 1)];
  } else if (franchise.stage === "playoffs") {
    const fallbackIndex = Math.max(franchise.playoffOpponents.length - 1, 0);
    opponent = franchise.playoffOpponents[franchise.playoffRound] || franchise.playoffOpponents[fallbackIndex];
  }
  if (!opponent) {
    opponent = { name: "CPU", difficulty: 1 };
  }
  franchise.opponent = opponent;
  applyOpponentDifficulty(opponent);
  updateOpponentBranding();
  updateSeasonHud();
}

function resetInGameState() {
  state.playActive = false;
  state.ball.inFlight = false;
  state.ball.carrier = null;
  hideRoutePreview();
  state.offenseScore = 0;
  state.defenseScore = 0;
  state.drive = 1;
  state.down = 1;
  state.ballOn = 20;
  state.lineOfScrimmage = 20;
  state.nextFirstDown = 30;
  updateHud();
}

function prepareMatch() {
  resetInGameState();
  startPlay();
}

function setupFormation() {
  const lineX = yardsToX(state.ballOn);
  const qb = state.players.qb;
  qb.x = lineX - 60;
  qb.y = fieldSize.height / 2;
  qb.speed = 140;

  state.players.receivers.forEach((receiver) => {
    const preset = receiver.preset;
    const startY = fieldSize.height * preset.lane;
    const startX = lineX - 20;
    receiver.x = startX;
    receiver.y = startY;
    receiver.routePhase = 0;
    receiver.breakPoint = {
      x: clamp(lineX + preset.depth, FIELD_PADDING + 30, fieldSize.width - FIELD_PADDING - 70),
      y: fieldSize.height * preset.breakLane,
    };
    receiver.goPoint = {
      x: clamp(
        (lineX + preset.depth) + (preset.finalDepth || 100),
        FIELD_PADDING + 50,
        fieldSize.width - FIELD_PADDING - 20
      ),
      y: fieldSize.height * (preset.finalLane ?? preset.breakLane),
    };
    receiver.routePath = [
      { x: startX, y: startY },
      { ...receiver.breakPoint },
      { ...receiver.goPoint },
    ];
  });

  state.players.defenders.forEach((defender, index) => {
    const assignment = state.players.receivers[index] || null;
    defender.assignment = assignment;
    if (assignment) {
      defender.x = clamp(lineX + 30 + index * 10, FIELD_PADDING + 40, fieldSize.width - FIELD_PADDING - 60);
      defender.y = assignment.y - 18;
    } else {
      defender.x = clamp(lineX + 120 + index * 30, FIELD_PADDING + 40, fieldSize.width - FIELD_PADDING - 40);
      defender.y = fieldSize.height * defender.lane;
    }
  });
  state.players.offensiveLine.forEach((blocker, index) => {
    blocker.x = lineX - 25;
    blocker.y = fieldSize.height * blocker.anchor.lane;
    blocker.assignment = state.players.defensiveLine[index] || null;
  });
  state.players.defensiveLine.forEach((rusher) => {
    rusher.x = lineX + 25;
    rusher.y = fieldSize.height * rusher.anchor.lane;
    rusher.assignment = null;
  });

  state.ball.carrier = qb;
  state.ball.inFlight = false;
  state.ball.targetPoint = null;
  state.ball.flightTime = 0;
  state.ball.flightDuration = 0;
  state.playClock = 0;
  state.controlledPlayer = qb;
  state.chargingThrow = false;
  state.throwCharge = 0;
  updatePowerMeter(0);
  state.pointer.x = qb.x;
  state.pointer.y = qb.y;
  state.pointer.inside = true;
  showRoutePreview();
}

function formatDown(down) {
  switch (down) {
    case 1:
      return "1st";
    case 2:
      return "2nd";
    case 3:
      return "3rd";
    default:
      return "4th";
  }
}

function updateHud() {
  offenseScoreEl.textContent = state.offenseScore;
  defenseScoreEl.textContent = state.defenseScore;
  const yardsToGo = Math.max(1, Math.round(state.nextFirstDown - state.ballOn));
  downTextEl.textContent = `${formatDown(state.down)} & ${yardsToGo}`;
  ballSpotEl.textContent = `Ball On: ${Math.round(state.ballOn)}`;
  updateMarkers();
  updateSeasonHud();
}

function updateMarkers() {
  if (!losMarkerEl || !firstDownMarkerEl) {
    return;
  }
  const losX = yardsToX(state.lineOfScrimmage);
  const firstX = yardsToX(Math.min(100, state.nextFirstDown));
  losMarkerEl.style.left = `${losX}px`;
  firstDownMarkerEl.style.left = `${firstX}px`;
}

function setMessage(text) {
  messageEl.textContent = text;
}

function updatePowerMeter(ratio) {
  if (!powerFillEl) {
    return;
  }
  const clampedRatio = clamp(ratio, 0, 1);
  powerFillEl.style.width = `${(clampedRatio * 100).toFixed(1)}%`;
}

function renderRoutePreview() {
  if (!routeOverlay) {
    return;
  }
  routeOverlay.innerHTML = "";
  routeOverlay.setAttribute("viewBox", `0 0 ${fieldSize.width} ${fieldSize.height}`);
  routeOverlay.setAttribute("width", "100%");
  routeOverlay.setAttribute("height", "100%");
  state.players.receivers.forEach((receiver) => {
    if (!receiver.routePath) {
      return;
    }
    const path = receiver.routePath.map((point) => `${point.x},${point.y}`).join(" ");
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", path);
    polyline.setAttribute("class", "route-line");
    if (receiver.routeColor) {
      polyline.style.stroke = receiver.routeColor;
    }
    routeOverlay.appendChild(polyline);
  });
}

function showRoutePreview() {
  if (!routeOverlay) {
    return;
  }
  renderRoutePreview();
  routeOverlay.classList.add("visible");
  state.routePreviewVisible = true;
  if (state.routePreviewTimeout) {
    clearTimeout(state.routePreviewTimeout);
  }
  state.routePreviewTimeout = setTimeout(() => {
    hideRoutePreview();
  }, ROUTE_PREVIEW_DURATION);
}

function hideRoutePreview() {
  if (!routeOverlay || !state.routePreviewVisible) {
    return;
  }
  routeOverlay.classList.remove("visible");
  routeOverlay.innerHTML = "";
  state.routePreviewVisible = false;
  if (state.routePreviewTimeout) {
    clearTimeout(state.routePreviewTimeout);
    state.routePreviewTimeout = null;
  }
}

function updatePointerFromEvent(event) {
  const rect = field.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  state.pointer.x = clamp(localX, FIELD_PADDING, fieldSize.width - FIELD_PADDING);
  state.pointer.y = clamp(localY, FIELD_PADDING, fieldSize.height - FIELD_PADDING);
  state.pointer.inside = true;
}

function handleFieldPointerMove(event) {
  updatePointerFromEvent(event);
}

function handleFieldPointerDown(event) {
  if (event.button !== 0) {
    return;
  }
  event.preventDefault();
  updatePointerFromEvent(event);
  startChargingThrow();
}

function handleFieldPointerLeave() {
  state.pointer.inside = false;
}

function handleGlobalPointerUp(event) {
  if (event.button !== 0) {
    return;
  }
  releaseThrow();
}

function startPlay() {
  setupFormation();
  state.playActive = true;
  setMessage(`Drive ${state.drive} · ${formatDown(state.down)} & ${Math.max(1, Math.round(state.nextFirstDown - state.ballOn))}`);
  updateHud();
}

function resetGame() {
  resetFranchiseProgress();
}

function beginSeason(seasonNumber, trophies) {
  state.franchise = {
    season: seasonNumber,
    week: 1,
    regularWeeks: GAME_RULES.regularWeeks,
    stage: "regular",
    record: { wins: 0, losses: 0 },
    playoffRound: 0,
    trophies,
    schedule: generateSchedule(GAME_RULES.regularWeeks, seasonNumber),
    playoffOpponents: [],
    opponent: null,
  };
  pickNextOpponent();
  prepareMatch();
}

function advanceSeason() {
  const previous = state.franchise;
  const trophies = previous ? previous.trophies : 0;
  const nextSeason = previous ? previous.season + 1 : 1;
  beginSeason(nextSeason, trophies);
}

function resetFranchiseProgress() {
  beginSeason(1, 0);
}

function canStartThrow() {
  return (
    state.playActive &&
    !state.ball.inFlight &&
    state.ball.carrier === state.players.qb &&
    !state.chargingThrow
  );
}

function startChargingThrow() {
  if (!canStartThrow()) {
    return;
  }
  state.chargingThrow = true;
  state.throwCharge = 0;
  updatePowerMeter(0);
  setMessage("Charging throw... release the click to fire.");
}

function releaseThrow() {
  if (!state.chargingThrow) {
    return;
  }
  const charge = clamp(state.throwCharge, 0, 1);
  state.chargingThrow = false;
  updatePowerMeter(0);
  attemptPass(charge);
}

function attemptPass(powerRatio = 0.5) {
  if (
    !state.playActive ||
    state.ball.inFlight ||
    state.ball.carrier !== state.players.qb
  ) {
    return;
  }
  hideRoutePreview();
  const normalizedPower = clamp(powerRatio, 0, 1);
  const passTarget = {
    x: clamp(state.pointer.x, FIELD_PADDING, fieldSize.width - FIELD_PADDING),
    y: clamp(state.pointer.y, FIELD_PADDING, fieldSize.height - FIELD_PADDING),
  };
  state.ball.targetPoint = passTarget;
  state.ball.inFlight = true;
  state.ball.flightTime = 0;
  state.ball.carrier = null;
  const dx = passTarget.x - state.players.qb.x;
  const dy = passTarget.y - state.players.qb.y;
  const horizontalDistance = Math.hypot(dx, dy) || 1;
  const baseHorizontalSpeed =
    THROW_MIN_SPEED + (THROW_MAX_SPEED - THROW_MIN_SPEED) * normalizedPower;
  const duration = clamp(horizontalDistance / baseHorizontalSpeed, 0.85, 1.45);
  state.ball.flightDuration = duration;
  state.ball.z = 10;
  state.ball.vx = dx / duration;
  state.ball.vy = dy / duration;
  state.ball.vz = -(state.ball.z + 0.5 * state.ball.gravity * duration * duration) / duration;
  setMessage(`Ball in the air · Power ${Math.round(normalizedPower * 100)}%`);
}

function movePlayer(player, dx, dy) {
  player.x = clamp(player.x + dx, FIELD_PADDING, fieldSize.width - FIELD_PADDING);
  player.y = clamp(player.y + dy, FIELD_PADDING, fieldSize.height - FIELD_PADDING);
}

function handleUserMovement(dt) {
  const controlled = state.controlledPlayer;
  if (!controlled) {
    return;
  }
  const horizontal = (state.keyState.has("ArrowRight") ? 1 : 0) -
    (state.keyState.has("ArrowLeft") ? 1 : 0);
  const vertical = (state.keyState.has("ArrowDown") ? 1 : 0) -
    (state.keyState.has("ArrowUp") ? 1 : 0);
  if (horizontal === 0 && vertical === 0) {
    return;
  }
  if (state.routePreviewVisible) {
    hideRoutePreview();
  }
  const sprintMultiplier = state.keyState.has("Shift") ? 1.25 : 1;
  const magnitude = Math.hypot(horizontal, vertical) || 1;
  const speed = controlled.speed * sprintMultiplier * dt;
  movePlayer(
    controlled,
    (horizontal / magnitude) * speed,
    (vertical / magnitude) * speed
  );
}

function moveToward(player, targetX, targetY, speed, dt) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) {
    return;
  }
  movePlayer(player, (dx / distance) * speed * dt, (dy / distance) * speed * dt);
}

function updateReceivers(dt) {
  state.players.receivers.forEach((receiver) => {
    if (state.ball.carrier === receiver) {
      return;
    }
    const target = receiver.routePhase === 0 ? receiver.breakPoint : receiver.goPoint;
    moveToward(receiver, target.x, target.y, receiver.speed, dt);
    const distance = Math.hypot(receiver.x - target.x, receiver.y - target.y);
    if (distance < 6 && receiver.routePhase === 0) {
      receiver.routePhase = 1;
    }
  });
}

function updateTrenchBattles(dt) {
  const qb = state.players.qb;
  state.players.offensiveLine.forEach((blocker) => {
    const targetX = qb.x - 20;
    const targetY = fieldSize.height * blocker.anchor.lane;
    moveToward(blocker, targetX, targetY, 85, dt);
  });
  state.players.defensiveLine.forEach((rusher) => {
    const targetX = qb.x - 4;
    const targetY = fieldSize.height * rusher.anchor.lane;
    moveToward(rusher, targetX, targetY, 120, dt);
  });
  state.players.offensiveLine.forEach((blocker, index) => {
    const rusher = state.players.defensiveLine[index];
    if (!rusher) {
      return;
    }
    const dx = rusher.x - blocker.x;
    const dy = rusher.y - blocker.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 26) {
      const pushX = dx / (distance || 1);
      const pushY = dy / (distance || 1);
      const pushForce = 110 * dt;
      blocker.x -= pushX * pushForce * 0.6;
      blocker.y -= pushY * pushForce * 0.6;
      rusher.x += pushX * pushForce * 0.8;
      rusher.y += pushY * pushForce * 0.8;
    }
  });
}

function updateDefenders(dt) {
  state.players.defenders.forEach((defender) => {
    let targetX = defender.x;
    let targetY = defender.y;
    if (state.ball.carrier) {
      targetX = state.ball.carrier.x;
      targetY = state.ball.carrier.y;
    } else if (defender.assignment) {
      const assigned = defender.assignment;
      const leadPoint = assigned.routePhase === 0 ? assigned.breakPoint : assigned.goPoint;
      const mix = assigned.routePhase === 0 ? 0.35 : 0.2;
      const cushion = 14;
      targetX = assigned.x * (1 - mix) + leadPoint.x * mix - cushion;
      targetY = assigned.y * (1 - mix) + leadPoint.y * mix;
    }
    moveToward(defender, targetX, targetY, defender.speed, dt);
  });
}

function updateBall(dt) {
  if (state.ball.carrier) {
    state.ball.x = state.ball.carrier.x;
    state.ball.y = state.ball.carrier.y - 6;
    state.ball.z = 0;
    state.ball.vz = 0;
    return;
  }
  if (!state.ball.inFlight) {
    state.ball.x = state.players.qb.x;
    state.ball.y = state.players.qb.y - 6;
    state.ball.z = 0;
    state.ball.vz = 0;
    return;
  }
  state.ball.flightTime += dt;
  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;
  state.ball.z += state.ball.vz * dt;
  state.ball.vz += state.ball.gravity * dt;
  if (state.ball.z < 0) {
    state.ball.z = 0;
    state.ball.vz = 0;
  }
  attemptOffensiveCatch();
  if (!state.ball.inFlight) {
    return;
  }
  if (state.ball.targetPoint) {
    const distanceToPoint = Math.hypot(
      state.ball.targetPoint.x - state.ball.x,
      state.ball.targetPoint.y - state.ball.y
    );
    if (distanceToPoint < 8) {
      endPlay("incomplete", state.lineOfScrimmage);
      return;
    }
  }
  if (state.ball.z === 0 && state.ball.flightTime > state.ball.flightDuration) {
    endPlay("incomplete", state.lineOfScrimmage);
    return;
  }
  if (
    state.ball.flightTime > 1.8 ||
    state.ball.x <= FIELD_PADDING ||
    state.ball.x >= fieldSize.width - FIELD_PADDING
  ) {
    endPlay("incomplete", state.lineOfScrimmage);
  }
}

function attemptOffensiveCatch() {
  if (!state.ball.inFlight) {
    return;
  }
  const effectiveRadius = state.ball.z > 10 ? 45 : 18;
  const planeDistance = (player) => Math.hypot(player.x - state.ball.x, player.y - state.ball.y);

  const eligible = state.players.receivers.slice().sort((a, b) => {
    const aDist = planeDistance(a);
    const bDist = planeDistance(b);
    const aLead = Math.hypot(
      state.ball.targetPoint ? state.ball.targetPoint.x - a.x : 0,
      state.ball.targetPoint ? state.ball.targetPoint.y - a.y : 0
    );
    const bLead = Math.hypot(
      state.ball.targetPoint ? state.ball.targetPoint.x - b.x : 0,
      state.ball.targetPoint ? state.ball.targetPoint.y - b.y : 0
    );
    return aLead - bLead || aDist - bDist;
  });

  for (const receiver of eligible) {
    if (planeDistance(receiver) < effectiveRadius) {
      completePass(receiver);
      return;
    }
  }

  const qb = state.players.qb;
  if (
    !state.ball.carrier &&
    state.ball.flightTime > 0.25 &&
    planeDistance(qb) < effectiveRadius * 0.7
  ) {
    state.ball.carrier = qb;
    state.ball.inFlight = false;
    state.ball.targetPoint = null;
    state.controlledPlayer = qb;
    setMessage("QB caught his own pass!");
  }
}

function completePass(receiver) {
  state.ball.carrier = receiver;
  state.ball.inFlight = false;
  state.ball.targetPoint = null;
  state.ball.z = 0;
  state.ball.vz = 0;
  state.controlledPlayer = receiver;
  setMessage(`${receiver.label} hauls it in!`);
}

function handleCollisions() {
  if (!state.ball.carrier) {
    return;
  }
  const carrier = state.ball.carrier;
  const tacklers = [
    ...state.players.defenders,
    ...state.players.defensiveLine,
  ];
  for (const defender of tacklers) {
    const distance = Math.hypot(defender.x - carrier.x, defender.y - carrier.y);
    if (distance < 20) {
      const yardLine = xToYards(carrier.x);
      endPlay("tackle", yardLine);
      return;
    }
  }
}

function handleInterceptions() {
  if (!state.ball.inFlight) {
    return;
  }
  if (state.ball.z > 8) {
    return;
  }
  const defenders = [
    ...state.players.defenders,
    ...state.players.defensiveLine,
  ];
  for (const defender of defenders) {
    const distance = Math.hypot(defender.x - state.ball.x, defender.y - state.ball.y);
    if (distance < 18) {
      state.ball.inFlight = false;
      state.ball.carrier = null;
      setMessage("Picked off!");
      endPlay("turnover", xToYards(defender.x));
      return;
    }
  }
}

function checkForTouchdown() {
  if (!state.ball.carrier) {
    return;
  }
  const yardLine = xToYards(state.ball.carrier.x);
  if (yardLine >= 100) {
    endPlay("touchdown", 100);
  }
}

function endPlay(outcome, yardLine) {
  state.playActive = false;
  state.ball.inFlight = false;
  state.ball.targetPoint = null;
  state.controlledPlayer = state.players.qb;
  state.chargingThrow = false;
  state.throwCharge = 0;
  updatePowerMeter(0);
  hideRoutePreview();
  const yard = clamp(yardLine, 0, 100);

  if (outcome === "touchdown") {
    state.offenseScore += 7;
    state.drive += 1;
    state.ballOn = 20;
    state.lineOfScrimmage = 20;
    state.nextFirstDown = 30;
    state.down = 1;
    setMessage("Touchdown! Lining up for the next drive.");
    updateHud();
    if (maybeFinishGame()) {
      return;
    }
    setTimeout(startPlay, 1400);
    return;
  }

  if (outcome === "turnover") {
    state.defenseScore += 7;
    state.drive += 1;
    state.ballOn = 20;
    state.lineOfScrimmage = 20;
    state.nextFirstDown = 30;
    state.down = 1;
    setMessage("Turnover! Defense cashes in.");
    updateHud();
    if (maybeFinishGame()) {
      return;
    }
    setTimeout(startPlay, 1400);
    return;
  }

  if (outcome === "incomplete") {
    state.down += 1;
    if (state.down > 4) {
      turnoverOnDowns();
      return;
    }
    setMessage("Incomplete. Back to the huddle.");
    updateHud();
    setTimeout(startPlay, 900);
    return;
  }

  state.ballOn = yard;
  if (state.ballOn >= state.nextFirstDown) {
    state.lineOfScrimmage = state.ballOn;
    state.nextFirstDown = Math.min(100, state.ballOn + 10);
    state.down = 1;
    setMessage("Move the chains! First down.");
  } else {
    state.lineOfScrimmage = state.ballOn;
    state.down += 1;
    if (state.down > 4) {
      turnoverOnDowns();
      return;
    }
    setMessage("Wrapped up. Get ready for the next snap.");
  }
  updateHud();
  setTimeout(startPlay, 900);
}

function turnoverOnDowns() {
  state.defenseScore += 3;
  state.drive += 1;
  state.ballOn = 20;
  state.lineOfScrimmage = 20;
  state.nextFirstDown = 30;
  state.down = 1;
  setMessage("Turnover on downs. Resetting at the 20.");
  updateHud();
  if (maybeFinishGame()) {
    return;
  }
  setTimeout(startPlay, 1200);
}

function maybeFinishGame() {
  const franchise = state.franchise;
  if (!franchise) {
    return false;
  }
  const drivesLimitReached = state.drive > GAME_RULES.drivesPerGame;
  const mercyRule =
    state.offenseScore >= GAME_RULES.targetScore ||
    state.defenseScore >= GAME_RULES.targetScore;
  if (!drivesLimitReached && !mercyRule) {
    return false;
  }
  const playerWon = state.offenseScore >= state.defenseScore;
  finalizeMatch(playerWon);
  return true;
}

function finalizeMatch(playerWon) {
  state.playActive = false;
  state.ball.inFlight = false;
  hideRoutePreview();
  const franchise = state.franchise;
  const opponentName = franchise?.opponent?.name || "CPU";
  let summary = playerWon
    ? `You beat the ${opponentName}!`
    : `Fell to the ${opponentName}.`;

  if (!franchise) {
    setMessage(summary);
    setTimeout(() => prepareMatch(), 2000);
    return;
  }

  if (franchise.stage === "regular") {
    if (playerWon) {
      franchise.record.wins += 1;
    } else {
      franchise.record.losses += 1;
    }
    franchise.week += 1;
    const seasonComplete = franchise.week > franchise.regularWeeks;
    if (seasonComplete) {
      const winsNeeded = Math.ceil(franchise.regularWeeks / 2);
      if (franchise.record.wins >= winsNeeded) {
        franchise.stage = "playoffs";
        franchise.playoffRound = 0;
        franchise.playoffOpponents = generatePlayoffOpponents(franchise.season);
        summary += " Playoffs bound!";
        pickNextOpponent();
        setMessage(summary);
        setTimeout(() => prepareMatch(), 2200);
        return;
      }
      summary += " Season over. Restarting for a new year.";
      setMessage(summary);
      setTimeout(() => advanceSeason(), 2400);
      return;
    }
    pickNextOpponent();
    setMessage(summary);
    setTimeout(() => prepareMatch(), 1800);
    return;
  }

  if (franchise.stage === "playoffs") {
    if (playerWon) {
      franchise.playoffRound += 1;
      if (franchise.playoffRound >= PLAYOFF_ROUNDS.length) {
        franchise.trophies += 1;
        summary += " Champions!";
        setMessage(summary);
        setTimeout(() => advanceSeason(), 2500);
        return;
      }
      summary += ` Advancing to the ${PLAYOFF_ROUNDS[franchise.playoffRound]}.`;
      pickNextOpponent();
      setMessage(summary);
      setTimeout(() => prepareMatch(), 2000);
      return;
    }
    summary += " Playoff run ends here.";
    setMessage(summary);
    setTimeout(() => advanceSeason(), 2400);
  }
}

function renderPlayers() {
  const allPlayers = [
    state.players.qb,
    ...state.players.receivers,
    ...state.players.defenders,
    ...state.players.offensiveLine,
    ...state.players.defensiveLine,
  ];
  allPlayers.forEach((player) => {
    player.element.style.left = `${player.x}px`;
    player.element.style.top = `${player.y}px`;
  });
  ballEl.style.left = `${state.ball.x}px`;
  ballEl.style.top = `${state.ball.y - state.ball.z}px`;
}

function handleKeyDown(event) {
  const key = event.key;
  const lower = key.toLowerCase();
  const handled = [
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "shift",
    "r",
  ];
  if (handled.includes(lower)) {
    event.preventDefault();
  }
  if (key.startsWith("Arrow")) {
    state.keyState.add(key);
  } else if (key === "Shift") {
    state.keyState.add("Shift");
  } else if (lower === "r") {
    resetGame();
  }
}

function handleKeyUp(event) {
  if (event.key.startsWith("Arrow") && state.keyState.has(event.key)) {
    state.keyState.delete(event.key);
  }
  if (event.key === "Shift" && state.keyState.has("Shift")) {
    state.keyState.delete("Shift");
  }
}

function resizeField() {
  const previous = { ...fieldSize };
  fieldSize = getFieldSize();
  if (previous.width === 0) {
    return;
  }
  const scaleX = (fieldSize.width - FIELD_PADDING * 2) / (previous.width - FIELD_PADDING * 2);
  const scaleY = fieldSize.height / previous.height;
  const scalePlayer = (player) => {
    const yards = xToYards(player.x);
    player.x = yardsToX(yards);
    player.y *= scaleY;
  };
  const everyone = [
    state.players.qb,
    ...state.players.receivers,
    ...state.players.defenders,
    ...state.players.offensiveLine,
    ...state.players.defensiveLine,
  ];
  everyone.forEach(scalePlayer);
  state.players.receivers.forEach((receiver) => {
    if (receiver.routePath) {
      receiver.routePath = receiver.routePath.map((point) => ({
        x: yardsToX(xToYards(point.x)),
        y: point.y * scaleY,
      }));
    }
  });
  state.ball.x = yardsToX(xToYards(state.ball.x));
  state.ball.y *= scaleY;
  updateMarkers();
  if (state.controlledPlayer) {
    state.pointer.x = state.controlledPlayer.x;
    state.pointer.y = state.controlledPlayer.y;
  } else {
    state.pointer.x = yardsToX(state.ballOn);
    state.pointer.y = fieldSize.height / 2;
  }
  state.pointer.inside = true;
  if (state.routePreviewVisible) {
    renderRoutePreview();
  }
}

function update(dt) {
  if (state.chargingThrow) {
    state.throwCharge = clamp(
      state.throwCharge + dt / THROW_CHARGE_TIME,
      0,
      1
    );
    updatePowerMeter(state.throwCharge);
  }
  if (state.playActive) {
    state.playClock += dt;
    handleUserMovement(dt);
    updateReceivers(dt);
    updateTrenchBattles(dt);
    updateDefenders(dt);
    updateBall(dt);
    handleInterceptions();
    handleCollisions();
    checkForTouchdown();
  } else if (!state.ball.carrier) {
    state.ball.x = yardsToX(state.ballOn);
    state.ball.y = fieldSize.height / 2;
  }
}

function loop(timestamp) {
  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
  state.lastTime = timestamp;
  update(dt);
  renderPlayers();
  requestAnimationFrame(loop);
}

function init() {
  createPlayers();
  resetFranchiseProgress();
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  field.addEventListener("pointermove", handleFieldPointerMove);
  field.addEventListener("pointerdown", handleFieldPointerDown);
  field.addEventListener("pointerleave", handleFieldPointerLeave);
  window.addEventListener("pointerup", handleGlobalPointerUp);
  window.addEventListener("resize", () => {
    resizeField();
    updateHud();
  });
  requestAnimationFrame(loop);
}

init();

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

const FIELD_PADDING = 35;
const RECEIVER_PRESETS = [
  { label: "WR1", role: "WR", lane: 0.24, breakLane: 0.15, depth: 220, finalLane: 0.12, finalDepth: 140, speed: 150, color: "#ff9c63" },
  { label: "WR2", role: "WR", lane: 0.38, breakLane: 0.5, depth: 250, finalLane: 0.52, finalDepth: 140, speed: 148, color: "#ffda63" },
  { label: "WR3", role: "WR", lane: 0.62, breakLane: 0.75, depth: 230, finalLane: 0.8, finalDepth: 130, speed: 146, color: "#ffa3d6" },
  { label: "TE", role: "TE", lane: 0.48, breakLane: 0.34, depth: 160, finalLane: 0.4, finalDepth: 80, speed: 143, color: "#fff5a1" },
  { label: "RB", role: "RB", lane: 0.7, breakLane: 0.82, depth: 90, finalLane: 0.88, finalDepth: 50, speed: 138, color: "#9de3ff" },
];
const DEFENDER_LANES = [0.22, 0.34, 0.52, 0.68, 0.82];
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
  },
  controlledPlayer: null,
  ball: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
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
  state.players.receivers = RECEIVER_PRESETS.map((preset) => {
    const receiver = createPlayer(preset.label, "offense", "receiver");
    receiver.speed = preset.speed;
    receiver.preset = preset;
    receiver.routeColor = preset.color;
    return receiver;
  });
  state.players.defenders = DEFENDER_LANES.map((lane, index) => {
    const defender = createPlayer(`DB${index + 1}`, "defense", "defender");
    defender.speed = 125 + index * 8;
    defender.lane = lane;
    defender.assignmentIndex = index;
    return defender;
  });
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

  state.ball.carrier = qb;
  state.ball.inFlight = false;
  state.ball.targetPoint = null;
  state.ball.flightTime = 0;
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
  state.offenseScore = 0;
  state.defenseScore = 0;
  state.drive = 1;
  state.down = 1;
  state.ballOn = 20;
  state.lineOfScrimmage = 20;
  state.nextFirstDown = 30;
  setMessage("New season! Click and hold to launch a throw.");
  startPlay();
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
  const distance = Math.hypot(dx, dy) || 1;
  const speed =
    THROW_MIN_SPEED + (THROW_MAX_SPEED - THROW_MIN_SPEED) * normalizedPower;
  state.ball.vx = (dx / distance) * speed;
  state.ball.vy = (dy / distance) * speed;
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

function updateDefenders(dt) {
  state.players.defenders.forEach((defender) => {
    let targetX = defender.x;
    let targetY = defender.y;
    if (state.ball.carrier) {
      targetX = state.ball.carrier.x;
      targetY = state.ball.carrier.y;
    } else if (state.ball.inFlight) {
      targetX = state.ball.x;
      targetY = state.ball.y;
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
    return;
  }
  if (!state.ball.inFlight) {
    state.ball.x = state.players.qb.x;
    state.ball.y = state.players.qb.y - 6;
    return;
  }
  state.ball.flightTime += dt;
  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;
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
  for (const receiver of state.players.receivers) {
    const distance = Math.hypot(receiver.x - state.ball.x, receiver.y - state.ball.y);
    if (distance < 16) {
      completePass(receiver);
      return;
    }
  }
  const qb = state.players.qb;
  if (
    !state.ball.carrier &&
    state.ball.flightTime > 0.18 &&
    Math.hypot(qb.x - state.ball.x, qb.y - state.ball.y) < 16
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
  state.controlledPlayer = receiver;
  setMessage(`${receiver.label} hauls it in!`);
}

function handleCollisions() {
  if (!state.ball.carrier) {
    return;
  }
  const carrier = state.ball.carrier;
  for (const defender of state.players.defenders) {
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
  for (const defender of state.players.defenders) {
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
  setTimeout(startPlay, 1200);
}

function renderPlayers() {
  const allPlayers = [
    state.players.qb,
    ...state.players.receivers,
    ...state.players.defenders,
  ];
  allPlayers.forEach((player) => {
    player.element.style.left = `${player.x}px`;
    player.element.style.top = `${player.y}px`;
  });
  ballEl.style.left = `${state.ball.x}px`;
  ballEl.style.top = `${state.ball.y}px`;
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
  setupFormation();
  updateHud();
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
  startPlay();
  requestAnimationFrame(loop);
}

init();

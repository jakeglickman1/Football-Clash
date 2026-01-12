# Slide 1 · Aurora Arcade
- Presenter: Jake Glickman  
- Immersive neon casino sandbox built with vanilla JS/CSS  
- Focus: shared bankroll gameplay, cinematic tables, responsive UX  

_Speaker cue_: Open with one-sentence pitch and why you built it (interactive prototype to explore casino-style mechanics safely).

---

# Slide 2 · Experience Goals
- **Cohesive world**: single bankroll + stats across casino, arcade, and skill lounges
- **Immersive feel**: holographic tables, slot cabinet, crash launchpad
- **Approachable demo**: fictional credits, AI hosts, playful narration

_Speaker cue_: Mention how these pillars guided design decisions and the most fun part (custom CSS components, game math, etc.).

---

# Slide 3 · Architecture Snapshot
- Three HTML surfaces share **bankroll** + **stats** modules
- Each page uses a dedicated JS controller (`app.js`, `online.js`, `skill-games.js`)
- UI utilities handle status toasts, history log, nav behavior

```
app.js
 online.js
 skill-games.js
 core/
   bankroll.js   ← credit persistence + syncing
   stats.js      ← new session tracker
   ui.js         ← reusable UI helpers
```

_Speaker cue_: Walk through request/response lifecycle—button click → game logic → bankroll/stat update → history.

---

# Slide 4 · Shared Bankroll (app.js:100-150)
```js
const bankroll = createBankroll({
  startingCredits: 1000,
  onChange: (balance, { tone, isInitial } = {}) => {
    credits = balance;
    creditsDisplay.textContent = balance.toLocaleString();
    if (!isInitial && tone) flashIndicator(creditsDisplay, tone);
  },
  onSync: ({ balance }) => {
    showToast(`Bankroll synced at ${balance.toLocaleString()} credits`, { tone: 'neutral' });
  },
});

function applyStake(amount) {
  if (amount > credits) return false;
  credits -= amount;
  bankroll.setBalance(credits);
  flashIndicator(creditsDisplay, 'negative');
  return true;
}
```

_Speaker cue_: Explain how this lets you hop between pages without losing state and how localStorage sync avoids backend work.

---

# Slide 5 · Stats Tracker (core/stats.js:44-120)
```js
export function createStatsTracker() {
  let state = readFromStorage() ?? { ...DEFAULT_STATS };
  const listeners = new Set();

  const record = ({ game, net = 0 } = {}) => {
    if (!Number.isFinite(net) || net === 0) return getSnapshot();
    state.rounds += 1;
    state.lastGame = game;
    state.updatedAt = Date.now();
    if (net > 0) {
      state.wins += 1;
      state.totalWon += net;
      state.biggestWin = Math.max(state.biggestWin, net);
      state.currentStreak = state.currentStreak >= 0 ? state.currentStreak + 1 : 1;
    } else {
      state.losses += 1;
      state.totalLost += Math.abs(net);
      state.currentStreak = state.currentStreak <= 0 ? state.currentStreak - 1 : -1;
    }
    return emit();
  };
```

_Speaker cue_: Highlight the publish/subscribe pattern and how the stats bar auto-updates on every game result.

---

# Slide 6 · Visual Immersion Highlights
- Lucky Spin slot cabinet: topper, glare layer, animated lever (`styles.css:4025-4146`)
- Roulette + craps tables: dashed felt lines, signage, depth shadows
- Crash game: starfield + runway grid to make multiplier climb feel cinematic

_Speaker cue_: Show before/after screenshots or short screen recording of the reels and crash sky animating.

---

# Slide 7 · Accessibility & UX Details
- ARIA roles + status regions (`data-status`) keep screen readers updated
- Reduced-motion check to disable heavy animations when requested
- Responsive layout: player stats bar collapses, nav drawer toggles, cards stay legible on tablets

_Speaker cue_: Mention how these touches make the prototype usable beyond just the demo machine.

---

# Slide 8 · Demo Plan
1. **Setup**: set alias, highlight shared credits & stats bar
2. **Lucky Spin**: run one spin, point out log + stat update
3. **Crash**: swap to arcade page, place bet, cash out early to show same credits
4. **Stats recap**: call out win rate/biggest win shifting live

_Speaker cue_: Keep a tab with both pages preloaded; have a “demo mode” stake ready in case RNG is cruel.

---

# Slide 9 · Lessons Learned
- Managing complex UI without frameworks is doable with tight modules
- Reusable core utilities (bankroll, stats, UI) keep each game lean
- Visual polish often requires as much time as core logic—plan for it

_Speaker cue_: Tie each lesson to a concrete moment (e.g., refactoring history log, designing slot cabinet).

---

# Slide 10 · Roadmap & Ask
- Multiplayer spectators & AI commentary
- Cloud persistence + leaderboards
- Sound design + tactile feedback

**Call to action**: feedback on favorite games, ideas for risk management mechanics, or contributors interested in expanding the sandbox.

_Speaker cue_: End with invite for questions and mention repo link / QR code._

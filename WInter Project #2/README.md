# Retrobowl Sandlot

![Retrobowl Sandlot Logo](assets/logo.svg)

Retrobowl Sandlot is a fast, arcade-football prototype that blends classic sandlot vibes with a light franchise loop. You command a single offensive possession, sling mouse-aimed passes with an arcing power meter, and grind through a multi-week schedule that culminates in a two-round playoff chase. The experience is intentionally compact yet polished, focusing on crisp controls, readable UI, and dynamic receiver routes that feel alive from snap to whistle.

## Core Features

- **Mouse-aimed Throwing** – Hold the mouse button to build power, release to zip a pass to any point on the field. The ball travels with both horizontal and vertical velocity so defenders can’t auto-block every throw.
- **Receiver Route Visuals** – The moment the play loads, SVG routes fade in to preview every WR, TE, and RB assignment so reads are easy before the snap.
- **Animated Trenches** – Offensive and defensive linemen battle in front of the QB, creating a living pocket that influences the timing of each play.
- **Assignment-Based Defense** – CPU defenders key on their designated receiver instead of blindly chasing the ball, making man coverage more authentic.
- **First-Down + LOS Markers** – Persistent HUD elements render the line of scrimmage and the current sticks so you always know the down-and-distance situation.
- **Franchise Season Loop** – Play through eight regular-season weeks that scale in difficulty, then face bespoke playoff matchups; trophy rings accumulate with every title run.

![Gameplay preview showing the horizontal field, player icons, and color-coded routes](assets/gameplay-preview.svg)

## Controls

| Action | Input |
| --- | --- |
| Move QB / ball carrier | Arrow Keys |
| Sprint | `Shift` |
| Throw | Click + hold to charge, release to fire toward the cursor |
| Reset season | `R` |

> Note: When a receiver secures the catch, you automatically take control of that player, allowing you to keep running upfield without extra input.

## Season & Progression

- **Schedule Generation** – Each season pulls opponents from a curated pool, factoring the current year and week into a difficulty multiplier for better pacing.
- **Playoffs** – Finish the regular season with a winning record to unlock Semifinal and Championship showdowns; win it all to earn a trophy and progress to the next season.
- **Dynamic Branding** – HUD elements (opponent label, away end zone) update per game so the presentation reflects the current matchup.

## Project Structure

```
index.html   # HUD markup, field layout, static assets
style.css    # Stadium aesthetic, player markers, responsive layout
script.js    # Game state, input, AI, season logic, rendering loop
README.md    # Project documentation
README.html  # Standalone documentation page
```

## Local Development

1. Clone or download the project.
2. Open `index.html` in any modern browser (Chrome, Edge, Safari).
3. Play immediately—no build step is required because the prototype is plain HTML/CSS/JS.

### Helpful Scripts

There are no tooling scripts in this prototype. If you want live reload, serve the root directory with any static server (`python -m http.server`, `npx serve`, etc.).

## Deployment Notes

- The project is GitHub Pages-friendly. Deploy the root or the `main` branch via Pages, and the game runs as-is.
- For documentation, `README.html` mirrors this file in a browser-friendly format so visitors can read the overview directly on Pages.
- To publish the documentation page specifically, push `README.html` to the branch that Pages is configured to serve (for example, `main`) and enable Pages under **Settings → Pages** so GitHub hosts the rendered HTML.

## GitHub Pages Deployment for `README.html`

- A workflow (`.github/workflows/deploy-readme.yml`) now copies `README.html` plus the `assets/` directory into a small `public/` artifact and deploys it to GitHub Pages whenever `main` is updated (you can also trigger it manually via “Run workflow”).
- After the workflow runs successfully for the first time, open **Settings → Pages** and set the **Source** to “GitHub Actions.” GitHub will display the live link (something like `https://<user>.github.io/<repo>/`) in both the workflow summary and that settings page.
- The deployed page renders exactly like `README.html` locally, so you can share the Pages URL for anyone to load the documentation in their browser.

## Roadmap Ideas

1. Add defensive play variety (zones, blitz packages) to mix up reads.
2. Layer in offensive play-calling with multiple formations and motion.
3. Persist season stats (QB yards, TDs, completion rate) between sessions.
4. Add touch controls for mobile browsers.

---

Have fun slinging passes, racking up rings, and keeping the sandlot dynasty alive!

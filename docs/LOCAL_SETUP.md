# Brady's Games: setting up your computer for the pro graphics pass

This guide gets your computer ready so Claude agents running **on your machine** can use **Blender** (and later, if you choose, **Unreal Engine**) to take your three games (*Brady Goes to Burning Man*, *Super Brady-O World* and *Art Cart*) to a professional level.

Why it has to be your computer: the cloud session that built the game runs in a remote container. It can't open apps on your computer, so Blender and Unreal have to be driven by Claude running locally.

---

## What you need
- **A Mac** (strongly recommended). Any computer works for Blender and the web game, but building an Unreal game for iPhone requires a Mac with Xcode.
- **Blender 3.0 or newer.** You've installed it.
- **Unreal Engine 5.** You've installed it. It's only needed for the optional native-app path (Phase 4 in the handoff doc).
- **Git** and **Node.js 18+**: https://nodejs.org
- **Python 3.10+** and **uv**, needed by the Blender connector. Install uv with: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Claude Code**, installed and signed in. Follow the official install steps at https://code.claude.com/docs.

## Step 1: Get the project
In a terminal:
```bash
git clone https://github.com/bradymott/brady-o.git
cd brady-o
```
To check the game builds:
```bash
node tools/build.js
```
Then open `dist/site/index.html` in a browser (the launcher page with the three games).

For the automated tests (optional, but the agents use them):
```bash
npm install playwright
npx playwright install chromium
```

## Step 2: Connect Blender to Claude (Blender MCP)
This uses the open-source **blender-mcp** project (github.com/ahujasid/blender-mcp). It has two parts: a Blender add-on, and a small server that Claude Code talks to.

1. Download `addon.py` from the blender-mcp GitHub repository.
2. In Blender: **Edit → Preferences → Add-ons → Install…**, pick `addon.py`, then tick **"Interface: Blender MCP"**.
3. In Blender's 3D viewport, press **N** to open the sidebar, open the **BlenderMCP** tab, and click its button to start/connect the server.
4. In a terminal **inside the brady-o folder**, register it with Claude Code:
   ```bash
   claude mcp add blender uvx blender-mcp
   ```
   Don't run the `uvx` command yourself; Claude Code starts it.
5. Start `claude` in that folder. You should see the Blender tools available (for example, ask "what Blender tools do you have?").

**Notes**
- **Back up your work.** The connector lets Claude run Python inside Blender, so it can change or delete things in an open scene.
- **Usage data.** It collects anonymous usage data by default. Turn this off in its Blender preferences, or set the `DISABLE_TELEMETRY` environment variable.

## Step 3 (optional, native path only): Connect Unreal Engine
Only do this if you decide to rebuild Brady Goes to Burning Man as a native app (Phase 4 in the handoff doc).

Every Unreal connector today is **third-party and unofficial**, so back up any project first. Two options:
- **The "Unreal Engine MCP" plugin in Claude's plugin marketplace.** In the Unreal Editor, enable the **ModelContextProtocol** and **AllToolsets** plugins. Start the server from Unreal's console with `ModelContextProtocol.StartServer`, then add the plugin in Claude Code.
- **The `unrealmcp` package (PyPI).** A C++ editor plugin plus a Python MCP server. Register it in the project's `.mcp.json`.

Check each project's supported Unreal version before installing.

## Step 4 (optional): Let the cloud Claude session use your computer
If you want a cloud session (like the one that built the game) to be able to work in a folder on your computer, turn on **Remote Control**:
- **Claude desktop app:** Settings → Claude Code → Remote Control, then add the `brady-o` folder.
- **Or, in a terminal inside the folder:**
  ```bash
  claude remote-control
  ```

The session then shows up in the Claude Code app. Simplest of all: just run Claude locally (Step 5).

## Step 5: Start the relay
In a terminal in the `brady-o` folder, run `claude` and say:

> Read docs/HANDOFF_LOCAL_AGENTS.md. Do Phase 0, then propose your Phase 1 plan and agent lanes for my approval.

The handoff doc tells the local agent everything about the project:
- the story, the cast and the rules;
- how to build, test and deploy;
- the step-by-step plan for professional graphics, including how to split the work across several agents.

## Where things live
- **The games (live):** https://bradymott.github.io/brady-o/ (a launcher page plus the three apps), served from the `gh-pages` branch.
- **Source:** the `main` branch. Work in progress goes on feature branches.
- **Design bible:** `docs/design/`, holding the story and worlds, the cast (your action figures) and the archetypes.
- **3D engine guide:** `docs/BURNS_GUIDE.md`. Big art: `docs/BURNS_BIGART.md`. Camps: `docs/BURNS_CAMPS.md`. Adding a country to Super Brady-O World: `docs/WORLD_TOUR_GUIDE.md`.

# RIVEN — jousting duel game, plan (v3)

Logo: `assets/brand/riven-logo.jpg` (with name), `assets/brand/riven-emblem.jpg` (emblem only). Repository: https://github.com/theraimzhanov/riven

## Context

A realistic online jousting game organised like chess.com: challenge anyone, ranked rating, tournaments. Every knight is equal — no stats to buy. Money only from looks.

The first prototype (4 plans, 3 final moves) was deleted at your request; the project folder is empty again. This plan replaces it with your deeper design: wear that carries across passes, tactical skills, five live controls, five impact moves, no replays.

Your design is kept as you wrote it. Where it had a gap or two parts contradicted each other, I made a call — all listed under **My adjustments** so you can reject any of them.

## Order of work (v3)

Three phases, in the order you set. Each ends with something you can check.

### Phase A — Access

| Service | Used for | Status today |
|---|---|---|
| **GitHub** | Code repository, history, backups | Connected and signed in. Ready. |
| **Supabase** | Accounts, database, live channels, server functions | Ready. Project **RIVEN** (`hgtodegbjjmxiytnpwcv`, us-east-1) is created and healthy. |
| **Cloudflare** | Website hosting (Pages) and the heavy 3D files (R2: 10 GB free, no charge for downloads) | Account needed. Not required until the site is published or 3D files exist. |

Done so far: the GitHub repository and the Supabase project exist, and login works.

What you do, when you want the site public:
1. Create a free Cloudflare account.
2. In the dashboard: Workers & Pages → Create → Pages → Connect to Git, pick `theraimzhanov/riven`, build command `npm run build`, output folder `dist`. Every push to `master` then publishes the site.
3. Turn on R2. It asks for a payment card even on the free tier.

For uploading 3D files I use Cloudflare's command-line tool after you sign in to it once on this PC. I never type passwords or keys.

**Done when:** the site opens from its Cloudflare Pages address, and a test file uploaded to R2 opens from a public link.

### Phase B — Study chess.com and adapt it

We study how the platform is organised and copy the *structure*, never its name, code, art or text.

What I map, from public pages and the public chess.com data API (and lichess, whose design is open to read):
- **Getting into a game:** home screen, "play" button, format picker, matchmaking wait, challenge link, rematch.
- **During a game:** screen layout, clocks, player cards, resign/draw offers, disconnect and abandon rules.
- **After a game:** result card, rating change, next-game buttons.
- **Identity:** profile, stats per format, rating history graph, titles and leagues, friends, clubs.
- **Competition:** leaderboards, tournament types (knockout, arena, swiss), registration, lobby, bracket, tie-breaks, prizes.
- **Staying:** daily goals, puzzles and lessons (for us: training drills against bots), notifications, spectating top games.
- **Trust:** fair-play rules, reporting, penalties for leaving.
- **Money:** what is free, what is paid (for us: cosmetics only).

Pages behind a login I can only see if you sign in to chess.com in the browser pane.

What comes out:
- `docs/platform-map.md` — every feature marked **keep / adapt / skip**, with what it becomes in RIVEN (move list → pass list, time control → format, puzzle → drill).
- Screen list and navigation map for RIVEN.
- Final database tables and server functions.
- A clickable grey-box version of the whole site with fake data: lobby, play, match screen (empty 3D area), result card, profile, leaderboard, tournament lobby and bracket.

**Done when:** you can click through every screen of the platform and say "yes, this is the structure".

### Phase C — Build the realistic arena, 1v1, then tournaments

1. **Look test:** one knight, one horse, one hit, one ragdoll fall in the real arena. Needs the horse pack and concept art from you. We continue only when it looks dangerous and real.
2. **Rules engine and tests** (no art needed, runs alongside step 1).
3. **Full 1v1 against bots** with every plan, skill and impact move animated.
4. **Online 1v1:** challenge link, then accounts, Glicko-2 rating, matchmaking, result card, leaderboard — wired into the Phase B screens.
5. **Tournaments:** knockout for 8 and 16, lobby, bracket, trophy.
6. **Heraldry and armour editor.**
7. **Trailer and landing page.**

**Done when:** two people in different places play a rated match that looks real, and an 8-player tournament runs to a winner.

## How the game works

### Match and carry-over wear
- Formats: **Blitz** 3 passes, **Classic** 5, **Grand** 7. Most points wins; tie → sudden-death pass.
- **Unhorse** wins instantly.
- **Carries between passes:** horse stamina, shield integrity, rider poise, daze.

### Scoring a pass
| Lance lands on | Points | Effect |
|---|---|---|
| Miss | 0 | Wasted stamina |
| Shield, glancing | 1 | Minimal shield wear |
| Shield, solid | 1 | Cracks shield; 2 solid hits break it for the match |
| Chest | 2 | Drains target's poise |
| Helm | 3 | Dazes target (slower aim next pass) |
| Unhorse | Win | Match over |
| Horse or barrier | −2 foul | Second foul forfeits |

Breaking your lance on a clean hit: **+1 bonus**. Both knights can score in one pass.

### Phase 1 — Plan (10 s, secret)
Pick one **Riding Plan** and optionally one **Tactical Skill**.

| Riding Plan | Gives | Costs |
|---|---|---|
| **Full Charge** | Top speed, hardest hit | Heavy sway, −35% stamina |
| **Steady Canter** | Tightest aim | Average force, predictable timing |
| **Braced Seat** | +50% poise | Slow, weak |
| **Feint Approach** | Lance raised until 2 s before impact | Tiny aim window |
| **Tempo Change** | Slow start, late burst — breaks opponent's impact timing | −30% stamina, wide sway in burst |

| Tactical Skill | Uses | Effect |
|---|---|---|
| **Couch Late** | 1/match | Lance up until 1.5 s left, then 0.8 s of zero sway |
| **Slant Guard** | 2/match | Non-perfect strikes glance for 0 points and 0 force; helm fully exposed |
| **Spur Burst** | 1/match | Instant top speed halfway down |
| **Drop Visor Late** | Any pass | Visor up: wider view, steadier aim. Must tap to drop it before impact, or any helm hit unhorses you |
| **Second Wind** | 1/match | No spurring this pass; +25% stamina, poise reset |

### Phase 2 — Charge (about 6 s, live)
- **Spur and stride rhythm** — tap on the gallop beat for speed. Off-beat mashing makes the horse stumble (aim jolts up).
- **Rein line** — *tight* to the barrier (+15% force, risk of barrier foul) or *wide* (harder to hit your chest, weaker hit).
- **Lance aim** — tip onto helm, chest or shield. Held on target over 3 s, the arm tires and the tip dips.
- **Shield** — High (helm) or Mid (chest).
- **Lean** — In (+20% force, −20% poise) or Away (forces glancing hits, worse own aim).

### Phase 3 — Impact (400 ms window, one move)
- **Drive** — +25% force, easier lance break. Mistimed → tip slips wide.
- **Lock Stirrups** — +40% poise, no bonus force.
- **Slip / Duck** — dodges a helm strike; a chest strike becomes a helm hit with bonus force.
- **Swivel Deflect** — solid hit becomes a 0-force glance; your own lance scores nothing.
- **Release Lance** — you score 0, incoming force −35%.

### Result formula (deterministic, same for everyone)
- **Hit zone** = lance tip vs. target hitbox, shifted by rein line, shield, lean, duck.
- **Force** = combined speed × centring × lean/drive modifiers − deflection.
- **Shield** loses integrity on solid hits; at zero it no longer blocks.
- **Unhorse** when force > target's current poise (base 100; changed by Braced, Lock Stirrups, stamina, daze, lean).

### Platform
- Account and profile (name, rating, record, heraldry).
- Play now by format and rating; challenge by link, rated or friendly.
- **Glicko-2** rating per format. Leagues: Squire → Knight → Baron → Earl → Champion.
- Knockout tournaments for 8 or 16; trophy on profile.
- Leaderboard per format.
- **No replays.** One database row per match with a compact summary (scores, plans picked, how it ended).
- Practice against computer knights with personalities: Headhunter, Turtle, Feinter. They also fill empty queues.

## My adjustments (reject any you disagree with)

1. **"Match state in memory" is not possible on Supabase.** Its server functions forget everything between calls. Instead the live state (stamina, shield, poise, skill uses) sits in the match's own row and is overwritten each pass; at the end it is replaced by the summary. Still one row per match, no growth.
2. **Lance break is a threshold, not a "chance".** You asked for a deterministic formula, so the lance breaks when force passes a set value; Drive lowers that value.
3. **"Angled" shield removed from the charge.** It did the same job as the Slant Guard skill. Shield during the charge is High or Mid; angling is the skill.
4. **Tactical skill can be "none".** Otherwise a Grand match runs out of legal picks.
5. **Barrier foul rule defined:** riding tight, a lance tip that lands low on the inner side hits the barrier.
6. **Daze lasts one pass**, the next one.
7. **Anti-cheat is honest about its limit.** The server can reject impossible inputs (reused skill, stamina it didn't have, speed above the plan's cap, timing outside the window, identical timing every pass). It cannot catch a bot that fakes human-looking jitter. No browser game can without heavier tools.
8. **Keyboard and mouse first.** Seven things to control in 6 seconds does not fit a phone screen yet; a touch layout is its own later step.
9. **All balance numbers live in one file** so tuning never touches the formula.

## How we build it

### The goal for the look
The value of this game is how it looks and feels. A pass must feel dangerous: a heavy horse at full gallop, dust, armour that reflects the sky, a lance that splinters, and a rider who really falls — differently every time — while the crowd reacts. Block models are not acceptable. This is the longest part of the project and most of it is **art, not code**.

### Tech stack

**Game engine (in the browser)**
| Need | Tool | Why |
|---|---|---|
| 3D engine | **Babylon.js** (TypeScript) | Realistic materials, animation blending, physics and a debug inspector are built in. Less to wire by hand than Three.js. It is code-first, so I can build all of it; Unity/Unreal need a person clicking in an editor and make slow, heavy web builds. |
| Graphics | **WebGPU**, automatic fallback to WebGL2 | Best quality where the device supports it, still runs elsewhere. |
| Physics | **Havok** (ships with Babylon, free) | Ragdoll falls, lance splinters, shield pieces. |
| Build | **Vite + TypeScript**, **Vitest** for tests | Standard, fast. |

**What makes it look real**
- **Lighting:** real sky photos (HDRI) lighting the scene, soft shadows, ambient occlusion, bloom, film tone mapping, motion blur at full gallop.
- **Materials:** PBR — scratched steel, leather, cloth, horse coat with sheen.
- **The fall:** an *active ragdoll*. The rider is animated until the hit, then physics takes over with the real force and direction from the result formula. No two falls look the same. The rider can hang in a stirrup, roll, or be thrown clear.
- **The horse:** authored animation clips (walk, canter, gallop, rear, stumble, shy away, slow down) blended by speed, plus code-driven layers: breathing, ear and head movement, nostril flare, muscle jiggle, foam and sweat at low stamina, hooves throwing dirt.
- **Lance and shield:** pre-fractured models that break apart with physics on a strong hit.
- **Particles:** dust, turf, splinters, sparks on steel, breath in cold air.
- **Cloth:** horse caparison and banners moving in wind.
- **Camera:** shake on impact, short slow-motion on a helm hit or unhorse, a replay angle of the fall shown to both players.
- **Crowd:** thousands of cheap animated figures in the stands that rise and roar on a big hit.
- **Sound:** 3D audio — hoof rhythm (also the gameplay beat), armour clatter, lance crack, horse snort and scream, crowd.

**Art pipeline (where the models and animations come from)**
| Asset | Recommended source | Notes |
|---|---|---|
| **Horse** — model, skeleton, animations | **Buy a professional rigged horse pack** | The single most important asset. AI tools cannot yet make a believable animated horse. Budget roughly $50–200. Check the licence allows use in a web game. |
| **Knight body animations** (riding, couching lance, bracing, ducking) | **Mixamo** (free) as a base + **Cascadeur** (physics-aware animation tool with AI help) to make the jousting-specific moves | Or film yourself and use video-to-animation (**Move.ai**, **Rokoko Vision**, **DeepMotion**). |
| **Armour, helms, shields, lances, tents, stands, barrier** | **Meshy**, **Tripo** or **Rodin** (AI text/image → 3D model with textures) | Good for hard props. Each model needs clean-up. |
| **Clean-up, fitting armour to the skeleton, export** | **Blender** (free) | The hub every asset passes through. A community Blender MCP exists that lets me drive Blender on your PC; you would have to install it. |
| **Ground, wood, metal, cloth textures and skies** | **Poly Haven**, **ambientCG** (free, CC0) | |
| **Sound effects, crowd, horse** | **Sonniss GDC bundles**, **Freesound** (free) + **ElevenLabs** sound effects for gaps | |
| **Compression** | glTF format, **Meshopt** for geometry, **KTX2** for textures | Keeps first load small — target under 40 MB. |

**Where Higgsfield fits — and where it does not**
Higgsfield makes AI **video and images**. It cannot make the in-game horse, knight or animations, because a game needs real 3D models that move in response to the player, not a video. Use it for:
- **Concept art** — decide the look of armour, arena and horse before any model is made; those images then feed the image-to-3D tools.
- **Trailer and ads** — cinematic jousting clips for the landing page and social media.
- **Intro and tournament-final cinematics**, loading-screen and profile art.

No Higgsfield, Meshy or Blender connector is in this app's connector list today, so you would run those tools yourself or add them manually; I work with the files they produce.

**Online and platform**
| Need | Tool |
|---|---|
| Accounts, database, server functions | **Supabase** |
| Live opponent movement | **Supabase Realtime** broadcast, about 20 updates a second, smoothed on screen. Nothing saved. |
| Who won the pass | Server runs the formula (unchanged). Each player's screen plays the fall with physics from the same force and direction, so both see the same outcome; the exact tumble can differ slightly. |
| Website hosting | **Cloudflare Pages** |
| Model and texture hosting | **Cloudflare R2** |
| Later | **Stripe** for cosmetics, **Sentry** for error reports |

**Who does what**
- **Me:** all code — rules, engine, shaders, physics, ragdoll, camera, particles, sound wiring, netcode, backend, UI; converting and compressing assets; fixing what the art tools produce where it can be done in code.
- **You (or a hired 3D artist/animator):** choosing and buying the horse pack, generating and approving concept art and models, Blender clean-up, the jousting-specific animations. If you have no 3D experience, hiring a freelancer for the knight-on-horse animations is the fastest way to real quality.

**Code layout:**
- `src/rules/tuning.ts` — every number (speeds, sway, poise, thresholds, skill limits).
- `src/rules/resolvePass.ts` — the formula: plans, skills, impact moves, zones, force, shield, poise, unhorse.
- `src/rules/match.ts` — carry-over state, score, fouls, sudden death, winner.
- `src/rules/validateInputs.ts` — rejects impossible or illegal inputs.
- `src/rules/bots.ts` — Headhunter, Turtle, Feinter.
- `src/rules/*.test.ts` — tests.
- `src/game/` — arena, knights, controls, HUD (stamina, poise, shield), sound cues.
- `src/net/` — live match channel: plan lock-in, position stream, impact packet.
- `src/ui/` — lobby, profile, post-match card, leaderboard, bracket, heraldry.
- `supabase/functions/resolve-pass/`, `supabase/functions/matchmake/`.
- `supabase/migrations/` — `profiles`, `matches`, `queue`, `tournaments`, `tournament_players`, with rules so players can read but never write results.

- `src/game/` splits into `render/` (lighting, materials, effects), `anim/` (horse and rider blending, procedural layers), `physics/` (ragdoll, breakables), `camera/`, `audio/`.
- `assets/` — source models; `tools/` — scripts that compress them for the web.

**Order:** see "Order of work (v3)" at the top.

**Honest timeline:** the rules and platform are weeks. The realistic look is months, and its speed depends on how fast good assets arrive, not on coding.

## Verification
- `npm test`: every scoring row; each skill's limit and effect; each impact move's counter; shield breaking on the second solid hit; stamina, poise and daze carrying across passes; fouls; sudden death. A sweep over all 5 plans × 6 skill picks × 5 impact moves checks no combination produces a broken result.
- `validateInputs` tests: reused 1/match skill, over-cap speed, out-of-window timing — all rejected.
- Look test: you watch one pass and one fall in the browser and say whether it feels real; frame rate stays at 60 on your PC; first load under 40 MB.
- Browser: a Classic match against each bot through to the win screen; watch stamina, shield and daze carry over.
- Online: two windows, one linked match; both see the same score; a faked result sent from the console is refused.
- After 10 matches the `matches` table has exactly 10 rows.
- An 8-player bracket played to a winner; trophy and ratings update.

## Risks
- **Too much at once for new players.** Five plans, five skills, five live controls, five impact moves. The practice bots must teach it in stages or people will leave in the first match.
- **Balance.** Three ways to take zero damage (Slant Guard, Swivel Deflect, Release Lance) could make defence dominant. Only playtesting in step 2 will show it.
- **Art is the bottleneck.** Without a good horse pack and jousting animations the game cannot look real, whatever the code does. AI 3D tools are good for props, weak for animated animals.
- **Browser limits.** Realistic graphics run well on a PC with a decent graphics card; phones and old laptops need a lower-quality mode and will look plainer.
- **Download size.** Realistic assets are heavy; first load must stay small or people leave before playing.
- **Empty lobby** at launch; bots cover it.

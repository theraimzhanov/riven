# Recon map: chess.com (web) → adapted for RIVEN

Scope: the competitive platform around a 1v1 game — getting into a game, the game screen, the result, identity and rating, leaderboards, tournaments, training, membership. Not the chess board, engine, lessons library or content.
For: RIVEN, a 1v1 online jousting game. We take the **structure and flows** only. No name, code, art, text or layout pixels.
Date: 2026-11-13

Method: public pages read logged-out at human speed, plus general knowledge of the product. No account used, no code or network calls inspected. No screenshots were saved.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | play page (logged out) | https://www.chess.com/play/online | board left, action panel right: New Game / Games / Players tabs, time-control picker, Start, Custom Challenge, Play a Friend, Tournaments; live counters |
| 2 | leaderboards | https://www.chess.com/leaderboard | one board per game type, top 5 + "see all", global/friends scope, site-wide counters |
| 3 | tournaments | https://www.chess.com/tournaments | list with name / players / time / rating band; types: knockout, swiss, arena; create; completed; club tournaments |
| 4 | membership | https://www.chess.com/membership | 3 tiers gating training volume, bots, review, stats, ads |
| 5 | public data API docs | https://www.chess.com/news/view/published-data-api | player, stats per format, games archive, clubs, tournaments, leaderboards — confirms the data model |
| 6 | help center | https://support.chess.com | fair play, abandonment, rating, tournament rules |

## Core loop

Pick a format → get matched with someone of your strength in seconds → play → see your rating change → one click to play again.

## Screens

| ID | screen (theirs) | purpose | key components | RIVEN screen |
| --- | --- | --- | --- | --- |
| S01 | Landing | pitch + play as guest | hero, counters, CTA | Landing `/` |
| S02 | Sign up / Log in | account | form, social login | `/register`, `/login` |
| S03 | Home (logged in) | daily hub: resume, stats, friends | cards | folded into Lobby |
| S04 | Play lobby | start any game | board preview, tabbed action panel, format picker, start, challenge, friend link | Lobby `/play` |
| S05 | Matchmaking wait | searching state | spinner, cancel | Lobby "seeking" state |
| S06 | Live game | play | board, 2 player cards with clocks, move list, resign/draw, chat | Match `/match/:id`: arena view, 2 knight cards, pass list, plan picker, yield |
| S07 | Game over | result | win/loss, rating delta, rematch, new game, review | Result card |
| S08 | Game review | analysis | accuracy, key moments | **skip** (no replays by design) → pass-by-pass summary on result card |
| S09 | Profile | identity | avatar, flag, ratings per format, record, graph, recent games, trophies, friends, clubs | Knight `/knight/:name` |
| S10 | Stats | deep stats per format | graph, best win, streaks | part of Knight page |
| S11 | Leaderboards | rank | per-format boards, scope filter | `/leaderboard` |
| S12 | Tournaments list | find events | table, filters, create | `/tournaments` |
| S13 | Tournament page | lobby, standings/bracket, join | players, rounds, countdown | `/tournaments/:id` |
| S14 | Puzzles / lessons | training | daily puzzle, rated puzzles | Drills `/drills` |
| S15 | Play computer | bots with personalities and ratings | bot gallery | Lobby "practice" + Drills |
| S16 | Friends / clubs | social | list, challenge, invite | Lobby "Knights" tab; clubs later |
| S17 | Watch / TV | spectate top games | stream of live games | later |
| S18 | Membership | upsell | tier table | Armoury `/armoury` (cosmetics only, no pay-to-win) |
| S19 | Settings | board/pieces themes, account | forms | later; heraldry editor replaces themes |

## Flows

```
F01 Guest plays first game
    S01 -> S04 -> S05 -> S06 -> S07          happy path clicks: 2
F02 Member plays a rated game
    S04 pick format -> start -> S05 -> S06 -> S07 -> rematch/new   clicks: 2
    edge: no opponent (widen rating range, offer bot), opponent leaves (abandon = loss, penalty)
F03 Challenge a friend
    S04 play a friend -> copy link / pick friend -> friend accepts -> S06   clicks: 3
F04 Join a tournament
    S12 -> S13 join -> wait for start -> S06 per round -> S13 bracket -> trophy on S09
    edge: late join, no-show forfeits, odd player count (bye)
F05 Check standing
    S07 rating delta -> S09 graph -> S11 leaderboard
F06 Train
    S14 daily drill -> result -> streak
```

## Components

| component | variants | used on |
| --- | --- | --- |
| Side navigation | expanded, collapsed, mobile bar | all |
| Player card | name, title/league badge, rating, flag, clock | S06, S07, S13 |
| Format picker | grouped by speed | S04, S11, S12 |
| Tabbed action panel | New / Games / Players | S04 |
| Move list → **pass list** | row per turn, current highlighted | S06 |
| Result modal | win / loss / draw, rating delta, 2 CTAs | S07 |
| Rating graph | per format, time range | S09 |
| Leaderboard table | rank, badge, name, rating | S11 |
| Tournament row / bracket | status, players, band | S12, S13 |
| Live counters | playing now, games today | S01, S04, S11 |

## Inferred data model

```
Profile     id, username, avatar/heraldry, country, joined_at, league, status
            evidence: S09, API /player            confidence: high
Rating      profile_id, format, rating, deviation, volatility, best, games, w/l/d
            evidence: S09, S10, API /player/stats (Glicko fields exposed)   confidence: high
Match       id, format, rated, white/black → a/b, result, end_reason, rating_before/after, ended_at
            evidence: S07, API games archive       confidence: high
Queue       profile_id, format, rating, joined_at  evidence: S05   confidence: guess
Challenge   id, from, to|link_code, format, rated, status, expires_at   evidence: S04   confidence: medium
Friendship  a, b, status                           evidence: S16   confidence: high
Tournament  id, name, type, format, rating_min/max, starts_at, status, max_players, created_by
            evidence: S12, S13, API /tournament    confidence: high
TournamentPlayer  tournament_id, profile_id, seed, status, placement    confidence: high
TournamentMatch   tournament_id, round, slot, match_id                  confidence: medium
Trophy      profile_id, tournament_id, placement   evidence: S09   confidence: medium
Report      reporter, target, match_id, reason, status   evidence: help center   confidence: medium
```

Relationships: Profile 1-n Rating, Profile n-n Match, Tournament 1-n TournamentPlayer, Tournament 1-n TournamentMatch 1-1 Match.

## Feature matrix

See `features.csv`. Must 17, should 9, could 6, skip 5.

## Out of scope (cannot or should not be cloned)

- The player network (hundreds of millions of accounts) and titled players.
- Lessons, courses, puzzle database, coach content — owned content.
- Game review engine — and RIVEN stores no replays by design.
- Brand, piece/board themes, any visual identity.
- Paid tiers that gate play features: RIVEN sells cosmetics only.

## Size

Screens 12 for RIVEN, flows 6, entities 11. Hard parts: realtime match + fair resolution, matchmaking with few players online, tournaments (byes, no-shows). Size: **L** for the platform; the realistic 3D arena is separate and larger.

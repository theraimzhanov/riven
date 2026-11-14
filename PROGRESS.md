# Where the work stopped (2026-11-13)

Branch: `feature/finish-website`. Not merged to `master`. `master` still has the last working site.

Goal of this branch: finish every part of the website except the 3D arena, online ranked play and tournaments.

## Done on this branch
- Database (already applied to the RIVEN Supabase project): editable profile fields (country, heraldry colours, division), ratings per format, `matches` (practice history), `friendships`, and `delete_my_account()`.
- Hero art from Higgsfield in `public/media/`: `hero.png`, `tiltyard.png`, `hero.mp4` (5-second video made from the hero image).
- Code written: landing page with the video, How to play, Terms, Privacy, lobby with real match history and friends, real leaderboard and knight profiles, drills that count wins, Armoury as a heraldry editor, Settings (country, password, delete account), forgot/reset password, match results saved to history.

## Not done
1. **Styles for the new parts** are missing from `src/styles.css`: `.hero-video`, `.hero-shade`, `.band`, `.arena.art`, `.prose`, `.swatches`, `.sr`, `.notice`, `tr.me`. The pages will look broken until these exist.
2. **Nothing on this branch has been opened in the browser.** Type-check, build, then check every page, logged out and logged in.
3. **Save the migration file** for `profiles_matches_friends` into `supabase/migrations/` (it is applied to the database but not yet in the repo).
4. **Run the Supabase security check** after the new tables.
5. **Shrink the media**: the two PNGs are about 1.6 MB each and the video is 5.5 MB. No image or video converter is installed on this PC.
6. A third image (knight close-up) was planned but not generated.
7. Remove code the new pages no longer use (`guest`, `findKnight` in `src/data/mock.ts`, the old `--a/--b` shield rule in the styles).
8. Then: merge to `master`, push.

## Higgsfield
Free plan, about 4.6 credits left of 10. Most models need a paid plan; `soul_cinematic` (images) and `cinematic_studio_video_v2` (video) worked.

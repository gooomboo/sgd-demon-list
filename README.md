# Demonlist — How To Guide

Five files, no accounts, no server. You maintain the list by editing
`data.json` and pushing to GitHub. Everyone who visits the site just
reads it.

## The files

| File | What it does |
|---|---|
| `index.html` | The page structure — tabs, buttons, the music player |
| `style.css` | All the visuals, including dark mode |
| `app.js` | All the logic — loads `data.json` and builds every tab |
| `data.json` | **This is the only file you'll edit day to day.** Levels, records, moderators |
| `README.md` | This guide |

## Preview it before you publish

Opening `index.html` by double-clicking it **won't load the list** —
browsers block a page from reading local files with `fetch()` for
security reasons. This only affects local previewing; it works
perfectly once it's on GitHub Pages. To preview locally, either:

- Install the free **Live Server** extension in VS Code, right-click
  `index.html`, choose "Open with Live Server", or
- If you have Python installed, open a terminal in the `site` folder
  and run `python3 -m http.server`, then visit `http://localhost:8000`

## Adding a new level

Open `data.json` and add a new block inside the `"levels"` array.
Where you place it in the list decides its rank — put it at the top
for #1, lower down for an easier placement:

```json
{
  "name": "Your Level Name",
  "creator": "The Creator",
  "verifier": "Whoever First Verified It",
  "image": "your-level-name.png",
  "reqPercent": 60,
  "records": []
}
```

Don't forget the comma after the previous level's closing `}` if
you're inserting it in the middle of the array. Points aren't typed
in by hand — `app.js` calculates them automatically from the level's
position (#1 is worth the most, and it decreases from there), the
same way most Demon Lists work.

## Adding, removing, or editing a record ("victor")

Inside a level's `"records"` array, each completion looks like this:

```json
{ "player": "PlayerName", "percent": 100, "enjoyment": 8, "link": "https://youtube.com/..." }
```

- **Add one:** paste a new `{ ... }` block into that level's `records` array.
- **Remove one:** delete its `{ ... }` block.
- **Edit one:** change the numbers/text directly.

`enjoyment` is a 1–10 rating. The "Avg Enjoyment" shown on the list
and on the level's page is calculated automatically from every
record's `enjoyment` value — you never add that up yourself.

There's no separate list of players to keep updated. The Stats Viewer
tab is built entirely from whatever's inside every level's `records`
array plus each level's `verifier`. Delete someone's last record and
they simply stop appearing — nothing else to clean up.

## Reordering (moving placement)

Both levels and moderators are shown in the exact order they appear
in `data.json`. To move something, cut its `{ ... }` block and paste
it into a new position in the array. For a level, that changes its
rank (and its points) automatically.

## Adding images

1. Create a folder named `images` inside the same folder as
   `index.html`, if it isn't already there.
2. Upload your image files into it (drag-and-drop works on
   github.com — see the publishing steps below).
3. In `data.json`, set `"image"` to just the filename, e.g.
   `"image": "society.png"`. Don't use a full URL.

Keep filenames simple: lowercase, no spaces (use dashes), matching
extension (`.png` or `.jpg`).

## Editing moderators

Edit the `"moderators"` array in `data.json`:

```json
{ "name": "goomboo", "role": "List Leader" }
```

Replace `"username"` placeholders with real names, and add or remove
entries the same way you would for records.

## Background music

Click the 🎵 button in the navbar to choose an audio file from your
device. It's remembered in your browser going forward, so you won't
need to pick it again next time you visit — the ▶️ button plays it
and 🔊 mutes/unmutes. One thing this can't get around: browsers
block audio from auto-playing with sound, so you (and everyone else
visiting) will still need to click ▶️ once each visit. That's a
browser rule, not a bug.

## Submit-a-record button

Right now `id="submitFormBtn"` in `index.html` points to a
placeholder link. Create a Google Form (fields like Player Name,
Level, Progress %, Enjoyment, Video Link work well), copy its
shareable link, and paste it in as that button's `href`.

## Publishing to GitHub Pages

1. Create a repository on GitHub and upload all five files (plus
   your `images` folder) — either drag-and-drop on the repo's page,
   or `git add . && git commit -m "update" && git push` if you have
   git set up locally.
2. In the repo, go to **Settings → Pages**, set the source branch to
   `main` (or whichever branch you pushed to) and the folder to `/root`.
3. GitHub gives you a URL like `https://yourusername.github.io/yourrepo/`.
   That's your live site.

From then on, every time you want to update the list: edit
`data.json` (either locally and push, or directly in the GitHub
website's editor), commit the change, and the live site picks it up
automatically — no rebuild step, no re-deploying anything else.

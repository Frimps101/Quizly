# Quizly — Landing Page

A standalone marketing website for the Quizly app. Pure HTML + CSS + a little JavaScript — **no build step required**.

## Files

- `index.html` — page markup (hero, features, how-it-works, FAQ, footer)
- `styles.css` — all styling, brand-matched to the app (purple `#8641f4`), fully responsive
- `script.js` — mobile nav toggle, scroll shadow, footer year

## Preview locally

Just open the file in a browser:

```bash
open landing/index.html
```

Or serve it (recommended, so relative paths behave like production):

```bash
cd landing
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Deploy (free options)

**Netlify (drag & drop)**
1. Go to https://app.netlify.com/drop
2. Drag the `landing` folder onto the page — it's live instantly.

**Vercel**
```bash
cd landing
npx vercel
```

**GitHub Pages**
1. Push the repo to GitHub.
2. In repo Settings → Pages, set the source to the `landing` folder (or move these files to `/docs`).

## Customizing

- **Brand color:** change `--purple` in `styles.css` (`:root`).
- **Copy:** edit the text directly in `index.html`.
- **Store links:** update the two `.store-btn` anchors in the Download section once the app is published.
- **Social preview:** update the `og:` meta tags in `<head>`.

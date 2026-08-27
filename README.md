# Marine Programme 2024–25 — prototype

An interactive, editorial data story for Marine Facilities Planning. It uses illustrative data only and is intended as a design prototype—not as an operational report.

## Open locally

The prototype has no build step or dependencies.

1. Download or clone this folder.
2. Double-click `index.html` to open it in a browser.

For the most consistent local behaviour, run a small local server from this folder:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Publish with GitHub Pages

1. Create a new GitHub repository and add these files to its root.
2. Push the repository to GitHub.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder, then click **Save**.
6. GitHub will show the public URL when deployment is complete.

Because all asset paths are relative and there is no build step, the site works from a project Pages URL such as `https://username.github.io/repository-name/`.

## Structure

- `index.html` — content and accessible page structure
- `styles.css` — layout, visual system, transitions and responsive rules
- `script.js` — visualisations, scenario controls, popovers and navigation state

## Notes

- All figures, routes, names and programme results are illustrative.
- The site uses Google Fonts when online and falls back to system fonts when offline.
- Reduced-motion preferences are respected.

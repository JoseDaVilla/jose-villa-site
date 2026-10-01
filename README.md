# jose-villa-site

Jose Villa's portfolio. Astro, plain CSS and a few lines of vanilla TypeScript.
Flat colour and organic, Haikei-style shapes; no gradients, no UI framework.

## Commands

| Command           | Action                                   |
| :---------------- | :--------------------------------------- |
| `npm install`     | Install dependencies                     |
| `npm run dev`     | Dev server at `localhost:4321`           |
| `npm run build`   | Production build to `./dist/`            |
| `npm run preview` | Preview the production build             |
| `npm test`        | Unit tests for the shape generators      |

## Editing content

- **Projects:** one markdown file per project in `src/content/projects/`.
  - `group: featured` shows it as a colour band in *Selected work*; `group: more` lists it in the *More work* index.
  - `order` sets the position, `color` picks the band/dot colour (`orange`, `sky`, `sun`, `leaf`, `blue`).
  - `cover` + `gallery` (images in `src/assets/projects/<id>/`) feed the screenshot carousel.
  - `embedUrl` loads a live demo in the project window instead of screenshots; `liveUrl` adds a "Visit live site" button.
  - Use `year`, or `when` for a label such as "3-month engagement".
- **Experience:** `src/content/experience/`. `group: current` for the main timeline, `group: earlier` for the compact list.
- **Hero, About, Toolkit, Contact copy:** in the matching file in `src/components/`.
- **CV:** replace `public/Jose-Daniel-Villa-Resume.pdf` (same file name).

Every project opens in a dialog with its own link, e.g. `/#project-proaxis`, so you can send a client straight to one project.

## Environment

Copy `.env.example` to `.env` locally, and set the same variables in Vercel:

- `PUBLIC_SITE_URL`: canonical URL (sitemap, canonical links, social card).
- `PUBLIC_WEB3FORMS_KEY`: required for the contact form to deliver messages (free at web3forms.com).

## Design notes

- Palette and type scale live as CSS variables at the top of `src/styles/global.css`.
- Shapes come from `src/lib/shapes.ts` (seeded, generated at build time, zero client JS).
- Fonts: Rubik (display) and Figtree (body), self-hosted via Fontsource. The social card uses static TTF instances in `src/assets/fonts/` (SIL OFL).
- The social card background is `src/assets/og-bg.png`; regenerate it with `node scripts/og-background.mjs` (needs Playwright).
- `.npmrc` sets `legacy-peer-deps` to work around an npm peer-resolution bug with this dependency set.

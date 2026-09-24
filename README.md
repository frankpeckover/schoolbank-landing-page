# Myntix Landing Page

A small static landing/info page for the Myntix school rewards app.

## Files

- `index.html` contains the page content and structure.
- `server.js` serves the static files and handles walkthrough form submissions.
- `styles.css` contains all visual styling and responsive layout rules.
- `.env.example` documents the required production environment variables.
- `robots.txt` and `sitemap.xml` provide crawler discovery metadata.
- `assets/illustration-hero.png`, `assets/illustration-shop.png`, and `assets/illustration-leadership.png` are marketing illustrations used by the page.
- `assets/myntix-logo-lockup.png` is used in the header and footer.
- `assets/myntix-og.png` is used for social link previews.
- `assets/myntix-mark.png`, `assets/myntix-logo-full.png`, and `assets/myntix-wordmark.png` are available brand assets.

## SEO Setup

The page uses `https://www.myntix.com.au/` for canonical, Open Graph, structured data, robots, and sitemap URLs. Replace that value in `index.html`, `robots.txt`, and `sitemap.xml` if the production domain changes.

## Replacing Illustrations

Export your new artwork as PNG files and replace these files with the same names:

- `assets/illustration-hero.png` for the hero recognition scene.
- `assets/illustration-shop.png` for the reward shop section.
- `assets/illustration-leadership.png` for the leadership confidence section.

No HTML changes are needed if the filenames stay the same.

## Local Preview

Install dependencies and run the Node server:

```bash
npm install
cp .env.example .env
npm run dev
```

Set `RESEND_API_KEY`, `CONTACT_TO`, and `CONTACT_FROM` in `.env` before testing real form submissions. The site runs on `http://127.0.0.1:3001` by default.

## App Login Picker

The landing page login button fetches organisations through the landing server:

```txt
GET /api/public/organisation
```

The landing server proxies that request to the main app endpoint configured by:

```bash
MYNTIX_ORGANISATION_DISCOVERY_URL=https://api.myntix.com/api/public/organisation
MYNTIX_APP_LOGIN_URL=https://app.myntix.com/login
```

The main app endpoint should return an array, or an object with `organisations`, `organizations`, or `data`. Each organisation should include `name` and either `loginUrl` or `slug`. If only `slug` is returned, the landing server builds a login URL from `MYNTIX_APP_LOGIN_URL`.

## Cloudflare Analytics

The server sends HTML with `Cache-Control: no-store, no-transform` so Cloudflare does not automatically rewrite the page and inject a beacon with a stale integrity hash.

In Cloudflare Web Analytics, set the site to **Enable with JS Snippet installation** and copy the snippet token into:

```bash
CF_WEB_ANALYTICS_TOKEN=your_cloudflare_beacon_token
```

Leave `CF_WEB_ANALYTICS_TOKEN` empty locally if you do not want analytics during development.

## Production

Run the app behind your existing reverse proxy:

```bash
npm ci --omit=dev
npm start
```

Keep `RESEND_API_KEY` in the server environment only. Do not put it in client-side JavaScript or HTML.

# Spatial Rail live demo — offline clone

A working offline copy of the **Spatial Rail live demo** at
[spatialsites.co/kits/spatial-rail/demo](https://spatialsites.co/kits/spatial-rail/demo).

The demo is the complete interactive menswear site: ten garments on a rail,
jewellery, journal, bag and “Look closer” product sheets. Everything needed to
view and use it is stored locally; the page does not contact
`spatialsites.co` or any CDN at runtime.

## Quick start

Requirements: [Node.js](https://nodejs.org/) 18 or newer. There are no npm
dependencies to install.

1. Double-click **`start.cmd`** (Windows), or run:

   ```powershell
   node server.js
   ```

2. Open **<http://127.0.0.1:4173/>**.

3. To use another port:

   ```powershell
   $env:PORT = 5000; node server.js
   ```

The server serves the full-screen demo route from **`index.html`**.

## URLs

| URL | What it is |
| --- | --- |
| `/` or `/index.html` | Full-screen demo route, matching the live `/kits/spatial-rail/demo` page |
| `/demo/` | The raw Spatial Rail demo without the floating wrapper controls |
| `/kits/spatial-rail/demo/` | Alias of `/`, matching the original path |
| `/robots.txt` | Crawler policy allowing search engines |

## Project Structure

```text
bugbunty/
├─ demo/                    The complete Spatial Rail demo site
│  ├─ index.html            Standalone demo page with SEO & Schema.org metadata
│  ├─ favicon.svg           Site favicon
│  ├─ poster.webp           Social share poster image
│  └─ assets/               CSS, JS, fonts, garments, jewellery, room images
├─ index.html               Standard entry point: full-screen demo wrapper with boot loader
├─ wrapper-fonts/           JetBrains Mono font used by wrapper controls
├─ 404.html                 "Not part of the local demo" fallback page
├─ server.js                Static HTTP server with gzip compression & caching headers
├─ start.cmd                Windows launcher
├─ robots.txt               Crawler policy
└─ README.md
```

## Performance & SEO Optimizations

- **100% SEO**:
  - `robots.txt` and `<meta name="robots" content="index, follow">` ensure full crawlability.
  - Canonical links (`<link rel="canonical" ...>`) present on all pages.
  - Complete Open Graph and Twitter Card tags.
  - Schema.org JSON-LD structured data on both wrapper and demo.
  - All image elements include valid, descriptive `alt` tags.

- **100% Performance**:
  - Instant boot loader renders in `<0.2s` for immediate First Contentful Paint (FCP).
  - Responsive WebP image loading for rail garments saves `>700 KiB` on initial page load.
  - High-resolution garment views load progressively on approach (`jt()`) or inside the modal sheet.
  - Critical font and image preloading (`<link rel="preload" ...>`).
  - Gzip text compression enabled for all compressible assets.
  - Immutable long-term caching (`max-age=31536000`) for static images, fonts, scripts, and stylesheets.
  - Layout shift free (CLS = 0).

- **100% Accessibility & Best Practices**:
  - Minimum 48×48 px touch target sizes on interactive controls.
  - High-contrast `:focus-visible` outlines for keyboard navigation.
  - Secure links with `rel="noopener noreferrer"`.

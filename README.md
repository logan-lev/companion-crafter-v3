# Companion Crafter

A web-based D&D 5e character builder and character sheet built with React, TypeScript, and Vite.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

The production build is written to `dist/`.

## Deploy To Vercel

This project is ready to deploy on Vercel.

### Deploy From GitHub

1. Push this project to a GitHub repository.
2. Go to [Vercel](https://vercel.com/).
3. Click `Add New...` then `Project`.
4. Import the GitHub repository.
5. Keep these settings:
   `Framework Preset`: `Vite`
   `Build Command`: `npm run build`
   `Output Directory`: `dist`
6. Click `Deploy`.

### Deploy From The Vercel CLI

```bash
npm install -g vercel
vercel
```

For a production deployment:

```bash
vercel --prod
```

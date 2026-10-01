# Opening Lab

A mobile-friendly chess opening trainer. Practice Lichess opening lines as White or Black, then continue against Stockfish, or start a free game immediately. The browser calls [Chess API](https://chess-api.com/) for Stockfish moves and evaluations.

## Local development

```sh
pnpm install
pnpm dev
```

## Deploy on Vercel

Import this GitHub repository into Vercel. The project uses Vite; `vercel.json` sets the build command to `pnpm build` and output directory to `dist`. Connect the repository to enable deployments on each push to `main`.

See [DATA_SOURCES.md](DATA_SOURCES.md) for opening data and piece artwork attribution.

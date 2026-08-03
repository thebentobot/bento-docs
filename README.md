# Bento Docs

The public Astro Starlight documentation for [Bento](https://bentobot.xyz), deployed as static assets to `docs.bentobot.xyz`.

## Local development

Use Node 24 (enforced by the `engines` field in `package.json`), then run:

```sh
npm install
npm run dev
```

The repository uses the same ESLint and Prettier conventions as `bento-web` for JavaScript,
TypeScript, Astro, Markdown, JSON, YAML, and CSS. The Svelte-only rules are omitted because this
site currently has no Svelte components.

```sh
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

Development automatically reads `../dotBento/docs/slash-commands.json` when the bot repository is adjacent. To use a specific production release instead:

```sh
DOTBENTO_REF=v1.2.3 npm run build
```

Only stable `vX.Y.Z` tags are accepted. `DOTBENTO_MANIFEST=path/to/slash-commands.json` provides an explicit local override.

## Content model

- `src/content/docs/` contains hand-written guides.
- `src/content/command-notes/` contains optional MDX additions keyed by `commandId`.
- `scripts/sync-commands.mjs` validates dotBento's manifest and generates one reference page per top-level slash-command group plus General.
- Generated content is ignored by Git and recreated before development, tests, and builds.

Stable dotBento releases dispatch the exact release tag to this repository. Deploys without a tag resolve GitHub's latest stable release and fail rather than silently publishing malformed or prerelease command data.

For the initial launch, merge the exporter into dotBento and publish a stable release before running this repository's CI/deploy workflow. Older releases do not contain the manifest and intentionally cannot be used as a documentation source.

## Required repository secrets

- `CLOUDFLARE_API_TOKEN`: permission to deploy the Worker.
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account containing `docs.bentobot.xyz`.

The dotBento repository additionally needs `BENTO_DOCS_DISPATCH_TOKEN`, a fine-grained GitHub token with Contents write access to this repository.

Licensed under AGPL-3.0. See [LICENSE](LICENSE).

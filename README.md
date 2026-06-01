# InkLink

InkLink is a tactile, realtime canvas workspace for creative teams.

## Workspace

This repository is a pnpm monorepo:

- `apps/web` - React and Vite frontend
- `apps/api` - Express API server
- `packages/shared` - shared TypeScript domain types and constants

The frontend uses UnoCSS for utility classes alongside app-specific CSS for
the tactile InkLink surface.

## Requirements

- Node.js 24.16+
- pnpm 11+

## Getting Started

Install dependencies:

```bash
pnpm install
```

Copy the API environment file when you need local overrides:

```bash
cp apps/api/.env.example apps/api/.env
```

The API validates required environment variables before the server starts.
For local development, `apps/api/.env` must define:

- `APP_ENV`
- `HOST`
- `MONGODB_URI`
- `NODE_ENV`
- `PORT`

The Docker image does not bake app runtime variables into the image. Runtime
configuration comes from local `.env` files in development and Fly secrets in
production.

Run the web app and API together:

```bash
pnpm dev
```

Default local URLs:

- Web: `http://localhost:5173`
- API health check: `http://localhost:4000/health`

## Useful Scripts

```bash
pnpm dev
pnpm check
pnpm check:write
pnpm lint
pnpm format
pnpm typecheck
pnpm build
pnpm hooks:install
```

## Development Guardrails

InkLink uses:

- Biome for formatting, linting, and import organization.
- Commitlint for Conventional Commit messages.
- Lefthook for `pre-commit`, `commit-msg`, and `pre-push` hooks.

Run `pnpm hooks:install` if hooks are not active after installing dependencies.

## Deployment

InkLink is configured for a single-app Fly.io deployment.

GitHub Actions handles deployment in two steps:

- `CI` runs formatting/linting, typechecking, and build checks.
- `Deploy` runs only after `CI` succeeds on `main` or `staging`.

Use GitHub **Environment secrets**, not broad repository secrets, for deployment
runtime config. Create `production` and `staging` environments in GitHub, then
add the same secret names to each environment with environment-specific values:

```text
FLY_API_TOKEN
INKLINK_APP_ENV
INKLINK_FLY_APP
INKLINK_HOST
INKLINK_MONGODB_URI
INKLINK_NODE_ENV
INKLINK_PORT
```

Create the token locally with:

```bash
fly tokens create deploy -a inklink --name "inklink github actions" --expiry 720h
```

The deploy workflow stages Fly runtime secrets from GitHub Actions secrets before
running `flyctl deploy`. Use values like:

```text
INKLINK_APP_ENV=production
INKLINK_FLY_APP=inklink
INKLINK_HOST=0.0.0.0
INKLINK_MONGODB_URI=mongodb+srv://...
INKLINK_NODE_ENV=production
INKLINK_PORT=4000
```

For staging, use the same secret names in the `staging` GitHub environment, but
point them at staging resources, for example:

```text
INKLINK_APP_ENV=staging
INKLINK_FLY_APP=inklink-staging
INKLINK_HOST=0.0.0.0
INKLINK_MONGODB_URI=mongodb+srv://...
INKLINK_NODE_ENV=production
INKLINK_PORT=4000
```

The Fly app receives those values as `APP_ENV`, `HOST`, `MONGODB_URI`,
`NODE_ENV`, and `PORT`.

`fly.toml` is shared by both deployments. The target Fly app comes from
`INKLINK_FLY_APP`, not from `fly.toml`. Fly still requires
`http_service.internal_port` as a literal proxy value, so the deploy workflow
checks that `INKLINK_PORT` matches it before deploying.

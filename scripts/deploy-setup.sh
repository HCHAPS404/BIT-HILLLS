#!/usr/bin/env bash
# Setup + primer deploy real de MAREA en Cloudflare, y CI/CD en GitHub Actions.
# Correr desde la raíz del repo. Es interactivo: pide login por navegador
# (Cloudflare y GitHub) y el pegado del API Token de Cloudflare.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GH_REPO="HCHAPS404/BIT-HILLLS"
cd "$REPO_ROOT"

echo "== 1/6 · Login Cloudflare (se abre el navegador) =="
(cd api && npx wrangler login)

echo
echo "== 2/6 · Deploy API (Worker) =="
cd api
npm ci
DEPLOY_OUT="$(npm run deploy 2>&1 | tee /dev/stderr)"
cd ..
API_URL="$(echo "$DEPLOY_OUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.workers\.dev' | head -1 || true)"
if [ -z "$API_URL" ]; then
  echo "No pude detectar la URL del Worker automáticamente."
  read -rp "Pégala manualmente (la imprimió wrangler arriba): " API_URL
fi
echo "API URL: $API_URL"

echo
echo "== 3/6 · Deploy Web (Pages) =="
cd web
npm ci
VITE_API="$API_URL" npm run deploy
cd ..

echo
echo "== 4/6 · Login GitHub (se abre el navegador) =="
gh auth login -h github.com

echo
echo "== 5/6 · Commit + push del scaffolding de deploy =="
git add .github/workflows/deploy.yml web/.env.production api/.dev.vars.example README.md scripts/deploy-setup.sh
if ! git diff --cached --quiet; then
  git commit -m "chore: agrega CI/CD de deploy a Cloudflare (Worker + Pages)"
fi
git push origin "$(git rev-parse --abbrev-ref HEAD)"

echo
echo "== 6/6 · Secrets/variables del workflow en GitHub =="
echo "Crea el token en: https://dash.cloudflare.com/profile/api-tokens (permisos Workers Scripts:Edit + Cloudflare Pages:Edit)"
read -rsp "Pega el Cloudflare API Token: " CF_TOKEN
echo
read -rp "Pega el Cloudflare Account ID (dashboard → barra lateral derecha): " CF_ACCOUNT_ID

gh secret set CLOUDFLARE_API_TOKEN --repo "$GH_REPO" --body "$CF_TOKEN"
gh variable set CLOUDFLARE_ACCOUNT_ID --repo "$GH_REPO" --body "$CF_ACCOUNT_ID"
gh variable set VITE_API --repo "$GH_REPO" --body "$API_URL"

echo
echo "Listo."
echo "  API (Worker):  $API_URL"
echo "  Web (Pages):   revisa la línea 'https://*.pages.dev' que imprimió wrangler arriba."
echo "  CI/CD:         cada push a main vuelve a desplegar ambos automáticamente."

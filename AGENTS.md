# AGENTS.md — continuidad de MAREA entre herramientas de IA

Este archivo es para que cualquier asistente (Claude Code, Codex CLI, Cursor,
opencode u otro) retome el trabajo sin depender de una sesión o cuota
específica. Léelo antes de tocar código. **Actualízalo** cuando cierres un
pendiente o descubras uno nuevo — es un documento vivo, no un log histórico.

Qué es el proyecto, la fórmula del IRI y el pitch completo: ver `README.md`.
Esto de acá es solo estado operativo y pendientes.

## Arrancar

```bash
cd api && npm install && npm run dev   # :8787
cd web && npm install && npm run dev   # :5173
```

## Estado al 2026-08-13

**Ramas (4):**

| Rama | Estado | Dueño de facto |
|---|---|---|
| `main` | Base mergeada (PR #1 + PR #2) + D1 activo con reportes conectados al motor + deploy real en vivo + CI/CD | tronco |
| `feat/marea-base` | Al día con `main` (sus 2 commits pendientes ya se mergearon vía PR #2) | Andres (Sidechain07) — activo, no tocar sin avisarle |
| `feat/vision-canal` | Atrás de `main` (le falta el pulido de UI, el CI/CD y el wiring de reportes). Aporta `api/src/adapters/vision.ts`, sin conectar a nada | huérfana, libre para retomar |
| `feat/fontumi` | Atrás de `main` (mismo gap). Aporta `api/src/services/notify.ts`, sin conectar a nada | huérfana, libre para retomar |

**Deploy (Cloudflare, cuenta `helmut.chs@gmail.com`, account id
`e75862195de36f76657bda6bef14ec71`):**

- API (Worker): `https://marea-api.marea-cartagena.workers.dev` — funcionando, CI/CD ok, con D1 activo.
- Web (Pages, proyecto `marea`): `https://marea-drq.pages.dev` — funcionando, CI/CD ok.
- CI/CD: `.github/workflows/deploy.yml`, dispara en push a `main`. Secrets/variables ya están puestos en el repo de GitHub (`CLOUDFLARE_API_TOKEN` con permisos Workers Scripts:Edit + Cloudflare Pages:Edit, `CLOUDFLARE_ACCOUNT_ID`, `VITE_API`) — confirmado funcionando repetidas veces el 2026-08-13. Si algo falla más adelante, probablemente sea el token expirado/rotado, no un problema del workflow.
- D1: **creado y activo** (`database_id` en `api/wrangler.jsonc`, database name `marea`). Schema aplicado en remoto.

## Gaps de integración reales (no son solo TODOs de comentario)

Verificado leyendo el código, no asumido:

1. ~~El ciclo de reportes ciudadanos no alimenta el motor de riesgo~~ —
   **resuelto 2026-08-13.** `api/src/adapters/reportes.ts` agrega
   reportes recientes de D1 (decaimiento exponencial, vida media 10 días)
   y `evaluate.ts` los usa para la señal de obstrucción. Verificado
   end-to-end en producción. `reportes` ahora tiene columnas `confianza`
   y `pendiente_revision`, listas para que `vision-canal` las llene.
2. **`vision.ts` (rama `feat/vision-canal`) no está conectado a nada.**
   Falta: binding `"ai": { "binding": "AI" }` en `wrangler.jsonc`, y que
   `POST /api/reportes` reciba una foto real (hoy solo acepta un
   `severidad` numérico puesto por el cliente, no una imagen) y llame
   `clasificarCanal()`. Ya NO hace falta reimplementar la agregación de
   reportes — usa `leerReportesRecientes`/`obstruccionDesdeReportes` de
   `api/src/adapters/reportes.ts` (en `main`), no la copia que trae
   `vision.ts` en su propia rama.
3. **`notify.ts` (rama `feat/fontumi`) no está conectado a nada.**
   El cron `scheduled()` en `index.ts` calcula zonas críticas pero nunca
   llama a un `Notificador`. No existe endpoint para dar de alta
   `suscriptores` (la tabla ya existe en `schema.sql`, sin ruta que la
   use). `yaAvisado()` existe pero nada inserta en `alertas_enviadas`.
4. **`web/.env.production` y las variables de GitHub Actions ya apuntan
   al Worker real** — si el Worker se redespliega bajo otra URL, hay que
   actualizar ambos.

## Fricciones ya resueltas (no las repitas)

- Cloudflare exige registrar un subdominio `workers.dev` en la cuenta
  antes del primer `wrangler deploy` — no aparece hasta que falla el
  primer deploy. Ya está registrado (`marea-cartagena`).
- El token de GitHub CLI necesita el scope `workflow` para poder hacer
  push a archivos dentro de `.github/workflows/` — si un push a ese path
  falla con "refusing to allow an OAuth App", es esto, no un permiso del
  repo. Fix: `gh auth refresh -h github.com -s workflow`.
- El deploy de Cloudflare Pages vía token de API (no OAuth de usuario)
  necesita el permiso `Account > Cloudflare Pages > Edit` explícito en el
  token — el permiso de Workers no lo cubre.
- `wrangler deploy` / `wrangler login` no funcionan en modo no interactivo
  (sin TTY real): cualquier prompt cae siempre al valor por defecto. Si
  hace falta automatizar algo así, usar la API HTTP de Cloudflare
  directamente con el `oauth_token` guardado en
  `~/.config/.wrangler/config/default.toml`, no el CLI.

## Pendiente, priorizado

1. Rotar el `CLOUDFLARE_API_TOKEN` si en algún momento se compartió en texto plano fuera de GitHub Secrets.
2. Rebasar `feat/vision-canal` y `feat/fontumi` sobre `main` (les falta el pulido de UI, el CI/CD y el wiring de reportes ya resuelto).
3. Cerrar el gap #2 de la sección anterior: wiring de `vision.ts` (binding AI + `POST /api/reportes` con foto real).
4. Cerrar el gap #3: wiring de `notify.ts` + endpoint de suscriptores.
5. Calibración del modelo IRI contra datos de OAGRD/ERA5 (ver README, sección "Honestidad del modelo").

## Resuelto

- ~~Deploy real (Worker + Pages) + CI/CD~~ — 2026-08-13
- ~~D1 creado y schema aplicado~~ — 2026-08-13
- ~~Reportes ciudadanos conectados al motor de riesgo~~ — 2026-08-13
- ~~Fix de mapa en blanco (re-entrancia) + contraste WCAG~~ — mergeado vía PR #2, 2026-08-13

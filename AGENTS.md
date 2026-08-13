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
| `main` | Base mergeada (PR #1) + deploy real en vivo + CI/CD | tronco |
| `feat/marea-base` | 1 commit adelante de `main`: fix de mapa en blanco (`5243f1a`, re-entrancia de MapLibre en pestaña oculta) sin mergear todavía | Andres (Sidechain07) — activo, no tocar sin avisarle |
| `feat/vision-canal` | 5 commits atrás de `main` (le falta el pulido de UI y el CI/CD). Aporta `api/src/adapters/vision.ts`, sin conectar a nada | huérfana, libre para retomar |
| `feat/fontumi` | 5 commits atrás de `main`. Aporta `api/src/services/notify.ts`, sin conectar a nada | huérfana, libre para retomar |

**Deploy (Cloudflare, cuenta `helmut.chs@gmail.com`, account id
`e75862195de36f76657bda6bef14ec71`):**

- API (Worker): `https://marea-api.marea-cartagena.workers.dev` — funcionando, CI/CD ok.
- Web (Pages, proyecto `marea`): `https://marea-drq.pages.dev` — funcionando, CI/CD ok.
- CI/CD: `.github/workflows/deploy.yml`, dispara en push a `main`. Secrets/variables ya están puestos en el repo de GitHub (`CLOUDFLARE_API_TOKEN` con permisos Workers Scripts:Edit + Cloudflare Pages:Edit, `CLOUDFLARE_ACCOUNT_ID`, `VITE_API`) — confirmado funcionando en el run `31725700888` (2026-08-13), ambos jobs en success. Si algo falla más adelante, probablemente sea el token expirado/rotado, no un problema del workflow.
- D1: NO está creado (opcional, comentado en `api/wrangler.jsonc`).

## Gaps de integración reales (no son solo TODOs de comentario)

Verificado leyendo el código, no asumido:

1. **El ciclo de reportes ciudadanos NO alimenta el motor de riesgo.**
   `POST /api/reportes` (`api/src/index.ts`) escribe en D1 pero
   `evaluate.ts` (líneas ~123-133) siempre usa `obstruccion_base` de la
   zona — nunca lee la tabla `reportes`. La función que sí sabe agregar
   reportes en una señal (`obstruccionDesdeReportes`) vive en
   `feat/vision-canal:api/src/adapters/vision.ts` pero nadie la llama.
2. **`vision.ts` (rama `feat/vision-canal`) no está conectado a nada.**
   Falta: binding `"ai": { "binding": "AI" }` en `wrangler.jsonc`, y que
   `POST /api/reportes` reciba una foto real (hoy solo acepta un
   `severidad` numérico puesto por el cliente, no una imagen) y llame
   `clasificarCanal()`.
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

1. Confirmar que el CI/CD de Pages quedó funcionando (permiso del token) — ver sección Deploy arriba.
2. Rotar el `CLOUDFLARE_API_TOKEN` si en algún momento se compartió en texto plano fuera de GitHub Secrets.
3. Mergear `5243f1a` (fix de mapa en blanco) de `feat/marea-base` a `main` — coordinarlo con Andres, es su rama activa.
4. Rebasar `feat/vision-canal` y `feat/fontumi` sobre `main` (están 5 commits atrás).
5. Cerrar el gap #1 de la sección anterior: conectar `reportes` → `obstruccionDesdeReportes` → señal `obstruccion` en `evaluate.ts`. Esto es prerrequisito real para que `vision-canal` tenga sentido.
6. Cerrar el gap #2: wiring de `vision.ts`.
7. Cerrar el gap #3: wiring de `notify.ts` + endpoint de suscriptores.
8. D1 (opcional): `npm run db:create` en `api/`, pegar el `database_id` en `wrangler.jsonc`, descomentar el bloque `d1_databases`.
9. Calibración del modelo IRI contra datos de OAGRD/ERA5 (ver README, sección "Honestidad del modelo").

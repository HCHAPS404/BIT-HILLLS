-- MAREA · esquema D1
-- OPCIONAL: la API funciona sin base de datos (calcula en vivo).
-- D1 sirve para historial, suscriptores y reportes ciudadanos.
--   npm run db:create   → copiar database_id a wrangler.jsonc
--   npm run db:schema

DROP TABLE IF EXISTS alertas_enviadas;
DROP TABLE IF EXISTS suscriptores;
DROP TABLE IF EXISTS reportes;
DROP TABLE IF EXISTS evaluaciones;
DROP TABLE IF EXISTS senales;

-- Historial de señales normalizadas. El core consume esto, no las APIs.
CREATE TABLE senales (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  zona_id   TEXT NOT NULL,
  tipo      TEXT NOT NULL CHECK(tipo IN ('lluvia_3h','nivel_mar','oleaje','obstruccion')),
  valor     REAL NOT NULL,
  unidad    TEXT NOT NULL,
  t_valido  TEXT NOT NULL,
  confianza REAL NOT NULL DEFAULT 1.0,
  fuente    TEXT NOT NULL,
  t_ingesta TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_senales ON senales(zona_id, tipo, t_valido);

-- Evaluaciones del cron. Base para calibrar el modelo más adelante.
CREATE TABLE evaluaciones (
  zona_id     TEXT NOT NULL,
  t           TEXT NOT NULL,
  iri         REAL NOT NULL,
  banda       TEXT NOT NULL CHECK(banda IN ('verde','amarillo','naranja','rojo')),
  componentes TEXT NOT NULL,
  ver_cop     REAL NOT NULL,
  t_calculo   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (zona_id, t)
);

-- Reporte ciudadano de canal obstruido: foto + ubicación → severidad 0–3.
-- Alimenta el componente O del IRI. Cierra el ciclo del modelo de negocio.
CREATE TABLE reportes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  zona_id        TEXT NOT NULL,
  lat            REAL,
  lon            REAL,
  foto_url       TEXT,
  severidad      INTEGER CHECK(severidad BETWEEN 0 AND 3),
  descripcion_ia TEXT,
  telefono       TEXT,
  t              TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reportes ON reportes(zona_id, t);

-- Establecimientos suscritos a alertas (Fontumi).
CREATE TABLE suscriptores (
  telefono       TEXT PRIMARY KEY,
  nombre         TEXT,
  establecimiento TEXT,
  categoria      TEXT CHECK(categoria IN ('hotel','restaurante','tour','retail')),
  zona_id        TEXT NOT NULL,
  umbral         TEXT NOT NULL DEFAULT 'naranja',
  voz            INTEGER NOT NULL DEFAULT 0,
  alta           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Anti-spam: máximo una alerta por zona/banda cada 6 h.
CREATE TABLE alertas_enviadas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  zona_id       TEXT NOT NULL,
  banda         TEXT NOT NULL,
  canal         TEXT NOT NULL CHECK(canal IN ('whatsapp','voz','consola')),
  destinatarios INTEGER NOT NULL DEFAULT 0,
  t             TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_alertas ON alertas_enviadas(zona_id, banda, t);

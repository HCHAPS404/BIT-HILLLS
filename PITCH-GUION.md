# Guion de pitch — MAREA

Guion hablado para acompañar `PITCH-SLIDES.md`. Pensado para **~4 minutos**
de pitch + tiempo de preguntas. Los tiempos son orientativos — practícalo
una vez y ajusta.

**Antes de arrancar:** deja abierta en otra pestaña `https://marea-drq.pages.dev`
para el demo en vivo del minuto 2. Si el wifi falla, los números de la
slide 5 ya están congelados en pantalla — no dependes de la conexión para
el punchline.

---

## 1 · Portada (10s)

> "Buenas. Somos [nombres]. Esto es **MAREA**: predecimos qué zonas de
> Cartagena se van a inundar, con 24 a 72 horas de anticipación —
> **sin un solo sensor instalado**."

*(Deja la slide 1 en pantalla 2-3 segundos antes de avanzar. El silencio después de "sin un solo sensor instalado" es a propósito — que se sienta la afirmación.)*

---

## 2 · El problema (30s)

> "En 2024 hubo 304 emergencias reportadas por la OAGRD en Cartagena.
> 49 fueron por lluvia e inundación. Se limpiaron 50 canales de drenaje
> ese año. El problema nunca fue limpiar — **fue saber cuál primero**,
> y con cuánto tiempo. Hoy esa decisión se toma a ojo, después de que ya
> llovió."

**Si preguntan "¿y esto quién lo pidió?":** cita el 43% de insatisfacción
con el manejo de basuras (EPC 2024) — esa basura es la que tapa los
canales. No es un problema inventado para el hackathon.

---

## 3 · La física, sin sensores (45s)

> "La tesis es simple: en Bocagrande–Centro–Manga el agua drena por
> gravedad hacia la bahía. Cuando el mar sube, el canal pierde altura
> útil para vaciar y se represa. Esa es toda la física."

*(Señala la fórmula en slide 3, de izquierda a derecha)*

> "R es la lluvia — el disparador. Sin lluvia, el índice es cero, literal,
> es multiplicativo. D es cuánto bloquea el mar la salida — nivel de
> marea más oleaje. O es cuánta basura tiene el canal, lo reportan los
> vecinos. Y S es qué tan susceptible es la zona por su cota y su
> historial."

> "Todo eso sale de fuentes públicas y gratuitas — Open-Meteo para
> lluvia y marea, OpenStreetMap para el mapa. Cero hardware."

---

## 4 · El motor económico (30s)

> "Pero un índice de riesgo no mueve a nadie. Lo que mueve es la plata.
> Por eso construimos VER: cuánto dinero pierde cada zona por cada hora
> bajo agua."

> "Contamos 1.533 comercios reales en las seis zonas — no una estimación,
> un conteo vía OpenStreetMap. Y no tratamos igual a un hotel que a una
> tienda de barrio: un hotel pierde el desayuno, no la noche ya pagada;
> un restaurante pierde el almuerzo completo. Esa diferencia está en el
> modelo."

---

## 5 · El demo — la slide que vale el pitch (45s)

> "Esto es lo que quiero que se les quede. Mismo aguacero, mismo canal.
> La única variable que cambia es la marea."

*(Señala los dos números, deja que respiren)*

> "En bajamar: índice 65.6, banda naranja, 189 millones de pesos
> expuestos por hora. El mismo aguacero, mismo canal, pero en pleamar:
> 83.7, banda roja, 337 millones."

> "**148 millones de pesos de diferencia, causados exclusivamente por
> la marea.** Eso es lo que nadie está midiendo hoy en Cartagena."

*(Opcional si hay tiempo y wifi: cambia a la pestaña del sitio en vivo,
mueve el slider de marea en el Panel de Supuestos y deja que el mapa se
recalcule en vivo. "Y esto no es una animación — el jurado puede mover
el mismo control ahora mismo".)*

---

## 6 · Arquitectura y honestidad del modelo (40s)

> "Del lado de ingeniería: el motor de riesgo no sabe que Open-Meteo
> existe — consume una señal genérica. Si mañana cambiamos de fuente de
> datos, o hasta de ciudad, son 40 líneas nuevas en un adaptador, cero
> cambios al core. Y si una fuente externa se cae, el sistema no se
> queda en blanco — cae a un escenario de respaldo y lo declara en
> pantalla."

> "El ciclo se cierra con el ciudadano: reporta un canal tapado —hoy con
> severidad manual, con un modelo de visión ya conectado para
> clasificar la foto automáticamente— y ese reporte entra al motor en
> tiempo real, no se queda guardado sin usarse."

**Sobre Fontumi, si preguntan (sé directo, no lo escondas):**
> "La interfaz de notificación —WhatsApp y llamada de voz por Fontumi—
> ya está construida y probada con un notificador de consola. La
> conexión a la cuenta real de Fontumi la dejamos en pausa por
> credenciales pendientes de confirmar, no por diseño. El sistema
> corre completo sin eso; cuando lleguen las credenciales son un
> cambio de una variable de entorno, no una reescritura."

*(Esta es la misma honestidad que ya declaramos con el badge "SIN
CALIBRAR" — decirlo antes de que lo pregunten es parte del pitch, no
una debilidad.)*

---

## 7 · Cierre — los tres números (20s)

> "Si se llevan tres números de esta mesa: **49** emergencias por agua
> en 2024. **43%** de la ciudad insatisfecha con las basuras que tapan
> los canales que deberían drenarlas. Y **1.533** comercios que hoy
> puede ver protegidos en un mapa, en tiempo real."

> "MAREA no reemplaza la limpieza de canales. Le dice a la ciudad **cuál
> primero, y con cuánto tiempo**. Gracias."

*(Cierra en silencio. No agregues nada después del "gracias" — deja que
el jurado pregunte.)*

---

## Preguntas esperadas — respuestas cortas

| Pregunta | Respuesta en una frase |
|---|---|
| "¿Esto está calibrado?" | "No, es un índice de plausibilidad ordenada — lo decimos en la UI con el badge. El plan de calibración usa los reportes de la OAGRD contra reanálisis ERA5." |
| "¿Y si cambia el clima / la ciudad?" | "40 líneas de adaptador nuevo. El core nunca toca una API externa." |
| "¿Qué pasa si Open-Meteo se cae en plena demo?" | "Ya pasó en desarrollo. Cae a escenario semilla y lo dice en pantalla — se los podemos mostrar si quieren." |
| "¿De dónde sale el conteo de comercios?" | "OpenStreetMap vía Overpass, 1.533 dentro de las seis zonas de 2.559 consultados. Es un piso, no un censo — subcuenta." |
| "¿Fontumi está conectado de verdad?" | Ver respuesta de la slide 6 — honesto, sin rodeos. |
| "¿Por qué el rango mareal pesa tan poco (0.20) si el pitch es sobre la marea?" | "Porque el rango de Cartagena es de 33 cm — la pleamar sola no inunda nada. Lo que importa es el mar de leva, por eso el oleaje entra con factor 0.6. Si pesara más, el modelo mentiría." |

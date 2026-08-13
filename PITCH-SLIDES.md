---
marp: true
theme: uncover
class: invert
paginate: true
header: '**MAREA** · CTW Hackathon Cartagena Edition 2026'
footer: 'Misión: Cartagena Construye con IA · UNITECNAR'
style: |
  section {
    background-color: #131315;
    color: #ECEAEE;
    font-family: 'Bricolage Grotesque', sans-serif;
  }
  h1, h2, h3 {
    color: #B9A6DD;
  }
  .highlight-red {
    color: #E0574A;
    font-weight: bold;
  }
  .highlight-amber {
    color: #E29472;
    font-weight: bold;
  }
  .highlight-lavender {
    color: #B9A6DD;
    font-weight: bold;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    text-align: left;
  }
  .box {
    background: #1B1B1E;
    border: 1px solid #2B2B2F;
    border-radius: 8px;
    padding: 1.5rem;
  }
---

<!-- Slide 1: Portada -->

# 🌊 **MAREA**

### Sistema de Alerta Temprana de Inundación con Valor Económico Expuesto

**Cartagena Edition · CTW Hackathon 2026**
*Corredor Bocagrande – Centro – Manga*

---

<!-- Slide 2: El Problema -->

# 🚨 El Problema Real

<div class="grid-2">
<div class="box">

### 📊 Datos 2024 (OAGRD & CCV)
- **304** emergencias totales
- **49** por lluvia e inundación (16%)
- **50** canales de drenaje limpiados
- **43%** de insatisfacción con basuras

</div>
<div class="box">

### 🎯 El verdadero cuello de botella
> *El problema de Cartagena no es limpiar por limpiar...*
> 
> **Es saber cuál canal limpiar PRIMERO y con cuánto tiempo de anticipación.**

</div>
</div>

---

<!-- Slide 3: La Física -->

# 🌊 La Tesis Física (Sin Sensores)

### El agua drena por gravedad hacia la bahía. El mar bloquea la salida.

$$IRI = 100 \cdot S_{\text{zona}} \cdot R^{0.7} \cdot (0.55 + 0.20 \cdot D + 0.25 \cdot O)$$

- 🌧️ **$R$ (Lluvia):** Pronóstico *Open-Meteo*. Sin lluvia, IRI = 0.
- 🌊 **$D$ (Bloqueo del Mar):** Marea + oleaje en *Open-Meteo Marine*.
- 🧹 **$O$ (Obstrucción):** Basura en canales reportada por la ciudadanía.
- 📍 **$S$ (Susceptibilidad):** Cota e historial de inundación por barrio.

---

<!-- Slide 4: El Motor Económico -->

# 💰 El Motor Económico (VER)

### ¿Cuánto dinero pierde Cartagena por cada hora bajo agua?

- 🛒 **1.533 comercios reales** contados en tiempo real vía OpenStreetMap (Overpass API).
- 🏨 **Pérdida neta no recuperable ($\eta$):** Noche de hotel cancelada, almuerzo no vendido.
- 🏷️ **Factor Precio por Zona:** Evita sobreestimaciones en zonas residenciales.

> **VER:** Un piso conservador y transparente de pérdida esperada.

---

<!-- Slide 5: Demo Impacto -->

# ⚡ Demo: El "Efecto Pleamar"

<div class="grid-2">
<div class="box">

### 📉 Aguacero en **Bajamar**
- Risk Index (IRI): **65.6 (Naranja)**
- Valor Expuesto (VER): **$188.829.108 / hora**

</div>
<div class="box" style="border-color: #E0574A;">

### 📈 El MISMO Aguacero en **Pleamar**
- Risk Index (IRI): <span class="highlight-red">83.7 (Rojo)</span>
- Valor Expuesto (VER): <span class="highlight-red">$337.301.751 / hora</span>

</div>
</div>

<br>

> 🔥 **+$148 Millones COP por hora de diferencia** causados **exclusivamente por la marea**.

---

<!-- Slide 6: Arquitectura y Fontumi -->

# 🛠️ Arquitectura & Canal Ciudadano

<div class="grid-2">
<div class="box">

### ⚙️ Senior Engineering (Willo Standard)
- **Backend:** Cloudflare Workers + Hono
- **Frontend:** React + MapLibre GL
- **Core Desacoplado:** Consume `Signal` (sin HTTP hardcodeado).
- **Resiliencia:** Cae a modo `degradado: true` sin pantalla en blanco.

</div>
<div class="box">

### 📱 Integración Fontumi (WhatsApp + Voz)
- Reporte de canal tapado por foto en WhatsApp.
- Alertas por voz impulsadas por **iAgents** cuando el IRI entra en banda roja.
- Notificación directa al comerciante.

</div>
</div>

---

<!-- Slide 7: Cierre -->

# 🏆 Los Tres Números del Pitch

<div class="grid-2">
<div class="box text-center">

# **49**
Emergencias por agua en 2024

</div>
<div class="box text-center">

# **43%**
Insatisfacción con basuras que tapan canales

</div>
</div>

<br>

# **1.533**
Comercios protegidos en el mapa económico real

> **MAREA:** De la incertidumbre del clima a decisiones presupuestales y operativas precisas.

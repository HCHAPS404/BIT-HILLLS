import React, { useState, useEffect } from 'react';

interface ModoPresentacionProps {
  onClose: () => void;
  onProbarEscenario?: (id: string) => void;
}

export const ModoPresentacion: React.FC<ModoPresentacionProps> = ({ onClose, onProbarEscenario }) => {
  const [slide, setSlide] = useState(0);
  const [mostrarNotas, setMostrarNotas] = useState(true);
  const [simMarea, setSimMarea] = useState<'bajamar' | 'pleamar'>('bajamar');

  // Cronómetro de 3 minutos
  const [segundos, setSegundos] = useState(180);
  const [corriendo, setCorriendo] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (corriendo && segundos > 0) {
      interval = setInterval(() => setSegundos((s) => s - 1), 1000);
    } else if (segundos === 0) {
      setCorriendo(false);
    }
    return () => clearInterval(interval);
  }, [corriendo, segundos]);

  // Teclado para navegar slides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setSlide((s) => Math.min(s + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSlide((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const min = Math.floor(segundos / 60);
  const seg = (segundos % 60).toString().padStart(2, '0');

  const slides = [
    // Slide 1: Portada
    {
      titulo: 'MAREA',
      subtitulo: 'Sistema de Alerta Temprana de Inundación con Valor Económico Expuesto',
      tipo: 'portada',
      contenido: (
        <div style={{ textAlign: 'center', marginTop: 'var(--esp-6)' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--acento)', fontFamily: 'var(--display)', letterSpacing: '-0.04em' }}>
            MAREA
          </div>
          <div style={{ fontSize: 'var(--texto-lg)', color: 'var(--papel-tenue)', marginTop: 'var(--esp-3)' }}>
            Corredor Turístico de Cartagena · Bocagrande / Centro / Manga
          </div>
          <div style={{ display: 'inline-flex', gap: 'var(--esp-3)', marginTop: 'var(--esp-6)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="badge badge-vivo">CTW Hackathon 2026</span>
            <span className="badge badge-sin-calibrar">Misión: Cartagena Construye con IA</span>
            <span className="badge badge-simulado">UNITECNAR</span>
          </div>
        </div>
      ),
      nota: 'HOOOK (0:00-0:30): Saluda seguro. Plantea la tesis principal: "El problema no es limpiar por limpiar, es saber cuál canal limpiar primero y con cuánto tiempo de anticipación".',
    },

    // Slide 2: El Problema
    {
      titulo: '🚨 El Problema Real',
      subtitulo: 'Datos duros de Cartagena (OAGRD & Cartagena Cómo Vamos)',
      tipo: 'tarjetas',
      contenido: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-5)', marginTop: 'var(--esp-5)' }}>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 'var(--esp-3)' }}>Cifras de Ciudad 2024</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 'var(--texto-md)', lineHeight: 1.8 }}>
              <li>🔴 <strong>304 emergencias</strong> reportadas por OAGRD.</li>
              <li>🌊 <strong>49 por lluvias e inundaciones</strong> (16% del total).</li>
              <li>🧹 <strong>50 canales limpiados</strong> en la ciudad.</li>
              <li>🚯 <strong>43% de insatisfacción</strong> por basuras en calles.</li>
            </ul>
          </div>

          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)', borderLeft: '3px solid var(--alerta)' }}>
            <div className="rotulo" style={{ color: 'var(--alerta)', marginBottom: 'var(--esp-3)' }}>El Cuello de Botella Operativo</div>
            <p style={{ fontSize: 'var(--texto-md)', lineHeight: 1.6, color: 'var(--papel)' }}>
              "En 2024 se limpiaron 50 canales. Las cuadrillas trabajan, pero las decisiones hoy son reactivas."
            </p>
            <p style={{ fontSize: 'var(--texto-md)', fontWeight: 700, color: 'var(--acento)', marginTop: 'var(--esp-4)' }}>
              La pregunta clave: ¿Cuál canal intervenir PRIMERO y con cuánto tiempo de anticipación?
            </p>
          </div>
        </div>
      ),
      nota: 'EXPLICACIÓN (0:30-1:15): Haz énfasis en que limpiar a ciegas genera emergencias evitables. MAREA pasa de la reacción a la anticipación.',
    },

    // Slide 3: La Tesis Física
    {
      titulo: '🌊 Tesis Física: El Efecto Lavamanos',
      subtitulo: 'Sin un solo sensor físico instalado en los canales',
      tipo: 'formula',
      contenido: (
        <div style={{ marginTop: 'var(--esp-5)' }}>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)', textAlign: 'center', background: 'var(--abismo)' }}>
            <div className="rotulo" style={{ color: 'var(--acento)', fontSize: 'var(--texto-xs)' }}>ÍNDICE DE RIESGO DE INUNDACIÓN (IRI)</div>
            <div className="num" style={{ fontSize: 'var(--texto-xl)', fontWeight: 800, color: 'var(--papel)', marginBlock: 'var(--esp-3)' }}>
              IRI = 100 · S · R<sup>0.7</sup> · (0.55 + 0.20·D + 0.25·O)
            </div>
            <div className="rotulo" style={{ textTransform: 'none', color: 'var(--papel-tenue)' }}>
              *Si R (lluvia) es 0, IRI = 0. Tesis física verificada.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--esp-3)', marginTop: 'var(--esp-5)' }}>
            <div className="panel" style={{ padding: 'var(--esp-3)', textAlign: 'center' }}>
              <div className="rotulo" style={{ color: 'var(--acento)' }}>R · Lluvia</div>
              <div style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--esp-2)', color: 'var(--papel-tenue)' }}>Pronóstico h+72 via Open-Meteo</div>
            </div>
            <div className="panel" style={{ padding: 'var(--esp-3)', textAlign: 'center' }}>
              <div className="rotulo" style={{ color: 'var(--alerta)' }}>D · Marea</div>
              <div style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--esp-2)', color: 'var(--papel-tenue)' }}>Nivel mar + oleaje Open-Meteo Marine</div>
            </div>
            <div className="panel" style={{ padding: 'var(--esp-3)', textAlign: 'center' }}>
              <div className="rotulo" style={{ color: 'var(--vigila)' }}>O · Obstrucción</div>
              <div style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--esp-2)', color: 'var(--papel-tenue)' }}>Reportes por basura en canal</div>
            </div>
            <div className="panel" style={{ padding: 'var(--esp-3)', textAlign: 'center' }}>
              <div className="rotulo" style={{ color: 'var(--seco)' }}>S · Susceptibilidad</div>
              <div style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--esp-2)', color: 'var(--papel-tenue)' }}>Cota topográfica e historial</div>
            </div>
          </div>
        </div>
      ),
      nota: 'ANALOGÍA (1:15-1:45): Usa la analogía del lavamanos: la lluvia es la llave abierta y el mar es el tapón del desagüe.',
    },

    // Slide 4: El Motor Económico
    {
      titulo: '💰 Motor Económico: Valor Expuesto en Riesgo (VER)',
      subtitulo: 'Cuantificando la pérdida monetaria esperada por hora',
      tipo: 'economico',
      contenido: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-5)', marginTop: 'var(--esp-5)' }}>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 'var(--esp-3)' }}>1.533 Comercios Mapeados</div>
            <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--papel)', lineHeight: 1.6 }}>
              Conteo real georreferenciado extraído vía <strong>OpenStreetMap (Overpass API)</strong> en las 6 zonas críticas.
            </p>
            <div style={{ display: 'flex', gap: 'var(--esp-3)', marginTop: 'var(--esp-4)' }}>
              <div className="badge badge-simulado">🏨 Hoteles (15% neto)</div>
              <div className="badge badge-simulado">🍽️ Restaurantes (85% neto)</div>
            </div>
          </div>

          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--alerta)', marginBottom: 'var(--esp-3)' }}>Pérdidas Reales No Recuperables (η)</div>
            <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--papel)', lineHeight: 1.6 }}>
              Diferenciamos el ingreso diferido de la <strong>pérdida directa no recuperable</strong>. Un almuerzo o una noche no vendida hoy no se recuperan mañana.
            </p>
            <div className="rotulo" style={{ marginTop: 'var(--esp-4)', color: 'var(--acento)', textTransform: 'none' }}>
              Piso conservador de pérdida monetaria real.
            </div>
          </div>
        </div>
      ),
      nota: 'VALOR COMERCIAL (1:45-2:15): Muestra al jurado que entiendes el negocio real de Cartagena (turismo, hoteles, restaurantes).',
    },

    // Slide 5: Simulador Interactivo "Efecto Pleamar"
    {
      titulo: '⚡ Demo Interactiva: El "Efecto Pleamar"',
      subtitulo: 'Prueba cambiar la marea manteniendo exactamente la misma lluvia',
      tipo: 'simulador',
      contenido: (
        <div className="panel milimetrado" style={{ padding: 'var(--esp-6)', marginTop: 'var(--esp-4)', textAlign: 'center' }}>
          <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 'var(--esp-3)' }}>
            SELECCIONA EL ESTADO DE LA MAREA:
          </div>

          <div style={{ display: 'inline-flex', gap: 'var(--esp-3)', marginBottom: 'var(--esp-6)' }}>
            <button
              onClick={() => setSimMarea('bajamar')}
              style={{
                fontSize: 'var(--texto-md)',
                padding: 'var(--esp-3) var(--esp-6)',
                background: simMarea === 'bajamar' ? 'var(--abismo)' : 'transparent',
                borderColor: simMarea === 'bajamar' ? 'var(--alerta)' : 'var(--sonda)',
                color: simMarea === 'bajamar' ? 'var(--alerta)' : 'var(--papel-tenue)',
                fontWeight: 700,
              }}>
              🌊 BAJAMAR
            </button>
            <button
              onClick={() => setSimMarea('pleamar')}
              style={{
                fontSize: 'var(--texto-md)',
                padding: 'var(--esp-3) var(--esp-6)',
                background: simMarea === 'pleamar' ? 'var(--critico)' : 'transparent',
                borderColor: 'var(--critico)',
                color: '#fff',
                fontWeight: 800,
              }}>
              🔴 PLEAMAR
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-5)', textAlign: 'left' }}>
            <div className="panel" style={{ padding: 'var(--esp-4)', borderColor: simMarea === 'pleamar' ? 'var(--critico)' : 'var(--alerta)' }}>
              <div className="rotulo" style={{ color: simMarea === 'pleamar' ? 'var(--critico)' : 'var(--alerta)' }}>
                NIVEL DE RIESGO (IRI)
              </div>
              <div className="num" style={{ fontSize: '2.5rem', fontWeight: 800, color: simMarea === 'pleamar' ? 'var(--critico)' : 'var(--alerta)' }}>
                {simMarea === 'bajamar' ? '65.6' : '83.7'}
                <span style={{ fontSize: 'var(--texto-sm)', fontWeight: 400 }}> / 100</span>
              </div>
              <div className="rotulo" style={{ color: simMarea === 'pleamar' ? 'var(--critico)' : 'var(--alerta)', textTransform: 'none' }}>
                BANDA: {simMarea === 'bajamar' ? 'NARANJA (ALERTA)' : 'ROJO (CRÍTICO)'}
              </div>
            </div>

            <div className="panel" style={{ padding: 'var(--esp-4)', borderColor: simMarea === 'pleamar' ? 'var(--critico)' : 'var(--alerta)' }}>
              <div className="rotulo" style={{ color: 'var(--acento)' }}>VALOR EXPUESTO EN RIESGO (VER)</div>
              <div className="num" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--papel)' }}>
                {simMarea === 'bajamar' ? '$188.829.108' : '$337.301.751'}
                <span style={{ fontSize: 'var(--texto-xs)', color: 'var(--papel-tenue)' }}> COP/h</span>
              </div>
              <div className="rotulo" style={{ color: 'var(--alerta)', textTransform: 'none' }}>
                {simMarea === 'bajamar' ? 'Pérdida moderada por hora' : '🔥 +$148 MILLONES COP / hora MÁS'}
              </div>
            </div>
          </div>
        </div>
      ),
      nota: 'MOMENTO CLAVE (2:15-2:45): Haz clic en "PLEAMAR" y di fuertemente: "+$148 Millones de pesos por hora con la misma lluvia, solo porque cambió la marea".',
    },

    // Slide 6: Arquitectura y Fontumi
    {
      titulo: '🛠️ Arquitectura & Canal Fontumi',
      subtitulo: 'Serverless, resiliencia senior e integración conversacional',
      tipo: 'tech',
      contenido: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-5)', marginTop: 'var(--esp-5)' }}>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 'var(--esp-3)' }}>Stack Serverless (Willo Standard)</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 'var(--texto-sm)', lineHeight: 1.8 }}>
              <li>⚡ <strong>Cloudflare Workers + Hono:</strong> API ultrarrápida.</li>
              <li>🗺️ <strong>Vite + React + MapLibre:</strong> HUD náutico.</li>
              <li>🛡️ <strong>Core Desacoplado:</strong> Puras señales `Signal`.</li>
              <li>🔄 <strong>Fallback Resiliente:</strong> `degradado: true`.</li>
            </ul>
          </div>

          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--alerta)', marginBottom: 'var(--esp-3)' }}>Integración Fontumi (WhatsApp + Voz)</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 'var(--texto-sm)', lineHeight: 1.8 }}>
              <li>📸 <strong>Reporte Ciudadano:</strong> Foto de canal tapado por WhatsApp.</li>
              <li>📞 <strong>iAgents Voz:</strong> Llamada automática a comercios en banda roja.</li>
              <li>🔔 <strong>Alertas Segmentadas:</strong> Por geolocalización.</li>
            </ul>
          </div>
        </div>
      ),
      nota: 'ARQUITECTURA (2:45-3:00): Menciona la resiliencia y cómo Fontumi cierra el ciclo conversacional con los ciudadanos y comerciantes.',
    },
  ];

  const currentSlide = slides[slide];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--abismo)',
        color: 'var(--papel)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--display)',
      }}>
      {/* Barra superior de controles del orador */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--esp-3) var(--esp-6)',
          borderBottom: 'var(--linea)',
          background: 'var(--profundo)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-4)' }}>
          <span style={{ fontWeight: 800, fontSize: 'var(--texto-lg)', color: 'var(--acento)' }}>MAREA PITCH</span>
          <span className="rotulo">SLIDE {slide + 1} / {slides.length}</span>
        </div>

        {/* Cronómetro de 3 minutos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-3)' }}>
          <div
            className="num"
            style={{
              fontSize: 'var(--texto-lg)',
              fontWeight: 700,
              color: segundos < 30 ? 'var(--critico)' : 'var(--papel)',
            }}>
            ⏱️ {min}:{seg}
          </div>
          <button
            onClick={() => setCorriendo(!corriendo)}
            style={{ fontSize: 'var(--texto-xs)', padding: 'var(--esp-2) var(--esp-4)' }}>
            {corriendo ? 'PAUSAR' : 'INICIAR TIMING'}
          </button>
          <button
            onClick={() => { setSegundos(180); setCorriendo(false); }}
            style={{ fontSize: 'var(--texto-xs)', padding: 'var(--esp-2) var(--esp-4)' }}>
            RESET
          </button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--esp-3)', alignItems: 'center' }}>
          <button
            onClick={() => setMostrarNotas(!mostrarNotas)}
            style={{
              fontSize: 'var(--texto-xs)',
              padding: 'var(--esp-2) var(--esp-4)',
              borderColor: mostrarNotas ? 'var(--acento)' : 'var(--sonda)',
            }}>
            {mostrarNotas ? '📝 OCULTAR NOTAS' : '📝 MOSTRAR NOTAS'}
          </button>
          <button
            onClick={onClose}
            style={{
              fontSize: 'var(--texto-xs)',
              padding: 'var(--esp-2) var(--esp-4)',
              borderColor: 'var(--critico)',
              color: 'var(--critico)',
            }}>
            ✕ CERRAR (ESC)
          </button>
        </div>
      </header>

      {/* Cuerpo principal del Slide */}
      <main
        style={{
          flex: 1,
          padding: 'var(--esp-8)',
          maxWidth: 1100,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, color: 'var(--papel)' }}>
            {currentSlide.titulo}
          </h2>
          <div className="rotulo" style={{ fontSize: 'var(--texto-sm)', marginTop: 'var(--esp-2)', color: 'var(--papel-tenue)' }}>
            {currentSlide.subtitulo}
          </div>
        </div>

        {currentSlide.contenido}
      </main>

      {/* Panel de notas del orador */}
      {mostrarNotas && (
        <div
          style={{
            background: 'var(--profundo)',
            borderTop: 'var(--linea)',
            padding: 'var(--esp-4) var(--esp-6)',
            fontSize: 'var(--texto-sm)',
            color: 'var(--acento)',
          }}>
          <strong>🗣️ GUÍA DEL ORADOR:</strong> {currentSlide.nota}
        </div>
      )}

      {/* Barra de navegación inferior */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--esp-3) var(--esp-6)',
          borderTop: 'var(--linea)',
          background: 'var(--profundo)',
        }}>
        <button
          disabled={slide === 0}
          onClick={() => setSlide((s) => Math.max(s - 1, 0))}
          style={{ fontSize: 'var(--texto-sm)', padding: 'var(--esp-3) var(--esp-5)' }}>
          ← ANTERIOR
        </button>

        <div style={{ display: 'flex', gap: 'var(--esp-2)' }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: i === slide ? 'var(--acento)' : 'var(--sonda)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        <button
          disabled={slide === slides.length - 1}
          onClick={() => setSlide((s) => Math.min(s + 1, slides.length - 1))}
          style={{ fontSize: 'var(--texto-sm)', padding: 'var(--esp-3) var(--esp-5)', borderColor: 'var(--acento)' }}>
          SIGUIENTE →
        </button>
      </footer>
    </div>
  );
};

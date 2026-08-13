import React, { useState, useEffect } from 'react';

interface ModoPresentacionProps {
  onClose: () => void;
  onProbarEscenario?: (id: string) => void;
}

export const ModoPresentacion: React.FC<ModoPresentacionProps> = ({ onClose, onProbarEscenario }) => {
  const [slide, setSlide] = useState(0);
  const [mostrarNotas, setMostrarNotas] = useState(true);
  const [simMarea, setSimMarea] = useState<'bajamar' | 'pleamar'>('bajamar');

  // Cronómetro de 4 minutos (guion en PITCH-GUION.md)
  const [segundos, setSegundos] = useState(240);
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
    {
      titulo: 'MAREA',
      subtitulo: 'Alerta temprana de inundación · 24 a 72 horas · sin un solo sensor instalado',
      tipo: 'portada',
      contenido: (
        <div style={{ textAlign: 'center', marginTop: 'var(--esp-6)' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--acento)', fontFamily: 'var(--display)', letterSpacing: '-0.04em' }}>
            MAREA
          </div>
          <div style={{ fontSize: 'var(--texto-lg)', color: 'var(--papel-tenue)', marginTop: 'var(--esp-3)' }}>
            Corredor Bocagrande – Centro – Manga · Cartagena
          </div>
          <div style={{ display: 'inline-flex', gap: 'var(--esp-3)', marginTop: 'var(--esp-6)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="badge badge-vivo">CTW Hackathon 2026</span>
            <span className="badge badge-sin-calibrar">sin calibrar</span>
            <span className="badge badge-simulado">UNITECNAR</span>
          </div>
        </div>
      ),
      nota: 'PORTADA (10s): «Predecimos qué zonas se van a inundar, 24 a 72 horas, sin un solo sensor instalado.» Silencio 2–3 s después de esa frase.',
    },
    {
      titulo: 'El problema',
      subtitulo: 'OAGRD y Cartagena Cómo Vamos · 2024',
      tipo: 'tarjetas',
      contenido: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-5)', marginTop: 'var(--esp-5)' }}>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 'var(--esp-3)' }}>Cifras 2024</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 'var(--texto-md)', lineHeight: 1.8 }}>
              <li><strong>304</strong> emergencias en la ciudad</li>
              <li><strong>49</strong> por lluvia e inundación</li>
              <li><strong>50</strong> canales limpiados</li>
              <li><strong>43 %</strong> insatisfechos con las basuras</li>
            </ul>
          </div>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--alerta)', marginBottom: 'var(--esp-3)' }}>El cuello de botella</div>
            <p className="prosa" style={{ margin: 0 }}>
              El problema nunca fue limpiar. Fue saber cuál primero, y con cuánto tiempo. Hoy esa decisión se toma a ojo, después de que ya llovió.
            </p>
          </div>
        </div>
      ),
      nota: 'PROBLEMA (30s): 304, 49, 50, 43 %. Si preguntan quién lo pidió: el 43 % de insatisfacción con basuras (EPC 2024) — esa basura tapa los canales.',
    },
    {
      titulo: 'La física, sin sensores',
      subtitulo: 'El agua drena por gravedad. El mar tapa la salida.',
      tipo: 'formula',
      contenido: (
        <div style={{ marginTop: 'var(--esp-5)' }}>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)', textAlign: 'center', backgroundColor: 'var(--abismo)' }}>
            <div className="rotulo" style={{ color: 'var(--acento)' }}>IRI</div>
            <div className="num" style={{ fontSize: 'var(--texto-xl)', fontWeight: 800, marginBlock: 'var(--esp-3)' }}>
              IRI = 100 · S · R<sup>0.7</sup> · (0.55 + 0.20·D + 0.25·O)
            </div>
            <div className="prosa-nota">Sin lluvia, el índice es cero. Es multiplicativo.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--esp-3)', marginTop: 'var(--esp-5)' }}>
            <div className="panel" style={{ padding: 'var(--esp-3)', textAlign: 'center' }}>
              <div className="rotulo" style={{ color: 'var(--alerta)' }}>R · lluvia</div>
              <div className="prosa-nota" style={{ marginTop: 'var(--esp-2)' }}>Open-Meteo. El disparador.</div>
            </div>
            <div className="panel" style={{ padding: 'var(--esp-3)', textAlign: 'center' }}>
              <div className="rotulo" style={{ color: 'var(--marea)' }}>D · mar</div>
              <div className="prosa-nota" style={{ marginTop: 'var(--esp-2)' }}>Marea + oleaje. Tapa el drenaje.</div>
            </div>
            <div className="panel" style={{ padding: 'var(--esp-3)', textAlign: 'center' }}>
              <div className="rotulo" style={{ color: 'var(--vigila)' }}>O · canal</div>
              <div className="prosa-nota" style={{ marginTop: 'var(--esp-2)' }}>Basura. La reportan los vecinos.</div>
            </div>
            <div className="panel" style={{ padding: 'var(--esp-3)', textAlign: 'center' }}>
              <div className="rotulo" style={{ color: 'var(--seco)' }}>S · zona</div>
              <div className="prosa-nota" style={{ marginTop: 'var(--esp-2)' }}>Cota e historial del barrio.</div>
            </div>
          </div>
        </div>
      ),
      nota: 'FÍSICA (45s): Recorre R, D, O, S de izquierda a derecha. Cierra: Open-Meteo y OSM. Cero hardware.',
    },
    {
      titulo: 'El motor económico',
      subtitulo: 'Un índice no mueve a nadie. Lo que mueve es la plata.',
      tipo: 'economico',
      contenido: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-5)', marginTop: 'var(--esp-5)' }}>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 'var(--esp-3)' }}>1.533 comercios reales</div>
            <p className="prosa" style={{ margin: 0 }}>
              Conteo en las seis zonas por OpenStreetMap. No es una estimación: es un piso.
            </p>
          </div>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--alerta)', marginBottom: 'var(--esp-3)' }}>Lo que no se recupera</div>
            <p className="prosa" style={{ margin: 0 }}>
              Un hotel pierde el desayuno, no la noche ya pagada. Un restaurante pierde el almuerzo completo. Esa diferencia está en el modelo.
            </p>
          </div>
        </div>
      ),
      nota: 'PLATA (30s): 1.533 comercios. Hotel ≠ restaurante. VER es un piso, no una pérdida ya ocurrida.',
    },
    {
      titulo: 'El efecto pleamar',
      subtitulo: 'Mismo aguacero, mismo canal. Solo cambia la marea.',
      tipo: 'simulador',
      contenido: (
        <div className="panel milimetrado" style={{ padding: 'var(--esp-6)', marginTop: 'var(--esp-4)', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', gap: 'var(--esp-3)', marginBottom: 'var(--esp-6)' }}>
            <button
              type="button"
              onClick={() => {
                setSimMarea('bajamar');
                onProbarEscenario?.('aguacero_marea_baja');
              }}
              style={{
                fontSize: 'var(--texto-md)',
                padding: 'var(--esp-3) var(--esp-6)',
                backgroundColor: simMarea === 'bajamar' ? 'var(--abismo)' : 'transparent',
                color: simMarea === 'bajamar' ? 'var(--alerta)' : 'var(--papel-tenue)',
                fontWeight: 700,
              }}
            >
              BAJAMAR
            </button>
            <button
              type="button"
              onClick={() => {
                setSimMarea('pleamar');
                onProbarEscenario?.('aguacero_marea_alta');
              }}
              style={{
                fontSize: 'var(--texto-md)',
                padding: 'var(--esp-3) var(--esp-6)',
                backgroundColor: simMarea === 'pleamar' ? 'var(--critico)' : 'transparent',
                color: simMarea === 'pleamar' ? 'var(--papel)' : 'var(--critico)',
                fontWeight: 800,
              }}
            >
              PLEAMAR
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-5)', textAlign: 'left' }}>
            <div className="panel" style={{ padding: 'var(--esp-4)' }}>
              <div className="rotulo" style={{ color: simMarea === 'pleamar' ? 'var(--critico)' : 'var(--alerta)' }}>IRI</div>
              <div className="num" style={{ fontSize: '2.5rem', fontWeight: 800, color: simMarea === 'pleamar' ? 'var(--critico)' : 'var(--alerta)' }}>
                {simMarea === 'bajamar' ? '65.6' : '83.7'}
                <span style={{ fontSize: 'var(--texto-sm)', fontWeight: 400 }}> / 100</span>
              </div>
              <div className="prosa-nota">{simMarea === 'bajamar' ? 'alerta' : 'crítico'}</div>
            </div>
            <div className="panel" style={{ padding: 'var(--esp-4)' }}>
              <div className="rotulo" style={{ color: 'var(--acento)' }}>plata en riesgo</div>
              <div className="num" style={{ fontSize: '2rem', fontWeight: 800 }}>
                {simMarea === 'bajamar' ? '$188.829.108' : '$337.301.751'}
              </div>
              <div className="prosa-nota" style={{ color: 'var(--alerta)' }}>
                {simMarea === 'bajamar' ? 'mismo aguacero, mar bajo' : '+$148 millones solo por la marea'}
              </div>
            </div>
          </div>
        </div>
      ),
      nota: 'DEMO (45s): Deja respirar los dos números. «148 millones de diferencia, causados exclusivamente por la marea.» Si hay wifi: cambia a marea-drq.pages.dev y mueve el slider.',
    },
    {
      titulo: 'Arquitectura y honestidad',
      subtitulo: 'El core no sabe que Open-Meteo existe. Fontumi se dice en voz alta.',
      tipo: 'tech',
      contenido: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-5)', marginTop: 'var(--esp-5)' }}>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--acento)', marginBottom: 'var(--esp-3)' }}>Ingeniería</div>
            <p className="prosa" style={{ margin: 0 }}>
              Cloudflare Workers + Hono. React + MapLibre. Si cambia la fuente o la ciudad: 40 líneas de adaptador, cero cambios al core. Si una fuente se cae, no hay pantalla en blanco: cae a escenario y lo declara.
            </p>
          </div>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="rotulo" style={{ color: 'var(--alerta)', marginBottom: 'var(--esp-3)' }}>Fontumi</div>
            <p className="prosa" style={{ margin: 0 }}>
              WhatsApp y voz ya están construidos y probados en consola. La cuenta real está en pausa por credenciales, no por diseño. Cuando lleguen: una variable de entorno, no una reescritura.
            </p>
          </div>
        </div>
      ),
      nota: 'ARQUITECTURA (40s): Adaptador / degradado. Fontumi: honesto, sin rodeos. Misma lógica que el sello SIN CALIBRAR.',
    },
    {
      titulo: 'Tres números',
      subtitulo: 'Cuál primero, y con cuánto tiempo.',
      tipo: 'cierre',
      contenido: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--esp-5)', marginTop: 'var(--esp-6)', textAlign: 'center' }}>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="num" style={{ fontSize: 'var(--texto-2xl)', fontWeight: 800, color: 'var(--alerta)' }}>49</div>
            <div className="prosa-nota">emergencias por agua en 2024</div>
          </div>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="num" style={{ fontSize: 'var(--texto-2xl)', fontWeight: 800, color: 'var(--vigila)' }}>43 %</div>
            <div className="prosa-nota">insatisfechos con las basuras que tapan los canales</div>
          </div>
          <div className="panel milimetrado" style={{ padding: 'var(--esp-5)' }}>
            <div className="num" style={{ fontSize: 'var(--texto-2xl)', fontWeight: 800, color: 'var(--acento)' }}>1.533</div>
            <div className="prosa-nota">comercios en el mapa, en tiempo real</div>
          </div>
        </div>
      ),
      nota: 'CIERRE (20s): Los tres números. «MAREA no reemplaza la limpieza. Le dice a la ciudad cuál primero, y con cuánto tiempo.» Gracias. Cierra en silencio.',
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

        {/* Cronómetro de 4 minutos */}
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
            onClick={() => { setSegundos(240); setCorriendo(false); }}
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
          padding: 'var(--esp-6)',
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

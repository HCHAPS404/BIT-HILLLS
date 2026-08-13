/**
 * Definición de jerga, accesible por teclado.
 * No usa `title`: en móvil no existe. Es un botón que abre un recuadro,
 * se cierra con Escape o clic fuera, y restaura el foco.
 */

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

interface Props {
  termino: ReactNode;
  titulo: string;
  children: ReactNode;
}

export function Definicion({ termino, titulo, children }: Props) {
  const [abierta, setAbierta] = useState(false);
  const uid = useId();
  const panelId = `${uid}-def`;
  const btn = useRef<HTMLButtonElement>(null);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setAbierta(false);
        btn.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (caja.current?.contains(t) || btn.current?.contains(t)) return;
      setAbierta(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [abierta]);

  return (
    <span className="definicion">
      <button
        ref={btn}
        type="button"
        className="termino"
        aria-expanded={abierta}
        aria-controls={panelId}
        onClick={() => setAbierta((v) => !v)}
      >
        {termino}
      </button>
      {abierta && (
        <div
          ref={caja}
          id={panelId}
          role="note"
          className="definicion-panel"
        >
          <div style={{ fontSize: 'var(--texto-xs)', fontFamily: 'var(--mono)', color: 'var(--acento)', marginBottom: 'var(--esp-2)', lineHeight: 1.4 }}>
            {titulo}
          </div>
          <div className="prosa" style={{ fontSize: 'var(--texto-sm)' }}>
            {children}
          </div>
        </div>
      )}
    </span>
  );
}

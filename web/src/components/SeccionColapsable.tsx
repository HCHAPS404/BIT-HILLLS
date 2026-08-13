/**
 * Divulgación progresiva: lo de experto existe, no de entrada.
 * Botón nativo + aria-expanded. Colapsado por defecto.
 */

import { useState, type ReactNode } from 'react';

interface Props {
  id: string;
  titulo: string;
  resumen?: string;
  children: ReactNode;
  defaultAbierta?: boolean;
  className?: string;
  tituloColor?: string;
}

export function SeccionColapsable({ id, titulo, resumen, children, defaultAbierta = false, className, tituloColor = 'var(--acento)' }: Props) {
  const [abierta, setAbierta] = useState(defaultAbierta);
  const btnId = `${id}-btn`;

  return (
    <div className={['panel', className].filter(Boolean).join(' ')} style={{ padding: 'var(--esp-6)' }}>
      <button
        type="button"
        id={btnId}
        className="cabecera-colapso"
        aria-expanded={abierta}
        aria-controls={id}
        onClick={() => setAbierta((v) => !v)}
      >
        <span className="rotulo" style={{ color: tituloColor }}>{titulo}</span>
        <span className="rotulo">{abierta ? 'cerrar' : 'abrir'}</span>
      </button>
      {!abierta && resumen && (
        <div className="prosa-nota" style={{ marginTop: 'var(--esp-3)' }}>
          {resumen}
        </div>
      )}
      {abierta && (
        <div id={id} role="region" aria-labelledby={btnId} style={{ marginTop: 'var(--esp-5)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

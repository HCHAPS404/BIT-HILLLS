#!/usr/bin/env python3
"""
Calibración del IRI contra eventos reales — LISTO PARA CORRER, sin datos.

Por qué existe este script y no un notebook con resultados: no hay un
dataset abierto y estructurado de la OAGRD (verificado — solo hay
noticias y comunicados de prensa, no incidentes con fecha/hora/ubicación
descargables). Inventar una calibración con datos falsos sería peor que
no calibrar — el README ya declara el IRI como "índice de plausibilidad
ordenada, no una probabilidad" precisamente por esto.

Este script SÍ hace el trabajo real de calibración en cuanto exista el
CSV de entrada. Ajusta una regresión logística de los mismos cuatro
términos del motor (R, D, O, S) contra si hubo inundación reportada,
para reemplazar los pesos fijos (0.20, 0.25, R^0.7) por coeficientes
aprendidos.

## Cómo conseguir los datos de entrada

1. **Eventos reales (columna `inundo`):** derecho de petición a la OAGRD
   (mecanismo legal en Colombia, respuesta obligatoria en ~15 días
   hábiles) pidiendo el registro de emergencias por inundación de 2024
   con fecha, hora aproximada y barrio/zona. Alternativa más lenta:
   Cartagena Cómo Vamos (cartagenacomovamos.org) puede tener el detalle
   agregado detrás del resumen de 49 emergencias que cita el README.

2. **R, D, O, S por evento:** para cada fila del CSV de eventos, buscar
   el histórico de lluvia (Open-Meteo Historical Forecast API, gratis,
   sin key) y marea (Open-Meteo Marine, histórico) para esa fecha/hora
   y calcular R/D con las mismas fórmulas de `api/src/core/risk.ts`.
   `O` y `S` salen de `api/src/core/zonas.ts` (estado de la zona en esa
   fecha — para 2024 probablemente hay que asumir el `obstruccion_base`
   actual, no hay forma de saber el estado histórico del canal).

## Uso

    pip install pandas scikit-learn
    python3 scripts/calibrar_iri.py eventos.csv

Formato esperado de `eventos.csv` (una fila por evento-zona-hora):

    zona_id,fecha,R,D,O,S,inundo
    centro,2024-04-15T14:00,0.81,0.60,0.70,0.75,1
    centro,2024-04-16T09:00,0.10,0.20,0.70,0.75,0
    bocagrande,2024-05-02T18:00,0.93,1.00,0.45,0.90,1
    ...

`inundo`: 1 si hubo inundación reportada en esa zona/hora, 0 si no.
Incluir suficientes negativos (horas sin inundación) — sin eso el
modelo no aprende nada, solo memoriza que siempre llueve.
"""

import sys
import argparse


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('csv', help='CSV de eventos con columnas: zona_id,fecha,R,D,O,S,inundo')
    parser.add_argument('--min-eventos', type=int, default=30, help='Mínimo de filas para calibrar en serio (default: 30)')
    args = parser.parse_args()

    try:
        import pandas as pd
        from sklearn.linear_model import LogisticRegression
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import roc_auc_score, classification_report
    except ImportError:
        sys.exit(
            "Faltan dependencias. Corre:\n"
            "  pip install pandas scikit-learn\n"
        )

    df = pd.read_csv(args.csv)

    requeridas = {'zona_id', 'fecha', 'R', 'D', 'O', 'S', 'inundo'}
    faltantes = requeridas - set(df.columns)
    if faltantes:
        sys.exit(f"Faltan columnas en el CSV: {faltantes}")

    if len(df) < args.min_eventos:
        print(
            f"⚠️  Solo {len(df)} filas (mínimo recomendado: {args.min_eventos}). "
            "El resultado va a ser ruido, no una calibración — "
            "úsalo solo para probar que el script corre, no para producción.\n"
        )

    if df['inundo'].nunique() < 2:
        sys.exit(
            "El CSV solo tiene una clase (todo 1 o todo 0) en 'inundo'. "
            "Hace falta mezclar horas CON y SIN inundación reportada."
        )

    # Mismos cuatro términos del motor — el objetivo es reemplazar los
    # pesos fijos de risk.ts (0.20, 0.25, R^0.7) por estos coeficientes.
    X = df[['R', 'D', 'O', 'S']]
    y = df['inundo']

    if len(df) >= args.min_eventos:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    else:
        X_train, X_test, y_train, y_test = X, X, y, y  # sin split real, muy pocos datos

    modelo = LogisticRegression()
    modelo.fit(X_train, y_train)

    print("=== Coeficientes (reemplazan los pesos fijos de risk.ts) ===")
    for nombre, coef in zip(['R', 'D', 'O', 'S'], modelo.coef_[0]):
        print(f"  {nombre}: {coef:+.4f}")
    print(f"  intercepto: {modelo.intercept_[0]:+.4f}")

    if len(X_test) > 0 and y_test.nunique() > 1:
        probs = modelo.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, probs)
        print(f"\n=== Validación (holdout) ===")
        print(f"AUC-ROC: {auc:.3f}  (0.5 = adivinar, 1.0 = perfecto)")
        print(classification_report(y_test, modelo.predict(X_test)))

    print(
        "\nSiguiente paso: llevar estos coeficientes a api/src/core/risk.ts "
        "y api/src/core/params.ts, y quitar (o reformular) el badge "
        "'SIN CALIBRAR · v0.1' en la UI una vez el AUC sea razonable "
        "(>0.7 como piso informal, no una regla dura)."
    )


if __name__ == '__main__':
    main()

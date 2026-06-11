# Helecho

Editor de escritorio nativo para apuntes matemáticos. Sin LaTeX, sin comandos. El usuario hace clic en un símbolo y se inserta. Se guarda como Markdown enriquecido y se exporta a PDF limpio.

![Pantalla de inicio](helecho-ui-design/public/inicio.png)

---

## Características principales

- **Editor visual** — inserta símbolos matemáticos con un clic, sin escribir LaTeX
- **Cuadernillos** — organiza tus apuntes en pestañas independientes
- **Multitarea en una sola página** — múltiples paneles activos simultáneamente
- **Exportación a PDF** — salida limpia directamente desde la app
- **Guardado en Markdown** — formato abierto, legible fuera de la app

## Evidencia de paneles

![Multitarea en una sola pantalla](helecho-ui-design/public/multitarea%20en%20una%20sola%20pantalla.png)

Los paneles funcionan de forma independiente dentro de una misma ventana, permitiendo trabajar con múltiples cuadernillos al mismo tiempo.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Shell | Electron + electron-vite |
| Frontend | React + TypeScript |
| Editor | TipTap |
| Matemáticas | KaTeX |
| Estilos | Tailwind CSS |
| Diagramas | Mermaid |

---

## Arranque en desarrollo

```bash
env -u ELECTRON_RUN_AS_NODE DISPLAY=:0 npm run dev -- --no-sandbox
```

---

## Estado del proyecto

- **V1.5 completada** (10 jun 2026) — editor funcional con símbolos, cuadernillos y exportación PDF
- **V2 en planeación** — Panel Alexandria, exportación a Word, integración con Drive

---

*Helecho — Socorro, Santander 🇨🇴*

# Helecho — CLAUDE.md
> Lee este archivo antes de tocar cualquier cosa.
> claude en cada peticion que te diga que hagas 
---

## ¿Qué es Helecho?

Editor de escritorio nativo para apuntes matemáticos. Sin LaTeX, sin comandos. El usuario hace clic en un símbolo y se inserta. Se guarda como Markdown enriquecido y se exporta a PDF limpio.

**Versión activa: V1.5 completada (10 jun 2026) — siguiente: V2**
> Estado detallado, extras y deuda conocida: `apuntes/apuntesV1/v1.md`
> Índice de toda la documentación: `apuntes/apuntesV1/README.md`

---

## Stack

- **Shell:** Electron + **electron-vite** como build tool
- **Frontend:** React + TypeScript (strict)
- **Editor:** TipTap
- **Math:** KaTeX
- **Estilos:** Tailwind CSS
- **Guardado:** Markdown enriquecido (.md)
- **Export PDF:** MD → HTML → PDF (Electron print API)

---

## Estructura

```
helecho/
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   └── ipc/
│   │       ├── fileHandlers.ts
│   │       └── exportHandlers.ts
│   ├── preload/
│   │   └── index.ts
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   ├── HelechoEditor.tsx
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   └── extensions/
│   │   │   │       └── MathInline.tsx
│   │   │   ├── SymbolMenu/
│   │   │   │   ├── SymbolMenu.tsx
│   │   │   │   ├── SymbolSearch.tsx
│   │   │   │   └── symbols/
│   │   │   │       └── algebraLineal.ts
│   │   │   ├── Notebook/
│   │   │   │   ├── NotebookSidebar.tsx
│   │   │   │   └── NotebookTab.tsx
│   │   │   └── Layout/
│   │   │       ├── AppShell.tsx
│   │   │       └── MenuBar.tsx
│   │   ├── hooks/
│   │   │   ├── useEditor.ts
│   │   │   ├── useNotebook.ts
│   │   │   └── useExport.ts
│   │   ├── store/
│   │   │   └── notebookStore.ts
│   │   ├── types/
│   │   │   ├── notebook.ts
│   │   │   └── symbols.ts
│   │   └── styles/
│   │       └── globals.css
│   └── shared/
│       ├── ipcChannels.ts
│       └── mdSerializer.ts
├── CLAUDE.md
├── CLAUDE.dev.md
├── V1_PASOS.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── electron-builder.json
└── .gitignore
```


---

## Reglas críticas

- El renderer **nunca** importa módulos de Node.js (`fs`, `path`, `electron`). Todo va por IPC.
- **No usar** `vite-plugin-electron` — solo `electron-vite`.
- **Sin `"type": "module"`** en package.json.
- Sin `any` explícitos en TypeScript.
- Los canales IPC van en `shared/ipcChannels.ts` como constantes — nunca strings literales dispersos.

---

## Lo que NO está hecho aún (→ V2)

- Panel Alexandria (navegador de referencias)
- Export a Word .docx (investigado: `markdown-docx` — plan en apuntes/apuntesV1/investigacion-word-export.md)
- Integración Google Drive / OneDrive (el backup Git local sí existe)
- Menús de símbolos para otras materias
- Lista completa de deuda: sección "Pendiente" en `apuntes/apuntesV1/v1.md`

---

## Arranque en desarrollo

```bash
env -u ELECTRON_RUN_AS_NODE DISPLAY=:0 npm run dev -- --no-sandbox
```

---

*Helecho — Socorro, Santander 🇨🇴*
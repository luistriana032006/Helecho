#!/bin/bash
cd "$(dirname "$0")"
REPO="$(pwd)"

# ── Lanzador de escritorio (icono en Linux) ──────────────────────────────
# En Linux el icono de la ventana/dock NO lo da el BrowserWindow: GNOME cruza
# el WM_CLASS/app_id de la ventana (fijado a "Helecho" en src/main/index.ts)
# contra un archivo .desktop instalado. Se (re)escribe en cada arranque para
# que las rutas absolutas sigan a la carpeta del repo aunque se mueva.
# Idempotente. (En el AppImage empaquetado esto lo genera electron-builder.)
APPS_DIR="$HOME/.local/share/applications"
mkdir -p "$APPS_DIR"
cat > "$APPS_DIR/helecho.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Helecho
Comment=Editor de apuntes matemáticos
Exec=$REPO/iniciar.sh
Icon=$REPO/build/icon.png
Terminal=false
Categories=Education;
StartupWMClass=Helecho
EOF
update-desktop-database "$APPS_DIR" 2>/dev/null || true

npm run dev

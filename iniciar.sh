#!/bin/bash
cd "$(dirname "$0")"
REPO="$(pwd)"

# NOTA: este script ya NO escribe ~/.local/share/applications/helecho.desktop.
# Esa entrada del menú ahora es propiedad del AppImage instalado (la escribe
# src/main/appImageIntegration.ts al arrancar, apuntando a su propia ruta);
# si la reescribiéramos aquí, romperíamos el icono del menú del usuario final
# (pasó: el .desktop quedaba apuntando a npm run dev, que desde GNOME falla
# sin PATH de node). La ventana de dev igual muestra el icono: comparte el
# WM_CLASS "Helecho" y GNOME la asocia a esa misma entrada del AppImage.

npm run dev

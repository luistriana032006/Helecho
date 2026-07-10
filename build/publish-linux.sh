#!/bin/bash
# Construye .deb y AppImage en pasadas SEPARADAS de electron-builder (así el
# wrapper de afterPack.js para el AppImage nunca contamina el .deb, que
# comparten la misma carpeta release/linux-unpacked si se construyen juntos).
# Los argumentos ("$@", ej. --publish always) se pasan a AMBAS invocaciones.
set -e
npm run build
electron-builder --linux deb "$@"
electron-builder --linux AppImage "$@"

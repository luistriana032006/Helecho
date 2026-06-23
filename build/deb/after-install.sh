#!/bin/bash
# postinst de Helecho.
#
# OJO: en electron-builder el 'afterInstall' REEMPLAZA por completo el postinst
# por defecto (no se le anade al final). Por eso aqui reproducimos la logica
# original (crear el comando /usr/bin/helecho, refrescar menus/MIME) y al final
# anadimos nuestro arreglo del sandbox.

# --- 1. Comando /usr/bin/helecho (igual que el postinst original) ---
if type update-alternatives 2>/dev/null >&1; then
    # Quitar enlace previo si no usa update-alternatives
    if [ -L '/usr/bin/helecho' -a -e '/usr/bin/helecho' -a "`readlink '/usr/bin/helecho'`" != '/etc/alternatives/helecho' ]; then
        rm -f '/usr/bin/helecho'
    fi
    update-alternatives --install '/usr/bin/helecho' 'helecho' '/opt/Helecho/helecho' 100 || ln -sf '/opt/Helecho/helecho' '/usr/bin/helecho'
else
    ln -sf '/opt/Helecho/helecho' '/usr/bin/helecho'
fi

# --- 2. Refrescar bases de datos de MIME y de aplicaciones ---
if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi

if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi

# --- 3. Arreglo del sandbox (chrome-sandbox SUID) ---
# electron-builder decide los permisos de chrome-sandbox segun si hay user
# namespaces, pero ese test corre como root durante la instalacion y siempre
# cree que los hay -> deja 0755. En distros que restringen los user namespaces
# sin privilegios (Ubuntu 24.04 / elementary OS) la app entonces aborta:
#   FATAL setuid_sandbox_host.cc ... chrome-sandbox ... mode 4755
# Forzamos 4755 root para que el sandbox SUID funcione siempre, sin --no-sandbox.
chown root:root '/opt/Helecho/chrome-sandbox' 2>/dev/null || true
chmod 4755 '/opt/Helecho/chrome-sandbox' || true

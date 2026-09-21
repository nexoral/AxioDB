#!/bin/bash
set -e

# Create command line link in /usr/bin
if type update-alternatives 2>/dev/null >&1; then
    if [ -L '/usr/bin/axiodb-control' -a -e '/usr/bin/axiodb-control' -a "`readlink '/usr/bin/axiodb-control'`" != '/etc/alternatives/axiodb-control' ]; then
        rm -f '/usr/bin/axiodb-control'
    fi
    update-alternatives --install '/usr/bin/axiodb-control' 'axiodb-control' '/opt/AxioDB Control/axiodb-control' 100 || ln -sf '/opt/AxioDB Control/axiodb-control' '/usr/bin/axiodb-control'
else
    ln -sf '/opt/AxioDB Control/axiodb-control' '/usr/bin/axiodb-control'
fi

# Ensure chrome-sandbox permissions
if [ -f '/opt/AxioDB Control/chrome-sandbox' ]; then
    if ! { [[ -L /proc/self/ns/user ]] && unshare --user true; }; then
        chmod 4755 '/opt/AxioDB Control/chrome-sandbox' || true
    else
        chmod 0755 '/opt/AxioDB Control/chrome-sandbox' || true
    fi
fi

# Ensure authentic regular PNG file in /usr/share/pixmaps/ with standard read permissions
if [ -d /usr/share/pixmaps ]; then
    if [ -f /usr/share/icons/hicolor/512x512/apps/axiodb-control.png ]; then
        cp -f /usr/share/icons/hicolor/512x512/apps/axiodb-control.png /usr/share/pixmaps/axiodb-control.png || true
    elif [ -f "/opt/AxioDB Control/resources/icon.png" ]; then
        cp -f "/opt/AxioDB Control/resources/icon.png" /usr/share/pixmaps/axiodb-control.png || true
    fi
    chmod 644 /usr/share/pixmaps/axiodb-control.png 2>/dev/null || true
fi

# Update icon caches so GNOME/KDE/XFCE/Cinnamon immediately recognizes the app icon
if hash gtk-update-icon-cache 2>/dev/null; then
    gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi

# Update mime and desktop databases
if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi

if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi

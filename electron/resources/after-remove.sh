#!/bin/bash
set -e

# Remove /usr/bin link
if type update-alternatives 2>/dev/null >&1; then
    update-alternatives --remove 'axiodb-control' '/opt/AxioDB Control/axiodb-control' || true
fi
if [ -L '/usr/bin/axiodb-control' ]; then
    rm -f '/usr/bin/axiodb-control' || true
fi

# Remove pixmap file or symlink if present
if [ -e /usr/share/pixmaps/axiodb-control.png ] || [ -L /usr/share/pixmaps/axiodb-control.png ]; then
    rm -f /usr/share/pixmaps/axiodb-control.png || true
fi

# Update icon caches
if hash gtk-update-icon-cache 2>/dev/null; then
    gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi

# Update mime and desktop database
if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi

if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi

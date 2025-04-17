{pkgs}: {
  deps = [
    pkgs.dbus
    pkgs.nspr
    pkgs.nss
    pkgs.gtk3
    pkgs.glib
    pkgs.chromium
  ];
}

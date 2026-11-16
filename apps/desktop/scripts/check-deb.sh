#!/bin/sh
set -eu

deb=$(realpath "$1")
image=${2:-debian:12}

docker run --rm -v "$deb:/tmp/flownote.deb:ro" "$image" sh -euc '
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq --no-install-recommends /tmp/flownote.deb >/dev/null
  for tool in xprop xwininfo; do command -v "$tool" >/dev/null || { echo "$tool is not installed"; exit 1; }; done
  grep -q apparmor-profile /var/lib/dpkg/info/flownote.postinst && [ -f /opt/FlowNote/resources/apparmor-profile ] || { echo "the deb does not install its AppArmor profile, so FlowNote closes at launch on Ubuntu 24.04"; exit 1; }
  missing=$(find /opt/FlowNote -type f \( -name "*.so*" -o -name "*.node" -o -name flownote \) -exec ldd {} + 2>/dev/null | grep "not found" | sort -u || true)
  if [ -n "$missing" ]; then
    echo "The deb does not declare these libraries:"
    echo "$missing"
    exit 1
  fi
  echo "every library resolves"
'

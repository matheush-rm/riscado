#!/usr/bin/env bash
# Gera keystore de release e grava nos secrets do repo (precisa de gh logado e keytool).
# Guarde o .jks gerado num lugar seguro: sem ele, updates do app nao instalam por cima.
set -euo pipefail
OUT="${1:-$HOME/.android-keys/riscado-release.jks}"
ALIAS=riscado
mkdir -p "$(dirname "$OUT")"
if [ ! -f "$OUT" ]; then
  PASS=$(openssl rand -base64 24 | tr -d '/+=')
  keytool -genkeypair -v -keystore "$OUT" -alias "$ALIAS" -keyalg RSA -keysize 4096 -validity 36500 \
    -storepass "$PASS" -keypass "$PASS" -dname "CN=Riscado"
  echo "$PASS" > "$OUT.pass"
  chmod 600 "$OUT" "$OUT.pass"
fi
PASS=$(cat "$OUT.pass")
base64 -w0 "$OUT" | gh secret set ANDROID_KEYSTORE_BASE64
printf %s "$PASS" | gh secret set ANDROID_KEYSTORE_PASSWORD
printf %s "$PASS" | gh secret set ANDROID_KEY_PASSWORD
printf %s "$ALIAS" | gh secret set ANDROID_KEY_ALIAS
echo "ok: keystore em $OUT (senha em $OUT.pass)"

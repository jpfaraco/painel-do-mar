#!/usr/bin/env bash
# Publica uma versão nova do firmware de presente para os painéis baixarem pela internet.
#
# Uso:
#   ./scripts/publicar-atualizacao.sh caminho/do/firmware.ota.bin "o que mudou"
#
# Antes de rodar:
#   1. aumente "versao" em firmware/painel-do-mar.yaml;
#   2. compile e grave essa versão no seu próprio painel, e confira que ele conecta e mostra os dados;
#   3. baixe o arquivo OTA (no ESPHome: Install → Manual download → OTA format).
#
# Os painéis consultam o manifest.json a cada 6 horas. Se a versão dele for diferente da que
# está gravada no painel, o painel baixa o firmware, confere o MD5, grava e reinicia.
set -euo pipefail
cd "$(dirname "$0")/.."

BIN="${1:?Informe o caminho do firmware.ota.bin}"
RESUMO="${2:-Atualização do Painel do Mar}"
[ -f "$BIN" ] || { echo "Arquivo não encontrado: $BIN"; exit 1; }

VERSAO=$(sed -n 's/^  versao: "\(.*\)"/\1/p' firmware/painel-do-mar.yaml)
[ -n "$VERSAO" ] || { echo "Não achei a linha versao em firmware/painel-do-mar.yaml"; exit 1; }
ATUAL=$( [ -f manifest.json ] && sed -n 's/.*"version": "\([^"]*\)".*/\1/p' manifest.json | head -1 || true)
if [ "$VERSAO" = "$ATUAL" ]; then
  echo "A versão $VERSAO já está publicada. Aumente versao em firmware/painel-do-mar.yaml e compile de novo."
  exit 1
fi

DESTINO="ota/painel-do-mar-$VERSAO.ota.bin"
cp "$BIN" "$DESTINO"
if command -v md5sum >/dev/null; then MD5=$(md5sum "$DESTINO" | cut -d' ' -f1); else MD5=$(md5 -q "$DESTINO"); fi

cat > manifest.json <<JSON
{
  "name": "Painel do Mar",
  "version": "$VERSAO",
  "builds": [
    {
      "chipFamily": "ESP32-C3",
      "ota": {
        "path": "https://raw.githubusercontent.com/jpfaraco/painel-do-mar/main/$DESTINO",
        "md5": "$MD5",
        "summary": "$RESUMO"
      }
    }
  ]
}
JSON

git add manifest.json "$DESTINO" firmware/painel-do-mar.yaml firmware/pagina pagina
git commit -m "Firmware de presente $VERSAO: $RESUMO"
git push origin main
echo "Publicada a versão $VERSAO. Os painéis atualizam em até 6 horas."

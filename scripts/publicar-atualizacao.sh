#!/usr/bin/env bash
# Publica uma versão nova do firmware para os painéis baixarem pela internet.
#
# Uso:
#   ./scripts/publicar-atualizacao.sh firmware.ota.bin firmware.factory.bin "o que mudou"
#
# Antes de rodar:
#   1. aumente "versao" em firmware/painel-do-mar.yaml;
#   2. compile e grave essa versão num painel, e confira que ele conecta e mostra os dados;
#   3. pegue os dois arquivos da compilação (no ESPHome: Install → Manual download, nos formatos
#      OTA e Factory, ou em .esphome/build/painel-do-mar/.pioenvs/painel-do-mar/).
#
# O script troca os arquivos de binarios/ pelos da versão nova, escreve o manifest.json com o MD5,
# faz o commit e o push. Os painéis consultam o manifest.json a cada 6 horas. Se a versão dele for
# diferente da que está gravada, o painel baixa o firmware, confere o MD5, grava e reinicia.
set -euo pipefail
cd "$(dirname "$0")/.."

OTA="${1:?Informe o caminho do firmware.ota.bin}"
FACTORY="${2:?Informe o caminho do firmware.factory.bin}"
RESUMO="${3:-Atualização do Painel do Mar}"
for f in "$OTA" "$FACTORY"; do [ -f "$f" ] || { echo "Arquivo não encontrado: $f"; exit 1; }; done

VERSAO=$(sed -n 's/^  versao: "\(.*\)"/\1/p' firmware/painel-do-mar.yaml)
[ -n "$VERSAO" ] || { echo "Não achei a linha versao em firmware/painel-do-mar.yaml"; exit 1; }
ATUAL=$( [ -f manifest.json ] && sed -n 's/.*"version": "\([^"]*\)".*/\1/p' manifest.json | head -1 || true)
if [ "$VERSAO" = "$ATUAL" ]; then
  echo "A versão $VERSAO já está publicada. Aumente versao em firmware/painel-do-mar.yaml e compile de novo."
  exit 1
fi

git rm -q --ignore-unmatch binarios/*.bin
mkdir -p binarios
DESTINO="binarios/painel-do-mar-$VERSAO.ota.bin"
cp "$OTA" "$DESTINO"
cp "$FACTORY" "binarios/painel-do-mar-$VERSAO.factory.bin"
# endereço do repositório a partir do remote, para funcionar também em forks
REPO=$(git remote get-url origin | sed -E 's#(git@github\.com:|https://github\.com/)##; s#\.git$##')
if command -v md5sum >/dev/null; then MD5=$(md5sum "$DESTINO" | cut -d' ' -f1); else MD5=$(md5 -q "$DESTINO"); fi

cat > manifest.json <<JSON
{
  "name": "Painel do Mar",
  "version": "$VERSAO",
  "builds": [
    {
      "chipFamily": "ESP32-C3",
      "ota": {
        "path": "https://raw.githubusercontent.com/$REPO/main/$DESTINO",
        "md5": "$MD5",
        "summary": "$RESUMO"
      }
    }
  ]
}
JSON

git add manifest.json binarios firmware/painel-do-mar.yaml firmware/pagina pagina
git commit -m "Firmware $VERSAO: $RESUMO"
git push origin main
echo "Publicada a versão $VERSAO. Os painéis atualizam em até 6 horas."

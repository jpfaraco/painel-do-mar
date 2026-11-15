# Painel do mar

Display e-ink pequeno que, ao ser ligado, mostra o mar e o tempo de uma praia, sem nenhuma interação. As unidades são feitas só pra dar de presente.

Placa ESP32-C3 Super Mini com display e-ink WeAct de 2,9" preto e branco (SSD1680, 296 × 128), alimentada por USB-C. Firmware em ESPHome. Os dados vêm das APIs gratuitas do Open-Meteo (marinha, com `cell_selection=sea`, e previsão do tempo). A licença gratuita do Open-Meteo vale só pra uso pessoal e não comercial.

## Estrutura

- `firmware/copacabana.yaml`: firmware da unidade de teste do João (`copacabana.local`, 10.0.0.100), ligada ao Home Assistant. Copacabana fixa por `substitutions`.
- `firmware/painel-do-mar.yaml`: firmware de presente, versão 1.2.0. Sem Home Assistant e sem rede gravada. O Wi-Fi é configurado pelo celular com o QR code da tela, e o resto na página da placa. Apaga Wi-Fi e lugar com 5 religadas seguidas. Busca atualizações neste repositório a cada 6 horas.
- `firmware/pagina/`: a página da placa, já montada (`painel.js`), que o firmware embute com `js_include`. Ela desenha a tela do painel igual à do aparelho, com as partes que dá para trocar marcadas, e busca o lugar direto no Open-Meteo pelo celular.
- `pagina/`: a fonte da página (`painel.src.js`, `painel.css`, `glifos.json`). Depois de mudar, rode `python3 pagina/montar.py` e compile o firmware. `glifos.py` gera os desenhos das letras a partir das fontes do firmware.
- `manifest.json` e `ota/`: a versão publicada para os painéis baixarem pela internet.
- `scripts/publicar-atualizacao.sh`: publica uma versão nova (ver abaixo).
- `firmware/fonts/`: Pixel Operator e Jersey 15 (esta só para `pagina/glifos.py`, porque o firmware a baixa do Google Fonts com `gfonts://`).
- `firmware/secrets.example.yaml`: modelo do `secrets.yaml`, que fica fora do git.
- `docs/como-configurar.txt`: instruções que acompanham o presente.
- `case/`: caixa impressa em 3D, com os STL e os scripts em Python que geram as peças.

## Compilar e gravar

O ESPHome roda no Raspberry Pi 4 (container `esphome-esphome-1`, versão 2026.9.1, pasta `/DATA/AppData/esphome/config` montada em `/config`). A cópia em uso está lá, e este repo é a fonte versionada.

```sh
docker exec esphome-esphome-1 esphome config /config/copacabana.yaml > /dev/null && echo ok
docker exec esphome-esphome-1 esphome compile /config/copacabana.yaml
docker exec esphome-esphome-1 esphome upload /config/copacabana.yaml --device copacabana.local
```

A primeira gravação de uma placa nova é por USB, no computador, com o `firmware.factory.bin` em web.esphome.io. O container no Pi não tem acesso a USB. Se a porta piscar na lista do Chrome, segure BOOT, aperte e solte RESET e solte BOOT.

Diferença entre o repo e a pasta do ESPHome: aqui a chave de criptografia da API vem de `!secret copacabana_api_key`. Na pasta do Pi ela ainda está escrita direto no YAML.

## Atualização pela internet

Os painéis com o firmware de presente consultam `https://raw.githubusercontent.com/jpfaraco/painel-do-mar/main/manifest.json` 2 minutos depois de ligar e depois a cada 6 horas. Se a versão no manifesto for diferente da gravada no painel, ele baixa o arquivo de `ota/`, confere o MD5, grava e reinicia. Wi-Fi, lugar e escolhas da tela continuam salvos, a não ser quando a versão nova muda o nome de uma escolha (da 1.1 para a 1.2 as escolhas da tela voltaram ao padrão). Durante a gravação, a tela mostra "Atualizando".

Para lançar uma versão nova:

1. Aumente `versao` em `firmware/painel-do-mar.yaml`.
2. Compile e grave essa versão no seu painel, e confira que ele conecta e mostra os dados. Um firmware que não conecta no Wi-Fi não consegue buscar a correção, então nada vai para o repositório sem rodar numa placa antes.
3. Baixe o arquivo OTA: no ESPHome, Install → Manual download → OTA format.
4. Rode `./scripts/publicar-atualizacao.sh caminho/do/firmware.ota.bin "o que mudou"`. O script copia o arquivo para `ota/`, escreve o `manifest.json` com o MD5, faz o commit e o push.

Quem tem acesso a este repositório consegue mandar firmware para todos os painéis, então a conta do GitHub precisa de verificação em duas etapas.

## Caixa

Inspirada no rádio-relógio Braun DN40, do Dieter Rams. Os STL e os scripts estão em `case/`, com instruções em `case/README.md`.

## Links

- Linear: projeto "Painel do mar de Copacabana" (P-U-34)
- Guia: https://claude.ai/artifact/L1XC1gLfUt4LkFTJd9iMZn
- Emulador: https://claude.ai/artifact/7qfgGxfVb63JQbTQMim1Er
- Protótipo da página da placa: https://claude.ai/artifact/NfawX41DHStgrv9TaHGGUT (com `#primeiro-uso` no fim, abre como um painel sem lugar)
- Briefing: https://claude.ai/artifact/Lj2MPrTvqQbp26sLZ4yu7U

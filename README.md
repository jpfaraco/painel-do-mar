# Painel do mar

Display e-ink pequeno que, ao ser ligado, mostra o mar e o tempo de uma praia, sem nenhuma interação. As unidades são feitas só pra dar de presente.

Placa ESP32-C3 Super Mini com display e-ink WeAct de 2,9" preto e branco (SSD1680, 296 × 128), alimentada por USB-C. Firmware em ESPHome. Os dados vêm das APIs gratuitas do Open-Meteo (marinha, com `cell_selection=sea`, e previsão do tempo). A licença gratuita do Open-Meteo vale só pra uso pessoal e não comercial.

## Estrutura

- `firmware/copacabana.yaml`: firmware da unidade de teste do João (`copacabana.local`, 10.0.0.100), ligada ao Home Assistant. Copacabana fixa por `substitutions`.
- `firmware/painel-do-mar.yaml`: firmware de presente. Sem Home Assistant e sem rede gravada. O Wi-Fi e o lugar são configurados pelo celular, com QR codes na tela. Nunca rodou numa placa.
- `firmware/fonts/`: Pixel Operator. A Jersey 15 vem do Google Fonts (`gfonts://`).
- `firmware/secrets.example.yaml`: modelo do `secrets.yaml`, que fica fora do git.
- `docs/como-configurar.txt`: instruções que acompanham o presente.
- `case/`: caixa impressa em 3D (ainda vazio, ver abaixo).

## Compilar e gravar

O ESPHome roda no Raspberry Pi 4 (container `esphome-esphome-1`, versão 2026.9.1, pasta `/DATA/AppData/esphome/config` montada em `/config`). A cópia em uso está lá, e este repo é a fonte versionada.

```sh
docker exec esphome-esphome-1 esphome config /config/copacabana.yaml > /dev/null && echo ok
docker exec esphome-esphome-1 esphome compile /config/copacabana.yaml
docker exec esphome-esphome-1 esphome upload /config/copacabana.yaml --device copacabana.local
```

A primeira gravação de uma placa nova é por USB, no computador, com o `firmware.factory.bin` em web.esphome.io. O container no Pi não tem acesso a USB.

Diferença entre o repo e a pasta do ESPHome: aqui a chave de criptografia da API vem de `!secret copacabana_api_key`. Na pasta do Pi ela ainda está escrita direto no YAML.

## Caixa

Inspirada no rádio-relógio Braun DN40, do Dieter Rams. Os scripts em Python (manifold3d, shapely, trimesh) e os 3 STL foram feitos no Chat do Claude e ainda não estão aqui.

## Links

- Linear: projeto "Painel do mar de Copacabana" (P-U-34)
- Guia: https://claude.ai/artifact/L1XC1gLfUt4LkFTJd9iMZn
- Emulador: https://claude.ai/artifact/7qfgGxfVb63JQbTQMim1Er
- Briefing: https://claude.ai/artifact/Lj2MPrTvqQbp26sLZ4yu7U

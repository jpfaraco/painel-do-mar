# Caixa do painel do mar: scripts de modelagem

Scripts em Python que geram as três peças da caixa (corpo, tampa lateral e frente) e as
peças de teste de encaixe. Com os valores que estão no código, `gerar_pecas.py` reproduz os STL
da pasta `stl/`. As medidas foram calibradas para uma Prusa Mini com bico de 0,8 mm,
camada de 0,3 mm e 3 perímetros.

## Instalação

Python 3.10 ou mais novo:

    pip install manifold3d shapely trimesh numpy scipy networkx

## Uso

    python gerar_pecas.py    # gera os três STL em saida/
    python conferir.py       # confere se peças, tela, Super Mini e plugue se sobrepõem (tudo deve dar 0)
    python pecas_teste.py    # gera as peças de teste em saida/testes/

## Arquivos

- `geo.py`: perfil lateral inspirado no Braun DN40, sistema de coordenadas e funções de apoio.
  O perfil sai de cinco cantos com raio (costas embaixo, queixo, quina de cima da frente, início
  da rampa e topo das costas), multiplicados pela escala `SC`.
- `caixa.py`: as peças. As medidas calibradas ficam no topo: as medidas da frente impressa (`ABA_FRENTE`, `ABA_ESPESSURA`, `BORDA_ABA`), as folgas do canal do trilho (`FOLGA_CANAL_N` e `FOLGA_CANAL_V`), o dente da tampa (`BUMP`) e o raio dos cantos da janela da frente (`R_CHANFRO`).
- `teste_trilhos_escada.py`: peça de teste com cinco versões do trilho empilhadas, da mais folgada à mais justa.
- `gerar_pecas.py`, `conferir.py` e `pecas_teste.py`: os scripts que você roda.

## Sistema de coordenadas

Em milímetros. `x` é a profundidade, de 0 nas costas até a ponta da frente. `y` é a altura, de 0
na base. `z` é a largura, de 0 na lateral direita, que é fechada, até 104 na lateral esquerda,
onde entra a tampa. O corpo é impresso deitado sobre a lateral direita, então `z` é a altura na
impressora. Na frente, as coordenadas são próprias: `u` ao longo da largura, `v` ao longo
da face inclinada e `w` para dentro da caixa.

## O que mudar e onde

- **Frente justa ou frouxa:** o canal do trilho é desenhado a partir das medidas da frente
  impressa, porque a aba sai mais grossa por ser impressa sobre suporte. Meça a sua frente com
  paquímetro, ponha os valores em `ABA_FRENTE`, `ABA_ESPESSURA` e `BORDA_ABA`, rode
  `teste_trilhos_escada.py` e passe as folgas do degrau que deslizou bem para `FOLGA_CANAL_N`
  (espessura) e `FOLGA_CANAL_V` (altura). Se mudar a orientação ou o suporte da frente, meça de novo.
- **Tampa frouxa ou dura:** `BUMP` é a altura do dente das abas. Calibre com o teste 2.
- **Outra placa no lugar da Super Mini:** a gaveta está em `Y_PISO`, `Y_LABIO`, `Z_FUNDO`, `BLOCO`
  e `CANAL`, e o furo do USB-C em `furo_usb()`. Depois de mudar, rode `conferir.py` com as medidas
  da placa nova no bloco `esp`.
- **Outro tamanho de caixa:** `SC` muda a escala do perfil e `W` a largura. A posição da frente
  (`DC`) e os trilhos dependem disso, então confira com `conferir.py`.

## Regras que vieram dos testes com bico de 0,8 mm

- Nada que precise segurar com menos de 2 mm de sobreposição: a ponta das peças sai arredondada
  com um raio de uns 0,4 mm.
- Nenhuma parede estrutural com menos de 3 linhas do bico, ou 2,4 mm.
- Teste os encaixes depois que as peças esfriarem.

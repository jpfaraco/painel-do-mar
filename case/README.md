# Caixa

Inspirada no rádio-relógio Braun DN40, do Dieter Rams. São três peças que se encaixam sem parafuso e sem cola:

| Arquivo | Peça | Como imprimir |
|---|---|---|
| `stl/corpo.stl` | corpo, com a gaveta da Super Mini e os trilhos da frente | deitado sobre a lateral direita, como está no arquivo |
| `stl/frente.stl` | frente que segura a tela, com a janela chanfrada | com a face virada para a mesa, suporte só embaixo da aba de trás |
| `stl/tampa-lateral.stl` | tampa da lateral esquerda, com quatro abas de encaixe | com a face de fora virada para a mesa |

Esses são os arquivos da versão impressa e montada. As folgas foram acertadas numa Prusa Mini com bico de 0,8 mm, camada de 0,3 mm, 3 perímetros e preenchimento giroide de 15%, em PLA. Ao todo são uns 110 g de filamento. Com outra impressora, outro bico ou outro material, imprima primeiro as peças de teste da pasta `scripts/` para conferir os encaixes.

## Montagem

1. Encaixe a tela na frente, com o vidro virado para a janela. Os quatro pinos da frente entram nos furos dos cantos da placa da tela.
2. Deslize a frente nos trilhos do corpo, pela lateral esquerda, até o fim.
3. Coloque a Super Mini na gaveta, com o USB-C virado para o furo das costas. Os botões RESET e BOOT ficam em cima de uma janelinha no fundo, que dá para alcançar com um alfinete.
4. Feche a lateral com a tampa.

## Scripts

`scripts/` tem o código em Python que gera as três peças e as peças de teste de encaixe. O `scripts/LEIAME.md` explica como instalar, rodar e onde mudar as folgas.

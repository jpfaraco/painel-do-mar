"""Confere se as peças e a eletrônica se sobrepõem em algum ponto. Tudo deve dar 0.

    python conferir.py
"""
from caixa import *

c, t = corpo(), tampa()
f = montar_frente(frente())
F = FOLGA_FRENTE
# tela: vidro, placa e conector branco nas costas, na posição em que a frente segura
vidro = bloco(-42.62, 36.44, -18.54, 18.26, 4.0 - F, 5.3 - F)
placa = bloco(-48.92, 42.88, -18.94, 18.46, 5.3 - F, 6.95 - F)
conector = bloco(15.93, 40.5, -18.54, -12.54, 6.95 - F, 10.5 - F)
tela = montar_frente(vidro + placa + conector)
# Super Mini na gaveta: placa, USB-C embaixo e jumpers em cima
esp = (bloco(4.5, 27.0, Y_PISO + 2.8, Y_PISO + 3.8, Z_FUNDO, Z_FUNDO + 18.2)
       + bloco(2.9, 10.9, Y_PISO, Y_PISO + 3.2, USB_Z - 4.45, USB_Z + 4.45)
       + bloco(6.1, 25.5, Y_PISO + 3.8, Y_PISO + 20.3, Z_FUNDO + 0.3, Z_FUNDO + 17.9))
# plugue do cabo USB-C entrando pelas costas
plugue = bloco(-20, 2.9, USB_Y - 2.95, USB_Y + 2.95, USB_Z - 5.9, USB_Z + 5.9)
# caminho da Super Mini entrando pela lateral aberta
caminho = (bloco(4.5, 27.0, Y_PISO + 2.8, Y_PISO + 3.8, Z_FUNDO, W + 30)
           + bloco(2.9, 10.9, Y_PISO, Y_PISO + 3.2, USB_Z - 4.45, W + 30)
           + bloco(6.1, 25.5, Y_PISO + 3.8, Y_PISO + 20.3, Z_FUNDO + 0.3, W + 30))

def v(a, b):
    return round((a ^ b).volume(), 2)

print("sobreposição em mm³ (tudo deve dar 0):")
print("  corpo x tampa  ", v(c, t))
print("  corpo x frente ", v(c, f))
print("  tampa x frente ", v(t, f))
print("  tela x corpo   ", v(tela, c))
print("  tela x tampa   ", v(tela, t))
print("  Super Mini x corpo", v(esp, c))
print("  Super Mini x tampa", v(esp, t))
print("  plugue x corpo ", v(plugue, c))
print("  caminho da Super Mini x corpo", v(caminho, c))
rt = trilhos()
vid2 = frect(-18.54, 18.26, -(4.0 - F), -(5.3 - F)); pcb2 = frect(-18.94, 18.46, -(5.3 - F), -(6.95 - F))
print("distância do lábio do trilho ao vidro e à placa da tela (mm):", round(rt.distance(vid2), 2), round(rt.distance(pcb2), 2))

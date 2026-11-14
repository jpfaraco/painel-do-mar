"""Peças da caixa: corpo, tampa lateral e frente preta.

As folgas no topo deste arquivo foram calibradas com peças de teste impressas numa
Prusa Mini com bico de 0,8 mm, camada de 0,3 mm e 3 perímetros. Com outro bico ou outra
impressora, refaça os testes de pecas_teste.py antes de mudar estes números.
"""
from shapely.geometry import box, Point, MultiPolygon
from shapely.ops import nearest_points
from geo import *

# ---------- folgas calibradas ----------
FOLGA_FRENTE = 0.15   # folga do modelo da frente preta (a frente impressa sai diferente, ver abaixo)
BUMP = 1.20           # altura do dente das quatro abas da tampa

# Medidas da frente preta IMPRESSA com a face na mesa e suporte embaixo da aba. A aba cresce
# para baixo, na direção da face, porque é impressa em cima do suporte. O canal do trilho é
# desenhado a partir destas medidas, e não do modelo da frente.
ABA_FRENTE = 1.70        # da face da frente até a face da aba que encosta na parede
ABA_ESPESSURA = 2.10     # espessura da aba
BORDA_ABA = (OPEN - 0.2 - FOLGA_FRENTE) - 0.10 + 2.00   # borda da aba no sentido da altura
FOLGA_CANAL_N = 0.40     # folga na espessura: degrau 1 do teste em escada, que deslizou bem
FOLGA_CANAL_V = 0.50     # folga na altura: degrau 1 do teste em escada

# ---------- trilhos da frente ----------
FRENTE_CANAL = ABA_FRENTE - 0.10                            # a parede da frente termina 0,1 mm antes da aba
LABIO_N = -(ABA_FRENTE + ABA_ESPESSURA + FOLGA_CANAL_N)     # face do lábio, por trás da aba
PAREDE_V = BORDA_ABA + FOLGA_CANAL_V                        # parede lateral do canal

ABERTURA = frect(-OPEN, OPEN, 1.5, -3.5)


def canal():
    """Vão liso por onde corre a aba da frente, em cima e embaixo da abertura."""
    c = None
    for s_ in (-1, 1):
        r = frect(s_ * (FL - 2.9), s_ * PAREDE_V, -FRENTE_CANAL, LABIO_N)
        c = r if c is None else c.union(r)
    return c


def blocos_trilho(com_abertura=True):
    """Parede, haste e lábio de cada trilho num bloco só, antes de abrir o canal."""
    out = None
    for s_ in (-1, 1):
        r = frect(s_ * (FL - 2.8), s_ * (FL + 2.65), -1.0, -7.4)
        out = r if out is None else out.union(r)
    return out.difference(ABERTURA) if com_abertura else out


def trilhos():
    """Perfil final dos trilhos, com o canal liso aberto no meio.
    O lábio avança por trás da aba até 0,86 mm do vidro da tela."""
    return blocos_trilho().difference(canal())


# ---------- gaveta da Super Mini ----------
# A placa entra pela lateral aberta com os pinos para cima e o USB-C apontando para as costas.
Y_PISO, Y_LABIO = 4.4, 8.4            # piso onde o USB-C apoia e face de baixo dos lábios que seguram a placa
Z_FUNDO = 82.1                        # até onde a placa entra
USB_Y, USB_Z = 6.0, Z_FUNDO + 9.1     # centro do USB-C
BLOCO = box(1.5, 1.5, 29.55, 10.4)    # bloco da gaveta (começa dentro das paredes)
CANAL = (box(2.5, Y_PISO, 27.35, Y_LABIO)
         .difference(box(26.4, Y_PISO, 27.35, 7.0))          # degrau que apoia a ponta da antena
         .union(box(5.5, Y_LABIO - 0.01, 26.6, 10.6)))       # vão entre os lábios, por onde passam os jumpers


def janela_botoes():
    """Janela embaixo da gaveta para alcançar RESET e BOOT com um alfinete.
    Na Super Mini, os botões ficam lado a lado logo depois do USB-C, a uns 8,6 mm da ponta."""
    zc = Z_FUNDO + 9.1
    return bloco(11.6, 14.8, -1.0, Y_PISO + 0.05, zc - 5.5, zc + 5.5)


def furo_usb():
    """Furo do USB-C nas costas, com chanfro de 45° por dentro para o conector não enganchar."""
    m = cs(rrect(USB_Z, USB_Y, 13.6, 8.0, 1.5)).extrude(4.0).translate([0, 0, -1.0])
    m = m.transform(np.array([[0, 0, 1, 0], [0, 1, 0, 0], [1, 0, 0, 0]], float))
    ch = Manifold.batch_hull([bloco(1.2, 1.21, USB_Y - 3.7, USB_Y + 3.7, USB_Z - 6.5, USB_Z + 6.5),
                              bloco(2.4, 3.05, USB_Y - 3.7, USB_Y + 3.7, USB_Z - 7.85, USB_Z + 7.85)])
    return m + ch


# ---------- travas da tampa ----------
L_ABA, ZC_DENTE = 12.0, 10.0   # comprimento das abas e posição do dente, a partir da face de dentro da tampa


def pontos_travas(inner):
    """Base, costas, topo de trás e rampa."""
    alvo = [(62, 0), (0, 26), (28, 45), (74, 47)]
    return [nearest_points(inner.exterior, Point(p))[0] for p in alvo]


def janela(pt, meia=5.0):
    return box(pt.x - meia, pt.y - meia, pt.x + meia, pt.y + meia)


# regiões onde o aro da tampa não pode entrar: a frente com a tela e a gaveta
EXCL = frect(-28, 28, 3, -14).buffer(1.0).union(BLOCO.buffer(0.6))


def corpo():
    c = ext(OUTER, 0, Z1) - ext(INNER, Z0, W + 1)
    c = c + ext(blocos_trilho(com_abertura=False), Z0 - 0.1, Z1)
    c = c - ext(ABERTURA, Z0, W + 1)
    c = c - ext(canal(), Z0, W + 1)          # canal liso, sem ressaltos, de ponta a ponta
    # gaveta: bloco só nos últimos 20 mm, apoiado por uma rampa de uns 42° que nasce no fundo da caixa
    c = c + ext(BLOCO, Z_FUNDO - 2.0, Z1)
    x0, y0, x1, y1 = BLOCO.bounds
    topo = [[x, y, Z_FUNDO - 1.9] for x in (x0, x1 - 0.2) for y in (y0, y1 - 0.2)]
    base = [[x, y, Z_FUNDO - 11.0] for x in (x0, x1 - 0.2) for y in (y0 - 0.9, y0 - 0.4)]
    c = c + Manifold.hull_points(np.array(topo + base))
    c = c - ext(CANAL, Z_FUNDO, W + 1)
    c = c - furo_usb()
    c = c - janela_botoes()
    # canais das travas, com perfil em 45° para a tampa estalar e sair puxando
    for pt in pontos_travas(INNER):
        jan = janela(pt, 6.5)
        for i in range(12):
            z = Z1 - ZC_DENTE - 1.5 + i * 0.25
            prof = max(0.0, 1.5 - abs(z + 0.125 - (Z1 - ZC_DENTE)))
            if prof <= 0.2:
                continue
            c = c - ext(anel(INNER, prof, -0.05).intersection(jan), z - 0.01, z + 0.26)
    return limpar(c)


def tampa(bump=BUMP):
    t = ext(OUTER.buffer(-0.05, join_style=1), Z1, W)
    pts = pontos_travas(INNER)
    # aro de encaixe, interrompido nas abas, na frente e na gaveta
    aro = anel(INNER, -0.25, -2.05).difference(EXCL)
    for pt in pts:
        aro = aro.difference(janela(pt, 6.0))
    aro = MultiPolygon([g for g in getattr(aro, "geoms", [aro]) if g.area > 10])   # sem lascas
    t = t + ext(aro, Z1 - 5.0, Z1 + 0.1)
    # quatro abas flexíveis com dente chanfrado dos dois lados
    for pt in pts:
        t = t + ext(anel(INNER, -0.25, -2.05).intersection(janela(pt, 5.0)), Z1 - L_ABA, Z1 + 0.1)
        for i in range(int(2 * (bump + 0.2) / 0.25) + 1):
            z = Z1 - ZC_DENTE - (bump + 0.2) + i * 0.25
            alt = bump - abs(z + 0.125 - (Z1 - ZC_DENTE))
            if alt <= 0.05:
                continue
            d = anel(INNER, alt - 0.25, -0.5).intersection(janela(pt, 5.0))
            t = t + ext(d, z, z + 0.25)
    return limpar(t)


def frente(folga=FOLGA_FRENTE, comprimento=None):
    """Frente preta, em coordenadas próprias: u ao longo da largura, v ao longo da face, w para dentro.
    Com comprimento, gera só um pedaço reto sem janela, para testes de encaixe."""
    PU = (Z1 - Z0) / 2 - 0.2 - folga if comprimento is None else comprimento / 2
    f = (bloco(-PU, PU, -(OPEN - 0.2 - folga), OPEN - 0.2 - folga, 0, 2.5)
         + bloco(-PU, PU, -(FL - folga), FL - folga, 2.5, 4.0 - folga))
    if comprimento is not None:
        return f
    # janela 0,5 mm maior que a área de imagem, com chanfro de 60° em relação à face
    jan = bloco(-33.93, 33.93, -14.96, 14.96, -1, 5)
    ch = Manifold.batch_hull([bloco(-35.95, 35.95, -16.98, 16.98, -0.01, 0.0),
                              bloco(-33.93, 33.93, -14.96, 14.96, 3.49, 3.5)])
    f = f - jan - ch
    # quatro pinos que entram nos furos dos cantos da placa da tela
    for hu in (2.9 - 48.92, 88.9 - 48.92):
        for hv in (2.9 - 18.94, 34.5 - 18.94):
            f = f + Manifold.cylinder(1.3, 2.6, 2.6, 48).translate([hu, hv, 4.0 - folga])
            f = f + Manifold.cylinder(1.85, 1.5, 1.5, 32).translate([hu, hv, 5.3 - folga])
            f = f + Manifold.cylinder(0.4, 1.5, 1.1, 32).translate([hu, hv, 7.15 - folga])
    return f


def montar_frente(f):
    """Leva a frente das coordenadas próprias para a posição dentro da caixa."""
    Am = np.array([[0, EV[0], -EN[0], C0[0]], [0, EV[1], -EN[1], C0[1]], [-1, 0, 0, ZC]], float)
    return f.transform(Am)

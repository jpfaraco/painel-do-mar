"""Teste de trilhos em escada: uma peça só, com cinco versões do trilho empilhadas,
da mais folgada (em cima, por onde a frente entra) até a mais justa (embaixo).

As medidas partem da frente impressa com a face na mesa e suporte embaixo da aba:
  espessura da aba        1,35 mm no modelo, 2,10 mm impressa
  recuo da aba (da face)  2,50 mm no modelo, 1,70 mm impressa
  profundidade da aba     2,20 mm no modelo, 2,00 mm impressa
A aba cresce para baixo, na direção da face, porque é impressa em cima do suporte.

    python teste_trilhos_escada.py
"""
import os
from caixa import *

OUT = "saida/testes"
os.makedirs(OUT, exist_ok=True)

ABA_FRENTE = 1.70           # da face da frente até a face da aba que encosta na parede, na peça impressa
ABA_ESPESSURA = 2.10        # espessura da aba na peça impressa
BORDA_ABA = (OPEN - 0.2 - FOLGA_FRENTE) - 0.10 + 2.00   # borda da aba impressa no sentido da altura (estimada)
FRENTE_CANAL = ABA_FRENTE - 0.10   # parede da frente termina 0,1 mm antes da aba: a frente fica rente à caixa

# (folga na espessura, folga na altura) de cada degrau, do mais folgado ao mais justo
DEGRAUS = [(0.40, 0.50), (0.30, 0.40), (0.20, 0.30), (0.10, 0.20), (0.00, 0.10)]
ALTURA_DEGRAU = 10.0


def canal_degrau(folga_n, folga_v):
    """Vão por onde corre a aba, nos dois trilhos."""
    labio_n = -(ABA_FRENTE + ABA_ESPESSURA + folga_n)        # face do lábio, por trás da aba
    parede_v = BORDA_ABA + folga_v                            # parede lateral do canal
    c = None
    for sg in (-1, 1):
        r = frect(sg * (FL - 2.9), sg * parede_v, -FRENTE_CANAL, labio_n)
        c = r if c is None else c.union(r)
    return c, labio_n, parede_v


# parte comum: casca, trilhos cheios (parede, haste e lábio num bloco só) e a espinha que liga os dois
zona = frect(-33, 33, 2.0, -16)
cheio = OUTER.difference(INNER).intersection(zona)
for sg in (-1, 1):
    cheio = cheio.union(frect(sg * (FL - 2.8), sg * (FL + 2.65), -1.0, -7.4))
cheio = cheio.difference(ABERTURA)
cheio = cheio.union(INNER.intersection(frect(-40, 40, -11.5, -14.5)).buffer(0.3)).buffer(0)

n = len(DEGRAUS)
peca = ext(cheio.convex_hull, 0, 2.5)
for i, (fn, fv) in enumerate(DEGRAUS):
    z0 = 2.5 + (n - 1 - i) * ALTURA_DEGRAU          # degrau 1 em cima
    canal, labio_n, parede_v = canal_degrau(fn, fv)
    secao = cheio.difference(canal).buffer(0)
    m = ext(secao, z0, z0 + ALTURA_DEGRAU)
    # marcas: o degrau k tem k entalhes na faixa de cima da face
    for k in range(i + 1):
        zc = z0 + 1.2 + k * 1.9
        m = m - ext(frect(-23.3, -21.8, 0.5, -0.6), zc, zc + 1.1)
    peca = peca + m
    print(f"degrau {i+1}: folga na espessura {fn:.2f} mm, na altura {fv:.2f} mm "
          f"(lábio a {-labio_n:.2f} mm da face, parede do canal a {parede_v:.2f} mm do centro)")
t = salvar(limpar(peca), f"{OUT}/teste-trilhos-escada.stl")
# as emendas entre degraus deixam faces soltas de volume zero: fica só a peça principal
mm = t.copy(); mm.merge_vertices()
mm = max(mm.split(only_watertight=False), key=lambda p: p.volume)
mm.export(f"{OUT}/teste-trilhos-escada.stl")
print("fechada:", mm.is_watertight, " tamanho:", np.round(t.extents, 1), "mm  PLA ~", round(t.volume * 1.24 / 1000 * 0.55), "g")

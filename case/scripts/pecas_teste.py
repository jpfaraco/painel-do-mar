"""Peças de teste para calibrar as folgas em outra impressora ou outro bico.
Gera os arquivos na pasta saida/testes/.

    python pecas_teste.py

Teste 1: uma fatia de 20 mm do corpo com os trilhos lisos, e pedaços da
         frente com folgas diferentes (marcados com 1, 2, 3... furos). O pedaço que entra com
         um empurrão firme e fica sem jogo indica a folga certa.
Teste 2: um anel pequeno com os canais das travas e tampas com dentes de alturas diferentes
         (marcadas com 1, 2, 3... furos).
Teste 3: o canto de trás do corpo com a gaveta da Super Mini, o furo do USB-C e a janela dos botões.

Teste as peças depois que esfriarem: nos testes originais, o encaixe certo mudou depois disso.
"""
import os
from caixa import *

OUT = "saida/testes"
os.makedirs(OUT, exist_ok=True)
FOLGAS_TESTE = [0.00, 0.05, 0.10, 0.15]   # folga extra por lado dos pedaços da frente
DENTES_TESTE = [0.6, 0.9, 1.2]            # altura dos dentes das tampas de teste

# ---------- teste 1 ----------
zona = frect(-33, 33, 2.0, -16)
secao = OUTER.difference(INNER).intersection(zona).difference(ABERTURA).union(blocos_trilho())
espinha = INNER.intersection(frect(-40, 40, -11.5, -14.5)).buffer(0.3)   # liga os dois trilhos por trás
secao = secao.union(espinha).buffer(0)
secao = secao.difference(canal()).buffer(0)
fatia = ext(secao.convex_hull, 0, 2.5) + ext(secao, 2.4, 22.5)
salvar(limpar(fatia), f"{OUT}/teste-1a-fatia-trilhos-branco.stl")

pedacos = None
for i, fo in enumerate(FOLGAS_TESTE):
    p = frente(fo, comprimento=18.0)
    for k in range(i + 1):
        p = p - Manifold.cylinder(8, 1.2, 1.2, 24).translate([-6 + k * 4, 0, -1])
    p = p.translate([i * 24.0, 0, 0])
    pedacos = p if pedacos is None else pedacos + p
salvar(pedacos, f"{OUT}/teste-1b-pedacos-frente.stl")

# ---------- teste 2 ----------
EXT2 = box(0, 0, 56, 38).buffer(-6, join_style=1).buffer(6, join_style=1, resolution=16)
INT2 = EXT2.buffer(-WALL, join_style=1, resolution=24)
ZA = 2.5 + 16.0
PTS2 = [Point(28, INT2.bounds[1]), Point(28, INT2.bounds[3]), Point(INT2.bounds[0], 19), Point(INT2.bounds[2], 19)]
anel_t = ext(EXT2, 0, ZA) - ext(INT2, 2.5, ZA + 1)
for pt in PTS2:
    jan = janela(pt, 6.5)
    for i in range(12):
        z = ZA - ZC_DENTE - 1.5 + i * 0.25
        prof = max(0.0, 1.5 - abs(z + 0.125 - (ZA - ZC_DENTE)))
        if prof <= 0.2:
            continue
        anel_t = anel_t - ext(anel(INT2, prof, -0.05).intersection(jan), z - 0.01, z + 0.26)
salvar(limpar(anel_t), f"{OUT}/teste-2a-anel-travas-branco.stl")

def tampa_teste(bump, k):
    t = ext(EXT2.buffer(-0.05, join_style=1), ZA, ZA + 2.5)
    aro = anel(INT2, -0.25, -2.05)
    for pt in PTS2:
        aro = aro.difference(janela(pt, 6.0))
    t = t + ext(aro, ZA - 5.0, ZA + 0.1)
    for pt in PTS2:
        t = t + ext(anel(INT2, -0.25, -2.05).intersection(janela(pt, 5.0)), ZA - L_ABA, ZA + 0.1)
        for i in range(int(2 * (bump + 0.2) / 0.25) + 1):
            z = ZA - ZC_DENTE - (bump + 0.2) + i * 0.25
            alt = bump - abs(z + 0.125 - (ZA - ZC_DENTE))
            if alt <= 0.05:
                continue
            t = t + ext(anel(INT2, alt - 0.25, -0.5).intersection(janela(pt, 5.0)), z, z + 0.25)
    for i in range(k):
        t = t - Manifold.cylinder(10, 1.2, 1.2, 24).translate([8 + i * 4.5, 8, ZA - 1])
    t = t.transform(np.array([[1, 0, 0, 0], [0, -1, 0, 0], [0, 0, -1, 0]], float))   # face de fora para baixo
    return limpar(t)

tampas = None
for i, b in enumerate(DENTES_TESTE):
    t = tampa_teste(b, i + 1)
    tt = to_tri(t)
    pos = [(0, 0), (62, 0), (0, 44), (62, 44)][i]
    t = t.translate([-tt.bounds[0][0] + pos[0], -tt.bounds[0][1] + pos[1], -tt.bounds[0][2]])
    tampas = t if tampas is None else tampas + t
salvar(tampas, f"{OUT}/teste-2b-tampas-dentes.stl")

# ---------- teste 3 ----------
regiao = OUTER.difference(INNER).intersection(box(-1, -1, 42, 26)).union(BLOCO)
gaveta = ext(regiao, Z_FUNDO - 4.0, Z1) - ext(CANAL, Z_FUNDO, W + 1) - furo_usb() - janela_botoes()
salvar(limpar(gaveta), f"{OUT}/teste-3-gaveta-super-mini-branco.stl")

for f in sorted(os.listdir(OUT)):
    m = trimesh.load(f"{OUT}/{f}"); m.merge_vertices()
    print(f"{f:42s} fechada: {m.is_watertight}  tamanho {np.round(m.extents, 1)} mm")

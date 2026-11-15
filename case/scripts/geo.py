"""Geometria base da caixa: perfil do DN40, sistema de coordenadas da frente e funções de apoio.

Sistema de coordenadas da caixa (milímetros):
  x  profundidade, de 0 nas costas até a ponta da frente
  y  altura, de 0 na base
  z  largura, de 0 na lateral direita (fechada) até W na lateral esquerda (aberta, onde entra a tampa)

O corpo é impresso deitado sobre a lateral direita, então z é a altura na impressora.
"""
import math
import numpy as np
import trimesh
from shapely.geometry import Polygon, box
from manifold3d import Manifold, CrossSection

# ---------- medidas principais ----------
SC = 1.14       # escala do perfil do DN40 (o perfil original foi medido numa foto de lado)
DC = 40.25      # posição do centro da frente ao longo da face inclinada, a partir da quina de baixo
W = 104.0       # largura da caixa
WALL = 2.5      # espessura das paredes
OPEN = 20.2     # meia altura da abertura da frente no corpo
FL = 22.2       # meia altura da aba de trás da frente (a parte que corre nos trilhos)
Z0, Z1 = WALL, W - WALL   # a lateral direita fechada vai até Z0, a borda aberta fica em Z1
ZC = W / 2


def fillet(corners, step=0.5):
    """Polígono com cantos arredondados. corners: lista de ((x, y), raio)."""
    pts = []
    n = len(corners)
    for i in range(n):
        p = np.array(corners[(i - 1) % n][0], float)
        c = np.array(corners[i][0], float)
        q = np.array(corners[(i + 1) % n][0], float)
        r = corners[i][1]
        v1 = (p - c) / np.linalg.norm(p - c)
        v2 = (q - c) / np.linalg.norm(q - c)
        th = math.acos(max(-1, min(1, v1 @ v2)))
        t = r / math.tan(th / 2)
        p1 = c + v1 * t
        p2 = c + v2 * t
        bi = (v1 + v2) / np.linalg.norm(v1 + v2)
        cc = c + bi * (r / math.sin(th / 2))
        a1 = math.atan2(*(p1 - cc)[::-1])
        a2 = math.atan2(*(p2 - cc)[::-1])
        da = a2 - a1
        while da > math.pi:
            da -= 2 * math.pi
        while da < -math.pi:
            da += 2 * math.pi
        seg = max(6, int(abs(da) * r / step))
        for k in range(seg + 1):
            a = a1 + da * k / seg
            pts.append((cc[0] + r * math.cos(a), cc[1] + r * math.sin(a)))
    return pts


# Perfil lateral: canto de trás embaixo (O), queixo da frente (K), quina de cima da frente (A),
# início da rampa (R) e topo das costas (T), cada um com o seu raio de canto.
K = np.array([108.9 * SC, 0.0])
A = np.array([80.3 * SC, 52 * SC])
R = np.array([54.7 * SC, 37.1 * SC])
T = np.array([0.0, 37.1 * SC])
OUTER = Polygon(fillet([((0.0, 0.0), 2.0), (tuple(K), 10.0), (tuple(A), 3.5), (tuple(R), 4.0), (tuple(T), 3.0)]))
INNER = OUTER.buffer(-WALL, join_style=1, resolution=24)

# Coordenadas da frente: v ao longo da face (de cima para baixo), n para fora da face.
UP = (A - K) / np.linalg.norm(A - K)
EV = -UP
EN = np.array([UP[1], -UP[0]])
C0 = K + UP * DC


def fp(v, n):
    p = C0 + v * EV + n * EN
    return (float(p[0]), float(p[1]))


def frect(v0, v1, n0, n1):
    """Retângulo no plano do perfil, alinhado com a face inclinada da frente."""
    return Polygon([fp(v0, n0), fp(v1, n0), fp(v1, n1), fp(v0, n1)])


def cs(poly):
    """Polígono do shapely para CrossSection do manifold3d."""
    if poly.is_empty:
        return None
    if poly.geom_type == "MultiPolygon":
        out = None
        for g in poly.geoms:
            x = cs(g)
            out = x if out is None else out + x
        return out
    rings = [list(poly.exterior.coords)[:-1]] + [list(r.coords)[:-1] for r in poly.interiors]
    rings = [r if Polygon(r).exterior.is_ccw == (i == 0) else r[::-1] for i, r in enumerate(rings)]
    return CrossSection([np.array(r) for r in rings])


def ext(poly, z0, z1):
    """Extruda um perfil 2D ao longo da largura da caixa, de z0 a z1."""
    return cs(poly).extrude(z1 - z0).translate([0, 0, z0])


def bloco(x0, x1, y0, y1, z0, z1):
    return Manifold.cube([x1 - x0, y1 - y0, z1 - z0]).translate([x0, y0, z0])


def rrect(cx, cy, w, h, r):
    return box(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2).buffer(-r, join_style=1).buffer(r, join_style=1, resolution=16)


def anel(inner, o0, o1):
    """Faixa entre dois deslocamentos do contorno interno (positivo para dentro da parede)."""
    return inner.buffer(o0, join_style=1).difference(inner.buffer(o1, join_style=1))


def limpar(m):
    """Descarta pedaços soltos menores que 1 mm³ que sobram de cortes tangentes."""
    pecas = [p for p in m.decompose() if p.volume() > 1.0]
    out = pecas[0]
    for p in pecas[1:]:
        out = out + p
    return out


def to_tri(m):
    me = m.to_mesh()
    return trimesh.Trimesh(vertices=np.array(me.vert_properties)[:, :3], faces=np.array(me.tri_verts))


def salvar(m, caminho, transform=None):
    """Salva em STL, apoiado na mesa da impressora (canto mínimo na origem)."""
    t = to_tri(m)
    if transform is not None:
        t.apply_transform(transform)
    t.apply_translation(-t.bounds[0])
    t.export(caminho)
    return t

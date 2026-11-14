"""Gera os três STL da caixa na pasta saida/, já na posição da mesa da impressora.

    python gerar_pecas.py
"""
import os
import numpy as np
import trimesh
from caixa import *

os.makedirs("saida", exist_ok=True)
c, t, f = corpo(), tampa(), frente()

# corpo: deitado sobre a lateral direita, como foi modelado
tc = salvar(c, "saida/copacabana-corpo-branco.stl")
# tampa: virada com a face de fora para baixo
tt = salvar(t, "saida/copacabana-tampa-lateral-branco.stl", trimesh.transformations.rotation_matrix(np.pi, [0, 1, 0]))
# frente: face da frente para baixo, como foi modelada
tf = salvar(f, "saida/copacabana-frente-preto.stl")

for nome, m in (("corpo", tc), ("tampa", tt), ("frente", tf)):
    mm = m.copy(); mm.merge_vertices()
    print(f"{nome:7s} fechada para o fatiador: {mm.is_watertight}  tamanho {np.round(m.extents, 1)} mm  "
          f"PLA se fosse maciça: {round(m.volume * 1.24 / 1000)} g")

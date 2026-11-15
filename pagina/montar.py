"""Monta a página da placa (firmware/pagina/painel.js) e o protótipo que roda fora dela.

  python3 pagina/montar.py              # gera firmware/pagina/painel.js
  python3 pagina/montar.py prototipo.html  # também gera uma página avulsa, que entra em demonstração

Depois de mudar a página, compile o firmware: o painel.js vai embutido nele."""
import json, os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(AQUI, "painel.src.js")).read()
s = s.replace("__GLIFOS__", open(os.path.join(AQUI, "glifos.json")).read().strip())
s = s.replace('"__CSS__"', json.dumps(open(os.path.join(AQUI, "painel.css")).read()))
open(os.path.join(AQUI, "..", "firmware", "pagina", "painel.js"), "w").write(s)
print("firmware/pagina/painel.js:", len(s), "bytes")
if len(sys.argv) > 1:
    open(sys.argv[1], "w").write('<title>Página do painel</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<script>\n' + s + "\n</script>\n")
    print(sys.argv[1])

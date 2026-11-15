"""Monta o site paineldomar.com.br (docs/index.html, servido pelo GitHub Pages) a partir de
guia.src.html e telas.json. telas.json tem as telas do painel em 1 bit, desenhadas pelo mesmo
código da página da placa (gerar_telas.py, que roda no Playwright).

  python3 guia/montar.py
"""
import os
AQUI = os.path.dirname(os.path.abspath(__file__))
D = AQUI + "/"
s = open(D + "guia.src.html").read()
status='<span>10:15</span><span style="display:flex;gap:5px;align-items:center"><svg width="15" height="10" viewBox="0 0 15 10" fill="currentColor"><rect x="0" y="7" width="2.5" height="3" rx=".6"/><rect x="4" y="5" width="2.5" height="5" rx=".6"/><rect x="8" y="2.5" width="2.5" height="7.5" rx=".6"/><rect x="12" y="0" width="2.5" height="10" rx=".6"/></svg><svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M1 3.6a9 9 0 0 1 12 0M3.2 6a6 6 0 0 1 7.6 0"/><circle cx="7" cy="8.6" r=".9" fill="currentColor" stroke="none"/></svg><svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x=".6" y=".6" width="18.8" height="9.8" rx="2.6" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2"/><rect x="2.3" y="2.3" width="13" height="6.4" rx="1.4" fill="currentColor"/><path d="M20.8 3.8v3.4" stroke="currentColor" stroke-opacity=".45" stroke-width="1.3" stroke-linecap="round"/></svg></span>'
wifi='<svg width="16" height="13" viewBox="0 0 16 13" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><path d="M1.2 4.6a10 10 0 0 1 13.6 0M3.7 7.4a6.4 6.4 0 0 1 8.6 0"/><circle cx="8" cy="10.6" r="1.2" fill="#fff" stroke="none"/></svg>'
web='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.6"><circle cx="8" cy="8" r="6.4"/><path d="M1.8 8h12.4M8 1.6c2 2.2 2 10.6 0 12.8M8 1.6c-2 2.2-2 10.6 0 12.8"/></svg>'
s=s.replace("__STATUS__",status).replace("__ICONE_WIFI__",wifi).replace("__ICONE_WEB__",web).replace("__CADEADO__ ","")
s=s.replace("__TELAS__",open(D + "telas.json").read())
a='''    var A = modo === "preto" ? TINTA : PAPEL, B = modo === "preto" ? TINTA : TINTA;
    if (modo === "branco") B = PAPEL;
    var inv = modo === "invertido";'''
assert a in s
s=s.replace(a,'''    var A = PAPEL, B = TINTA, inv = modo === "invertido";''')
a='''        if (inv) v = 1 - v;'''
s=s.replace(a,'''        if (inv) v = 1 - v; else if (modo === "preto") v = 1; else if (modo === "branco") v = 0;''')
a='''    vd.style.left = (MM.frente[0] - MM.img[0]) / 2 * k + "px";
    vd.style.top = (MM.frente[1] - MM.img[1]) / 2 * k + "px";
    vd.style.width = MM.img[0] * k + "px"; vd.style.height = MM.img[1] * k + "px";
    vd.style.borderRadius = MM.vidro[2] * k + "px";
    /* o vidro visível vai até a borda de baixo do chanfro: 0,5 mm de vidro sem imagem em volta */'''
assert a in s
s=s.replace(a,'''    vd.style.borderRadius = MM.vidro[2] * k + "px";
    /* o vidro visível vai até a borda de baixo do chanfro: 0,5 mm de vidro sem imagem em volta */''')
s=s.replace("    var tl = vd.firstChild;\n","    vd.style.boxSizing = \"border-box\";\n    var tl = vd.firstChild;\n")

s = s.replace('<title>Painel do Mar</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n', "")
CABECALHO = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>Painel do Mar</title>\n<meta name="description" content="Como configurar o Painel do Mar: ligue na tomada, conecte no Wi-Fi pelo celular e escolha o lugar. Leva uns 3 minutos.">\n<meta name="theme-color" content="#f1f1ef">\n<meta property="og:type" content="website">\n<meta property="og:url" content="https://paineldomar.com.br/">\n<meta property="og:title" content="Painel do Mar">\n<meta property="og:description" content="Como configurar o seu Painel do Mar, passo a passo. Leva uns 3 minutos.">\n<meta property="og:image" content="https://paineldomar.com.br/og.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'%3E%3Crect x=\'2\' y=\'14\' width=\'60\' height=\'36\' rx=\'5\' fill=\'%23f4f4f1\' stroke=\'%23b9b9b4\' stroke-width=\'2\'/%3E%3Crect x=\'14\' y=\'22\' width=\'36\' height=\'20\' rx=\'2\' fill=\'%23d6d8d1\' stroke=\'%23999\' stroke-width=\'1.5\'/%3E%3Cpath d=\'M18 36c4-5 8 3 12-1s8 3 14-2\' fill=\'none\' stroke=\'%231e1f21\' stroke-width=\'2.4\' stroke-linecap=\'round\'/%3E%3C/svg%3E">\n'
s = CABECALHO + s.replace("<style>\n", "<style>\n:root { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }\n", 1)
s = s.replace("<main>", "</head>\n<body>\n<main>", 1) + "\n</body>\n</html>\n"
open(os.path.join(AQUI, "..", "docs", "index.html"), "w").write(s)
print("docs/index.html:", len(s), "bytes")

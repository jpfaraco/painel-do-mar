"""Gera glifos.json: os desenhos de cada letra das fontes do firmware, em 1 bit, para a página
desenhar a tela pixel por pixel igual ao painel. Precisa de: pip install freetype-py"""
import base64, json, os
import freetype
AQUI = os.path.dirname(os.path.abspath(__file__))
FONTES_DIR = os.path.join(AQUI, "..", "firmware", "fonts")
FL = freetype.FT_LOAD_RENDER | freetype.FT_LOAD_TARGET_MONO
TEXTO = " !%'(),-./0123456789:?@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz°áàâãäçéêèíìîñóòôõöúùûüÁÀÂÃÉÊÍÓÔÕÚÇÑ"
FONTES = {
    "po": ("PixelOperator.ttf", 16, TEXTO),
    "pob": ("PixelOperator-Bold.ttf", 16, TEXTO),
    "j": ("Jersey15.ttf", 27, TEXTO),
    "jg": ("Jersey15.ttf", 54, ",-.0123456789°"),
}
out = {}
for k, (arq, tam, letras) in FONTES.items():
    f = freetype.Face(os.path.join(FONTES_DIR, arq))
    f.set_pixel_sizes(tam, 0)
    g = {}
    for ch in letras:
        if f.get_char_index(ord(ch)) == 0:
            print("falta", k, repr(ch))
            continue
        f.load_char(ch, FL)
        gl = f.glyph
        b = gl.bitmap
        linhas = bytearray()
        bpr = (b.width + 7) // 8
        for y in range(b.rows):
            linhas += bytes(b.buffer[y * b.pitch:y * b.pitch + bpr])
        g[ch] = [gl.advance.x >> 6, gl.bitmap_left, gl.bitmap_top, b.width, b.rows, base64.b64encode(bytes(linhas)).decode()]
    out[k] = g
s = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
open(os.path.join(AQUI, "glifos.json"), "w").write(s)
print(len(s), "bytes")

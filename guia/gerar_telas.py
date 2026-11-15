import asyncio, json
from playwright.async_api import async_playwright
"""Gera guia/telas.json: as telas do painel em 1 bit para o site, desenhadas pelo código da
página da placa (firmware/pagina/painel.js). Precisa de: pip install playwright pillow."""
import os
AQUI = os.path.dirname(os.path.abspath(__file__))
D = AQUI + "/"
EXPORTA = '\n  window.__p = {\n    W: W, H: H,\n    render: function (tipo, e, esc, ipv) {\n      estado = e; escolhas = Object.assign({ grande: "ondas", q1: "agua", q2: "ar", q3: "vento", q4: "uv", baixo: "mare", nome: "" }, esc || {}); ip = ipv || "192.168.0.23";\n      var t = new Tela();\n      function qr(txt, x, y) { var m = gerarQR(txt); for (var yy = 0; yy < m.length * 3; yy++) for (var xx = 0; xx < m.length * 3; xx++) if (m[Math.floor(yy / 3)][Math.floor(xx / 3)]) t.pt(x + xx, y + yy, 1); }\n      if (tipo === "wifi") {\n        qr("WIFI:T:WPA;S:Painel do Mar;P:configurar;;", 8, 22);\n        var x = 110;\n        t.txt(x, 22, "j", "Configurar Wi-Fi");\n        t.txt(x, 42, "po", "Aponte a câmera para o");\n        t.txt(x, 55, "po", "código ou entre na rede");\n        t.txt(x, 70, "pob", "Painel do Mar");\n        t.txt(x, 83, "po", "senha:");\n        t.txt(x + t.larg("po", "senha: "), 83, "pob", "configurar");\n        t.txt(x, 104, "po", "Depois, escolha o Wi-Fi");\n        t.txt(x, 117, "po", "da casa (2,4 GHz) e a senha.");\n      } else if (tipo === "conectando") {\n        t.txt(6, 22, "j", "Painel do Mar");\n        t.txt(6, 60, "po", "conectando ao Wi-Fi...");\n      } else if (tipo !== "branco") desenhar(t);\n      var b = new Uint8Array(W * H / 8);\n      for (var i = 0; i < W * H; i++) if (t.px[i]) b[i >> 3] |= 128 >> (i & 7);\n      var str = ""; for (var k = 0; k < b.length; k++) str += String.fromCharCode(b[k]);\n      return btoa(str);\n    }\n  };\n'
src = open(os.path.join(AQUI, "..", "firmware", "pagina", "painel.js")).read()
INICIO = '  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();'
open(D + "harness.js", "w").write(src.replace(INICIO, EXPORTA))
T=1794748500000  # 2026-11-15 10:15 BRT
base=[0.33,0.29,0.17,-0.02,-0.25,-0.44,-0.52,-0.46,-0.29,-0.08,0.12,0.29,0.40,0.44,0.40,0.27,0.08,-0.13,-0.25,-0.24,-0.12,0.06,0.23,0.35]
dados={"d":1,"m":1,"n":"Copacabana","desc":"Rio de Janeiro, Brasil","c":1,"fz":-10800,"dia":15,"h":1.3,"dir":182,"p":9.8,"a":24.4,"ar":22.6,"s":23.1,"u":78,"v":14,"vd":135,"r":27,"uv":5,"ch":0,"tx":26,"tn":21,"sr":"05:01","ss":"18:13","mare":base+base}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.set_content("<html><body></body></html>")
        await pg.evaluate(f"Date.now=()=>{T};")
        await pg.add_script_tag(path=D+"harness.js")
        out={}
        out["wifi"]=await pg.evaluate("__p.render('wifi')")
        out["conectando"]=await pg.evaluate("__p.render('conectando')")
        out["lugar"]=await pg.evaluate("__p.render('lugar',{fz:-10800})")
        out["buscando"]=await pg.evaluate("__p.render('dados',{n:'Copacabana',desc:'Rio de Janeiro, Brasil',d:0,fz:-10800})")
        out["dados"]=await pg.evaluate("__p.render('dados',"+json.dumps(dados)+")")
        out["branco"]=await pg.evaluate("__p.render('branco')")
        json.dump(out,open(D+"telas.json","w"))
        # preview
        from PIL import Image
        import base64
        for k,v in out.items():
            bb=base64.b64decode(v); im=Image.new('L',(296,128),214)
            for i in range(296*128):
                if bb[i>>3]&(128>>(i&7)): im.putpixel((i%296,i//296),30)
        await b.close()
asyncio.run(main())

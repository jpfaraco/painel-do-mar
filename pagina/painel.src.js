/* Painel do Mar: página da placa.
   Roda servida pela própria placa (ESPHome web_server versão 1, com js_include e css_include)
   e também fora dela, em modo de demonstração, quando não encontra /events. */
(function () {
  "use strict";

  /* ---------- dados das fontes do firmware (gerados por glifos.py) ---------- */
  var G = __GLIFOS__;

  /* ---------- textos e opções ---------- */
  var QUADROS = [
    ["agua", "Temperatura da água", 1],
    ["ar", "Temperatura do ar", 0],
    ["sensacao", "Sensação térmica", 0],
    ["umidade", "Umidade do ar", 0],
    ["vento", "Vento", 0],
    ["rajadas", "Rajadas de vento", 0],
    ["uv", "Índice UV", 0],
    ["chuva", "Chuva prevista hoje", 0],
    ["potencia", "Potência das ondas", 1],
    ["periodo", "Período das ondas", 1],
    ["nascer", "Nascer do sol", 0],
    ["por", "Pôr do sol", 0]
  ];
  var GRANDES = [["ondas", "Altura das ondas", 1], ["temperatura", "Temperatura do ar", 0]];
  var BAIXOS = [["mare", "Curva da maré", 1], ["sol", "Nascer e pôr do sol", 0]];
  var TERRA = { q1: "sensacao", q2: "umidade", q3: "vento", q4: "uv" };
  var PARTES = {
    grande: { titulo: "Número grande", sub: "à esquerda", opcoes: GRANDES },
    q1: { titulo: "Quadro 1", sub: "em cima, à esquerda", opcoes: QUADROS },
    q2: { titulo: "Quadro 2", sub: "em cima, à direita", opcoes: QUADROS },
    q3: { titulo: "Quadro 3", sub: "embaixo, à esquerda", opcoes: QUADROS },
    q4: { titulo: "Quadro 4", sub: "embaixo, à direita", opcoes: QUADROS },
    baixo: { titulo: "Faixa de baixo", sub: "embaixo da tela", opcoes: BAIXOS }
  };
  /* áreas tocáveis, em pixels da tela de 296 × 128 */
  /* Grade das áreas, montada a partir das linhas da tela: linha do topo na y 24, divisória na x 148
     e linha de baixo na y 99. Cada área fica a uma margem igual das linhas, e o vão entre dois quadros
     vizinhos é o dobro da margem, igual na horizontal e na vertical. As contas são feitas em pixels
     inteiros da tela ampliada, para os vãos saírem iguais em qualquer tamanho de celular. */
  var PARTES_TELA = ["grande", "q1", "q2", "q3", "q4", "baixo"];
  var larguraTitulo = 60;
  function grade() {
    var s = canvas.getBoundingClientRect().width / W, r = Math.round;
    var m = Math.max(2, r(2 * s)), g = 2 * m;
    var esq = r(3 * s), dir = r(291 * s);
    var topo = r(25 * s) + m, fundo = r(99 * s) - m;
    var divE = r(148 * s) - m, divD = r(149 * s) + m;
    var qw = dir - divD - g, qh = fundo - topo - g, w1 = Math.floor(qw / 2), h1 = Math.floor(qh / 2);
    return {
      titulo: [esq, r(1 * s), Math.max(20, r((6 + larguraTitulo) * s) - esq), r(24 * s) - m - r(1 * s)],
      grande: [esq, topo, divE - esq, fundo - topo],
      q1: [divD, topo, w1, h1],
      q2: [divD + w1 + g, topo, qw - w1, h1],
      q3: [divD, topo + h1 + g, w1, qh - h1],
      q4: [divD + w1 + g, topo + h1 + g, qw - w1, qh - h1],
      baixo: [esq, r(100 * s) + m, dir - esq, r(127 * s) - r(100 * s) - m]
    };
  }
  function posicionar(b, a) { b.style.left = a[0] + "px"; b.style.top = a[1] + "px"; b.style.width = a[2] + "px"; b.style.height = a[3] + "px"; }
  function posicionarTudo() {
    if (!canvas) return;
    var gr = grade();
    document.querySelectorAll(".pd-area[data-parte]").forEach(function (b) { posicionar(b, gr[b.getAttribute("data-parte")]); });
    posicionar(document.getElementById("pd-a-lugar"), gr.titulo);
  }


  /* QR code igual ao do firmware (biblioteca qrcodegen, de Nayuki, correção baixa com reforço automático).
     Só modo byte e versões 1 a 4, o suficiente para "http://255.255.255.255/". */
  function gerarQR(texto) {
    var bytes = [];
    for (var i = 0; i < texto.length; i++) bytes.push(texto.charCodeAt(i) & 255);
    var ECCB = [[7, 10, 13, 17], [10, 16, 22, 28], [15, 26, 18, 22], [20, 18, 26, 16]];
    var BLOC = [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 2, 2], [1, 2, 2, 4]];
    var TOTAL = [26, 44, 70, 100], ALINHA = [[], [6, 18], [6, 22], [6, 26]];
    var FORMATO = [1, 0, 3, 2]; /* L, M, Q, H */
    var bitsUsados = 4 + 8 + bytes.length * 8, v, n;
    var dados = function (v, n) { return TOTAL[v] - ECCB[v][n] * BLOC[v][n]; };
    for (v = 0; v < 4 && dados(v, 0) * 8 < bitsUsados; v++);
    if (v === 4) return null;
    n = 0;
    for (var k = 1; k < 4; k++) if (bitsUsados <= dados(v, k) * 8) n = k;
    var cap = dados(v, n) * 8, bb = [];
    function poe(val, len) { for (var j = len - 1; j >= 0; j--) bb.push((val >>> j) & 1); }
    poe(4, 4); poe(bytes.length, 8); bytes.forEach(function (b) { poe(b, 8); });
    poe(0, Math.min(4, cap - bb.length)); poe(0, (8 - bb.length % 8) % 8);
    for (var pad = 0xEC; bb.length < cap; pad ^= 0xEC ^ 0x11) poe(pad, 8);
    var cw = [];
    for (i = 0; i < bb.length; i += 8) { var x = 0; for (var j = 0; j < 8; j++) x = (x << 1) | bb[i + j]; cw.push(x); }
    function mul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; }
    var nb = BLOC[v][n], le = ECCB[v][n], raw = TOTAL[v];
    var div = []; for (i = 0; i < le - 1; i++) div.push(0); div.push(1);
    for (var root = 1, a = 0; a < le; a++) { for (j = 0; j < le; j++) { div[j] = mul(div[j], root); if (j + 1 < le) div[j] ^= div[j + 1]; } root = mul(root, 2); }
    function resto(d) { var r = div.map(function () { return 0; }); d.forEach(function (b) { var f = b ^ r.shift(); r.push(0); for (var i = 0; i < le; i++) r[i] ^= mul(div[i], f); }); return r; }
    var curtos = nb - raw % nb, lc = Math.floor(raw / nb), blocos = [];
    for (i = 0, k = 0; i < nb; i++) {
      var dat = cw.slice(k, k + lc - le + (i < curtos ? 0 : 1)); k += dat.length;
      var ec = resto(dat); if (i < curtos) dat.push(0);
      blocos.push(dat.concat(ec));
    }
    var seq = [];
    for (i = 0; i < blocos[0].length; i++) for (j = 0; j < nb; j++) if (i !== lc - le || j >= curtos) seq.push(blocos[j][i]);
    var size = 21 + 4 * v, m = [], fn = [];
    for (i = 0; i < size; i++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function f(x, y, c) { m[y][x] = c; fn[y][x] = true; }
    for (i = 0; i < size; i++) { f(6, i, i % 2 === 0); f(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (p) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = p[0] + dx, yy = p[1] + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) f(xx, yy, d !== 2 && d !== 4);
      }
    });
    var al = ALINHA[v];
    for (i = 0; i < al.length; i++) for (j = 0; j < al.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) continue;
      for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++) f(al[i] + dx2, al[j] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1);
    }
    function formato(mask) {
      var d = FORMATO[n] << 3 | mask, r = d;
      for (var i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var b = ((d << 10) | r) ^ 0x5412, bit = function (i) { return ((b >>> i) & 1) !== 0; };
      for (i = 0; i <= 5; i++) f(8, i, bit(i));
      f(8, 7, bit(6)); f(8, 8, bit(7)); f(7, 8, bit(8));
      for (i = 9; i < 15; i++) f(14 - i, 8, bit(i));
      for (i = 0; i < 8; i++) f(size - 1 - i, 8, bit(i));
      for (i = 8; i < 15; i++) f(8, size - 15 + i, bit(i));
      f(8, size - 8, true);
    }
    formato(0);
    for (var ii = 0, dir = size - 1; dir >= 1; dir -= 2) {
      if (dir === 6) dir = 5;
      for (var vt = 0; vt < size; vt++) for (j = 0; j < 2; j++) {
        var xx = dir - j, yy = ((dir + 1) & 2) === 0 ? size - 1 - vt : vt;
        if (!fn[yy][xx] && ii < seq.length * 8) { m[yy][xx] = ((seq[ii >>> 3] >>> (7 - (ii & 7))) & 1) !== 0; ii++; }
      }
    }
    function mascara(k) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
        var inv = [(x + y) % 2, y % 2, x % 3, (x + y) % 3, (Math.floor(x / 3) + Math.floor(y / 2)) % 2, x * y % 2 + x * y % 3, (x * y % 2 + x * y % 3) % 2, ((x + y) % 2 + x * y % 3) % 2][k] === 0;
        if (!fn[y][x] && inv) m[y][x] = !m[y][x];
      }
    }
    function conta(h) { var n = h[1], c = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n; return (c && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (c && h[6] >= n * 4 && h[0] >= n ? 1 : 0); }
    function hist(len, h) { if (h[0] === 0) len += size; h.pop(); h.unshift(len); }
    function penalidade() {
      var p = 0, escuros = 0;
      for (var eixo = 0; eixo < 2; eixo++) for (var a = 0; a < size; a++) {
        var cor = false, run = 0, h = [0, 0, 0, 0, 0, 0, 0];
        for (var b = 0; b < size; b++) {
          var c = eixo ? m[b][a] : m[a][b];
          if (c === cor) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
          else { hist(run, h); if (!cor) p += conta(h) * 40; cor = c; run = 1; }
        }
        if (cor) { hist(run, h); run = 0; }
        run += size; hist(run, h); p += conta(h) * 40;
      }
      for (var y = 0; y < size - 1; y++) for (var x = 0; x < size - 1; x++) {
        var c2 = m[y][x]; if (c2 === m[y][x + 1] && c2 === m[y + 1][x] && c2 === m[y + 1][x + 1]) p += 3;
      }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) escuros++;
      var t = size * size;
      return p + (Math.ceil(Math.abs(escuros * 20 - t * 10) / t) - 1) * 10;
    }
    var melhor = 0, menor = Infinity;
    for (k = 0; k < 8; k++) { mascara(k); formato(k); var pp = penalidade(); if (pp < menor) { menor = pp; melhor = k; } mascara(k); }
    mascara(melhor); formato(melhor);
    return m;
  }

  /* ---------- estado ---------- */
  var demo = false;
  var estado = null;
  var escolhas = { grande: "ondas", q1: "agua", q2: "ar", q3: "vento", q4: "uv", baixo: "mare", nome: "" };
  var versao = { atual: "", nova: "", situacao: "" };
  var ip = location.hostname;

  /* ---------- formatação, igual à do firmware ---------- */
  function decimal(v) { return (Math.round(v * 10) / 10).toFixed(1).replace(".", ","); }
  function inteiro(v) { return String(Math.floor(v + 0.5)); }
  function vazio(v) { return v === null || v === undefined || isNaN(v); }
  function clima(c) {
    if (c === 0) return "céu limpo";
    if (c >= 1 && c <= 2) return "poucas nuvens";
    if (c === 45 || c === 48) return "neblina";
    if (c >= 95) return "trovoadas";
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "neve";
    if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return "chuva";
    return "nublado";
  }
  function nivelUV(u) { return u < 3 ? "baixo" : u < 6 ? "médio" : u < 8 ? "alto" : u < 11 ? "m. alto" : "extremo"; }
  var PONTOS = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];

  /* hora no lugar escolhido */
  function horaLocal() {
    var fz = estado && typeof estado.fz === "number" ? estado.fz : -10800;
    var d = new Date(Date.now() + fz * 1000);
    return { h: d.getUTCHours(), m: d.getUTCMinutes(), dia: d.getUTCDate() };
  }
  function doisDig(n) { return (n < 10 ? "0" : "") + n; }

  /* valor de cada quadro: [rótulo, valor, unidade] */
  function celula(k) {
    var e = estado;
    switch (k) {
      case "agua": return ["água", vazio(e.a) ? "--" : decimal(e.a) + "°", ""];
      case "ar": return ["ar", vazio(e.ar) ? "--" : decimal(e.ar) + "°", ""];
      case "sensacao": return ["sensação", vazio(e.s) ? "--" : decimal(e.s) + "°", ""];
      case "umidade": return ["umidade", vazio(e.u) ? "--" : inteiro(e.u), "%"];
      case "vento": return ["vento", vazio(e.v) ? "--" : inteiro(e.v), "km/h"];
      case "rajadas": return ["rajadas", vazio(e.r) ? "--" : inteiro(e.r), "km/h"];
      case "uv": return ["UV", vazio(e.uv) ? "--" : inteiro(e.uv), vazio(e.uv) ? "" : nivelUV(e.uv)];
      case "chuva": return ["chuva", vazio(e.ch) ? "--" : (e.ch < 10 ? decimal(e.ch) : inteiro(e.ch)), "mm"];
      case "potencia": return ["potência", vazio(e.h) || vazio(e.p) ? "--" : inteiro(0.49 * e.h * e.h * e.p), "kW/m"];
      case "periodo": return ["período", vazio(e.p) ? "--" : decimal(e.p), "s"];
      case "nascer": return ["nascer", e.sr || "--", ""];
      default: return ["pôr do sol", e.ss || "--", ""];
    }
  }
  function resumoOpcao(parte, k) {
    if (!estado || !estado.d) return "";
    if (parte === "grande") return k === "ondas" ? (vazio(estado.h) ? "--" : decimal(estado.h) + " m") : (vazio(estado.ar) ? "--" : decimal(estado.ar) + "°");
    if (parte === "baixo") return k === "mare" ? textoMare() : ((estado.sr || "--") + " às " + (estado.ss || "--"));
    var c = celula(k);
    return c[1] + (c[2] ? " " + c[2] : "");
  }
  function textoMare() {
    var m = (estado && estado.mare) || [];
    var t = horaLocal(), agora = t.h + t.m / 60;
    if (estado && estado.dia && t.dia !== estado.dia) agora += 24;
    for (var i = Math.floor(agora) + 1; i + 1 < m.length; i++) {
      if (m[i] > m[i - 1] && m[i] >= m[i + 1]) return "alta às " + (i % 24) + "h";
      if (m[i] < m[i - 1] && m[i] <= m[i + 1]) return "baixa às " + (i % 24) + "h";
    }
    return "";
  }

  /* ---------- desenho da tela, linha a linha como no firmware ---------- */
  var W = 296, H = 128;
  function Tela() { this.px = new Uint8Array(W * H); }
  Tela.prototype.pt = function (x, y, c) { if (x >= 0 && x < W && y >= 0 && y < H) this.px[y * W + x] = c === undefined ? 1 : c; };
  Tela.prototype.larg = function (f, s) { var w = 0, g = G[f]; for (var ch of s) { var q = g[ch] || g["?"]; if (q) w += q[0]; } return w; };
  Tela.prototype.txt = function (x, y, f, s, dir) {
    var g = G[f];
    if (dir === "r") x -= this.larg(f, s);
    for (var ch of s) {
      var q = g[ch] || g["?"];
      if (!q) continue;
      if (!q.b) { var bin = atob(q[5]); q.b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) q.b[i] = bin.charCodeAt(i); }
      var bpr = (q[3] + 7) >> 3;
      for (var yy = 0; yy < q[4]; yy++) for (var xx = 0; xx < q[3]; xx++)
        if ((q.b[yy * bpr + (xx >> 3)] >> (7 - (xx & 7))) & 1) this.pt(x + q[1] + xx, y - q[2] + yy);
      x += q[0];
    }
  };
  Tela.prototype.hl = function (x, y, w) { for (var i = 0; i < w; i++) this.pt(x + i, y); };
  Tela.prototype.vl = function (x, y, h) { for (var i = 0; i < h; i++) this.pt(x, y + i); };
  Tela.prototype.caixa = function (x, y, w, h) { for (var j = 0; j < h; j++) this.hl(x, y + j, w); };
  Tela.prototype.cabe = function (s, f, maxw) {
    if (this.larg(f, s) <= maxw) return s;
    var a = Array.from(s);
    while (a.length && this.larg(f, a.join("") + ".") > maxw) a.pop();
    return a.join("") + ".";
  };
  var ANEL = ["..#####..", ".#######.", "#########", "#########", "#########", "#########", "#########", ".#######.", "..#####.."];
  var PONTO = ["..###..", ".#####.", "#######", "#######", "#######", ".#####.", "..###.."];
  Tela.prototype.bolinha = function (cx, cy) {
    var r, k;
    for (r = 0; r < 9; r++) for (k = 0; k < 9; k++) if (ANEL[r][k] === "#") this.pt(cx - 4 + k, cy - 4 + r, 0);
    for (r = 0; r < 7; r++) for (k = 0; k < 7; k++) if (PONTO[r][k] === "#") this.pt(cx - 3 + k, cy - 3 + r, 1);
  };

  function nomeNaTela() { return (escolhas.nome || (estado && estado.n) || "Painel do Mar"); }

  /* estado null: a página ainda não ouviu a placa, e a tela fica em branco.
     Sem "n": a placa ainda não tem lugar e mostra a tela "Escolher o lugar". */
  function semLugar() { return !!estado && !estado.n; }
  /* t é a tela que a placa está mostrando: 2 é o QR code da página, 4 é a atualização */
  function telaEspecial() { return !!estado && (semLugar() || estado.t === 2 || estado.t === 4); }

  /* tela "Escolher o lugar", igual ao modo 2 do firmware */
  function desenharSemLugar(t) {
    var qr = gerarQR("http://" + ip + "/");
    if (qr) for (var y = 0; y < qr.length * 3; y++) for (var x = 0; x < qr.length * 3; x++) if (qr[Math.floor(y / 3)][Math.floor(x / 3)]) t.pt(8 + x, 24 + y, 1);
    var x0 = 110;
    t.txt(x0, 22, "j", "Escolher o lugar");
    t.txt(x0, 42, "po", "No celular, na rede da");
    t.txt(x0, 55, "po", "casa, aponte a câmera");
    t.txt(x0, 68, "po", "ou abra o endereço:");
    t.txt(x0, 84, "pob", t.cabe("http://" + ip, "pob", 290 - x0));
    if (estado && estado.n) {
      t.txt(x0, 104, "po", "Os dados aparecem");
      t.txt(x0, 117, "po", "em 30 segundos.");
    } else {
      t.txt(x0, 104, "po", "A tela atualiza quando");
      t.txt(x0, 117, "po", "você salvar o lugar.");
    }
  }

  function desenhar(t) {
    if (!estado) return;
    if (estado.t === 4) {
      t.txt(6, 22, "j", "Atualizando");
      t.txt(6, 60, "po", "Baixando a versão nova do painel.");
      t.txt(6, 76, "po", "Não tire da tomada. Leva uns 2 minutos.");
      return;
    }
    if (semLugar() || estado.t === 2) { desenharSemLugar(t); return; }
    var nome = nomeNaTela();
    if (!estado || !estado.d) {
      t.txt(6, 22, "j", t.cabe(nome, "j", 284));
      t.txt(6, 60, "po", estado && estado.f ? "sem dados, tentando de novo em 5 min" : "buscando dados...");
      return;
    }
    var e = estado, hl = horaLocal();
    var agora = hl.h + hl.m / 60;
    if (e.dia && hl.dia !== e.dia) agora += 24;
    var L1 = 37, V2 = 94, GAP = 4, by = 71, subY = 88;

    var direita = clima(e.c) + ", " + doisDig(hl.h) + ":" + doisDig(hl.m);
    var wd = t.larg("pob", direita);
    t.txt(6, 18, "j", t.cabe(nome, "j", 290 - wd - 16));
    t.txt(290, 18, "pob", direita, "r");
    t.hl(6, 24, 284);

    var mar = !!e.m;
    var g = mar ? escolhas.grande : "temperatura";
    var baixo = mar ? escolhas.baixo : "sol";
    var qs = ["q1", "q2", "q3", "q4"].map(function (q) {
      var k = escolhas[q];
      if (!mar && (k === "agua" || k === "potencia" || k === "periodo")) k = TERRA[q];
      return celula(k);
    });

    if (g === "ondas") {
      var dir = PONTOS[Math.floor(e.dir / 22.5 + 0.5) % 16];
      t.txt(6, L1, "po", "ondas");
      var alt = decimal(e.h), w = t.larg("jg", alt);
      t.txt(5, by, "jg", alt);
      t.txt(5 + w + 3, by, "j", "m");
      t.txt(6, subY, "pob", "de " + dir + ", " + decimal(e.p) + " s");
    } else {
      t.txt(6, L1, "po", "temperatura");
      t.txt(5, by, "jg", decimal(e.ar) + "°");
      t.txt(6, subY, "pob", "máx " + inteiro(e.tx) + "°, mín " + inteiro(e.tn) + "°");
    }
    t.vl(148, 30, 65);
    for (var i = 0; i < 4; i++) {
      var x = 154 + (i % 2) * 72, ly = i < 2 ? L1 : V2 - 15 - GAP, vy = i < 2 ? L1 + GAP + 15 : V2, c = qs[i];
      t.txt(x, ly, "po", c[0]);
      var vw = t.larg("j", c[1]);
      t.txt(x, vy, "j", c[1]);
      if (c[2]) t.txt(x + vw + 3, vy, "po", t.cabe(c[2], "po", 290 - (x + vw + 3)));
    }
    t.hl(6, 99, 284);

    if (baixo === "mare") {
      var m = e.mare || [];
      var mt = textoMare();
      t.txt(6, 112, "po", "maré");
      t.txt(6, 124, "pob", mt);
      if (m.length < 26) return;
      var nivel = function (h) {
        var j = Math.floor(h), f = h - j;
        var p = function (k) { return m[Math.max(0, Math.min(24, k))]; };
        var p0 = p(j - 1), p1 = p(j), p2 = p(j + 1), p3 = p(j + 2);
        return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
      };
      var vmin = 1e9, vmax = -1e9;
      for (var k = 0; k <= 24; k++) { vmin = Math.min(vmin, m[k]); vmax = Math.max(vmax, m[k]); }
      var folga = Math.max(0.1, (vmax - vmin) * 0.12); vmin -= folga; vmax += folga;
      var x0 = 6 + Math.max(t.larg("po", "maré"), t.larg("pob", mt)) + 10, x1 = 290, y0 = 104, y1 = 122;
      var Y = function (v) { return Math.floor(y1 - (v - vmin) / (vmax - vmin) * (y1 - y0) + 0.5); };
      var ya = -1;
      for (var xx = x0; xx <= x1; xx++) {
        var y = Y(nivel((xx - x0) * 24 / (x1 - x0)));
        var de = ya < 0 ? y : Math.min(y, ya), ate = ya < 0 ? y : Math.max(y, ya);
        t.vl(xx, de, ate - de + 2);
        if ((xx - x0) % 3 === 0) t.vl(xx, y, y1 - y);
        ya = y;
      }
      [6, 12, 18].forEach(function (hr) { t.vl(Math.floor(x0 + (x1 - x0) * hr / 24 + 0.5), y1 + 1, 3); });
      if (agora <= 24) t.bolinha(Math.floor(x0 + (x1 - x0) * agora / 24 + 0.5), Y(nivel(agora)));
    } else {
      var st = (e.sr || "") + " às " + (e.ss || "");
      t.txt(6, 112, "po", "sol");
      t.txt(6, 124, "pob", st);
      var sx0 = 6 + Math.max(t.larg("po", "sol"), t.larg("pob", st)) + 10, sx1 = 290, yb = 114;
      var hx = function (h) { return Math.floor(sx0 + (sx1 - sx0) * h / 24 + 0.5); };
      var horas = function (s) { return s && s.length >= 5 ? parseInt(s.slice(0, 2), 10) + parseInt(s.slice(3, 5), 10) / 60 : -1; };
      t.hl(sx0, yb, sx1 - sx0 + 1);
      var hn = horas(e.sr), hp = horas(e.ss);
      if (hn >= 0 && hp > hn) t.caixa(hx(hn), yb - 3, hx(hp) - hx(hn) + 1, 7);
      [6, 12, 18].forEach(function (hr) { t.vl(hx(hr), yb + 6, 3); });
      if (agora <= 24) t.bolinha(hx(agora), yb);
    }
  }

  function pintar(cv) {
    var t = pintarSo(cv);
    if (aberto && aberto.parte === "titulo") {
      var hl = horaLocal(), direita = estado && estado.d ? clima(estado.c) + ", " + doisDig(hl.h) + ":" + doisDig(hl.m) : "";
      var lim = estado && estado.d ? 290 - t.larg("pob", direita) - 16 : 284;
      larguraTitulo = Math.min(t.larg("j", t.cabe(nomeNaTela(), "j", lim)), lim) + 2;
      posicionarTudo();
    }
    return t;
  }
  /* A tela tem 296 × 128 pixels, e no celular cada um deles ocupa um número quebrado de pixels
     da tela do celular (3,3, por exemplo). Ampliar sem suavizar deixa uns pixels mais largos que
     outros. Aqui cada pixel do celular recebe a fração exata de tinta que cai dentro dele, então
     todos os pixels do painel saem do mesmo tamanho, com a borda suavizada em um pixel do celular. */
  var TINTA = [30, 31, 33], PAPEL = [214, 216, 209];
  function pesos(n, m) {
    /* para cada um dos m pixels do celular: [pixel do painel, peso dele, peso do seguinte] */
    var r = [], k = n / m;
    for (var i = 0; i < m; i++) {
      var a = i * k, b = (i + 1) * k, c = Math.floor(a), f = c + 1;
      r.push(b <= f || c + 1 >= n ? [Math.min(c, n - 1), 1, 0] : [c, (f - a) / k, (b - f) / k]);
    }
    return r;
  }
  var cachePesos = {};
  function pintarSo(cv) {
    var t = new Tela();
    desenhar(t);
    var largura = cv.getBoundingClientRect().width;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var w = Math.max(W, Math.round(largura * dpr)), h = Math.round(w * H / W);
    if (cv.width !== w) cv.width = w;
    if (cv.height !== h) cv.height = h;
    var chave = w + "x" + h;
    if (!cachePesos[chave]) cachePesos = (function () { var o = {}; o[chave] = [pesos(W, w), pesos(H, h)]; return o; })();
    var px = cachePesos[chave][0], py = cachePesos[chave][1];
    var ctx = cv.getContext("2d"), img = ctx.createImageData(w, h), d = img.data, p = t.px;
    for (var y = 0; y < h; y++) {
      var ry = py[y], l0 = ry[0] * W, l1 = Math.min(ry[0] + 1, H - 1) * W;
      for (var x = 0; x < w; x++) {
        var rx = px[x], c0 = rx[0], c1 = Math.min(c0 + 1, W - 1);
        var v = ry[1] * (rx[1] * p[l0 + c0] + rx[2] * p[l0 + c1]) + ry[2] * (rx[1] * p[l1 + c0] + rx[2] * p[l1 + c1]);
        var o = (y * w + x) * 4;
        d[o] = PAPEL[0] + (TINTA[0] - PAPEL[0]) * v;
        d[o + 1] = PAPEL[1] + (TINTA[1] - PAPEL[1]) * v;
        d[o + 2] = PAPEL[2] + (TINTA[2] - PAPEL[2]) * v;
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return t;
  }

  /* ---------- conversa com a placa ---------- */
  function enviar(dominio, nome, acao, campo, valor) {
    if (demo) return new Promise(function (ok) { setTimeout(ok, 450); });
    var url = "/" + dominio + "/" + encodeURIComponent(nome) + "/" + acao + (campo ? "?" + campo + "=" + encodeURIComponent(valor) : "");
    return fetch(url, { method: "POST" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
  }
  /* a página da placa tem o elemento <esp-app>; fora dela (no protótipo), a página entra em demonstração */
  var naPlaca = !!document.querySelector("esp-app");
  function ouvir() {
    var es;
    try { es = new EventSource("/events"); } catch (e) { if (!naPlaca) iniciarDemo(); return; }
    var recebeu = false;
    var tempo = setTimeout(function () { if (!recebeu && !naPlaca) { es.close(); iniciarDemo(); } }, 2500);
    function trata(ev) {
      recebeu = true; clearTimeout(tempo); conexao(true);
      var j; try { j = JSON.parse(ev.data); } catch (e) { return; }
      var id = j.id || "";
      var p = id.indexOf("/"), dom = id.slice(0, p), nome = id.slice(p + 1);
      if (dom === "text_sensor" && nome === "estado") {
        try { estado = JSON.parse(j.state || j.value || "null"); } catch (e) { return; }
        atualizar();
      } else if (dom === "select" && escolhas.hasOwnProperty(nome)) {
        if (!aberto) escolhas[nome] = j.value || j.state; atualizar();
      } else if (dom === "text" && nome === "nome") {
        if (!aberto) escolhas.nome = j.value || j.state || ""; atualizar();
      } else if (dom === "update") {
        versao.situacao = j.state || ""; versao.nova = j.value || "";
        if (j.current_version) versao.atual = j.current_version;
        atualizarPainel();
      } else if (dom === "text_sensor" && nome === "ip") {
        ip = j.state || ip; atualizarPainel();
      }
    }
    es.addEventListener("state", trata);
    es.addEventListener("state_detail_all", trata);
    es.onerror = function () {
      if (recebeu || naPlaca) { conexao(false); return; }
      es.close(); clearTimeout(tempo); iniciarDemo();
    };
  }

  function iniciarDemo(comLugar) {
    demo = true;
    var hl = new Date(Date.now() - 10800 * 1000);
    var base = [0.33, 0.29, 0.17, -0.02, -0.25, -0.44, -0.52, -0.46, -0.29, -0.08, 0.12, 0.29, 0.40, 0.44, 0.40, 0.27, 0.08, -0.13, -0.25, -0.24, -0.12, 0.06, 0.23, 0.35];
    estado = {
      d: 1, m: 1, n: "Copacabana", desc: "Rio de Janeiro, Brasil", c: 2, fz: -10800, dia: hl.getUTCDate(),
      h: 1.3, dir: 182, p: 9.8, a: 24.4, ar: 22.6, s: 23.1, u: 78, v: 14, r: 27, uv: 5, ch: 3, tx: 25, tn: 20,
      sr: "05:08", ss: "18:12", mare: base.concat(base)
    };
    versao = { atual: "1.2.0", nova: "1.2.0", situacao: "NO UPDATE" };
    ip = "192.168.100.123";
    /* link com #primeiro-uso: painel recém-ligado, ainda sem lugar */
    if (!comLugar && location.hash === "#primeiro-uso") estado = { fz: -10800 };
    conexao(true);
    atualizar();
    atualizarPainel();
  }

  /* ---------- interface ---------- */
  var css = "__CSS__";
  var raiz, canvas, aberto = null, toastTempo = null;

  function el(tag, attrs, filhos) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (filhos || []).forEach(function (f) { if (f) n.appendChild(typeof f === "string" ? document.createTextNode(f) : f); });
    return n;
  }

  function montar() {
    document.documentElement.lang = "pt-BR";
    document.title = "Painel do Mar";
    if (!document.querySelector('meta[name="viewport"]')) {
      var vp = document.createElement("meta");
      vp.name = "viewport"; vp.content = "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content";
      document.head.appendChild(vp);
    }
    var esp = document.querySelector("esp-app"); if (esp) esp.hidden = true;
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
    var velho = document.querySelector("article.markdown-body"); if (velho) velho.remove();

    canvas = el("canvas", { width: W, height: H, id: "pd-tela", "aria-hidden": "true" });
    var areas = el("div", { class: "pd-areas" });
    areas.appendChild(el("button", { class: "pd-area pd-area-titulo", id: "pd-a-lugar", type: "button", "aria-label": "Mudar o nome que aparece na tela", onclick: function () { if (estado && estado.n) abrirTitulo(); } }));
    PARTES_TELA.forEach(function (k) {
      areas.appendChild(el("button", {
        class: "pd-area", type: "button", "data-parte": k,
        "aria-label": PARTES[k].titulo + ", " + PARTES[k].sub,
        onclick: function () { abrirParte(k); }
      }));
    });

    raiz = el("main", { class: "pd" }, [
      el("header", { class: "pd-topo" }, [
        el("span", { class: "pd-marca", text: "Painel do Mar" }),
        el("span", { class: "pd-con", id: "pd-con" }, [el("i"), el("span", { id: "pd-con-txt", text: "Conectando" })])
      ]),
      el("section", { class: "pd-palco", "aria-label": "Tela do painel" }, [
        el("div", { class: "pd-frente", id: "pd-frente" }, [
          el("canvas", { class: "pd-chanfro", id: "pd-chanfro", "aria-hidden": "true" }),
          el("div", { class: "pd-vidro", id: "pd-vidro" }, [
            el("div", { class: "pd-tela-caixa" }, [canvas, areas]),
            el("div", { class: "pd-sombra", "aria-hidden": "true" })
          ])
        ]),
        el("p", { class: "pd-dica", id: "pd-dica", text: "Toque em qualquer parte marcada para trocar o que o painel mostra." })
      ]),
      el("section", { class: "pd-lista", "aria-label": "Lugar" }, [
        el("h2", { text: "Lugar" }),
        el("button", { class: "pd-linha", type: "button", onclick: function () { abrirLugar(); } }, [
          el("span", { class: "pd-linha-txt" }, [el("b", { id: "pd-lugar-nome", text: "Nenhum lugar escolhido" }), el("small", { id: "pd-lugar-desc", text: "Toque para procurar" })]),
          el("span", { class: "pd-seta", "aria-hidden": "true", text: "›" })
        ])
      ]),
      el("section", { class: "pd-lista pd-info", "aria-label": "Painel" }, [
        el("h2", { text: "Painel" }),
        el("dl", {}, [
          el("dt", { text: "Versão" }), el("dd", { id: "pd-versao", text: "..." }),
          el("dt", { text: "Endereço desta página" }), el("dd", { id: "pd-ip", text: ip })
        ]),
        el("div", { class: "pd-apagar", id: "pd-apagar" }, [
          el("button", { class: "pd-link pd-perigo", type: "button", id: "pd-apagar-btn", onclick: function () { document.getElementById("pd-apagar").classList.add("pd-confirma"); }, text: "Apagar Wi-Fi e lugar" }),
          el("div", { class: "pd-confirmar" }, [
            el("p", { text: "O painel esquece o Wi-Fi, o lugar e as escolhas da tela, reinicia e volta a mostrar \u201cConfigurar Wi-Fi\u201d. Esta página para de funcionar até alguém configurar de novo." }),
            el("div", { class: "pd-botoes" }, [
              el("button", { class: "pd-btn", type: "button", onclick: function () { document.getElementById("pd-apagar").classList.remove("pd-confirma"); }, text: "Cancelar" }),
              el("button", { class: "pd-btn pd-btn-perigo", type: "button", onclick: apagarTudo, text: "Apagar e reiniciar" })
            ])
          ])
        ])
      ]),
      el("div", { class: "pd-toast", id: "pd-toast", role: "status", "aria-live": "polite" }),
      el("div", { class: "pd-veu", id: "pd-veu", onclick: fechar }),
      el("div", { class: "pd-folha", id: "pd-folha", role: "dialog", "aria-modal": "true", "aria-labelledby": "pd-folha-titulo" })
    ]);
    document.body.appendChild(raiz);
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && aberto) fechar(); });
    window.addEventListener("resize", function () { moldura(); pintar(canvas); posicionarTudo(); });
    if (window.ResizeObserver) new ResizeObserver(function () { moldura(); pintar(canvas); posicionarTudo(); }).observe(document.getElementById("pd-frente"));
    moldura();
    setInterval(function () { if (estado && !aberto) atualizar(); }, 30000);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raiz.classList.add("pd-ensina");
      setTimeout(function () { raiz.classList.remove("pd-ensina"); }, 3200);
    }
  }

  /* ---------- moldura: a frente impressa em volta da tela ----------
     Medidas da peça "Frente" (mm). A janela tem 71,88 × 33,94 na face, com cantos de 2,06 mm,
     e afunila num chanfro de 3,5 mm de fundo até 67,86 × 29,92, quase sem canto, rente ao vidro.
     A área de imagem da tela tem 66,89 × 29,05. A página é a própria face branca da peça. */
  var MM = { face: [71.88, 33.94, 2.06], vidro: [67.86, 29.92, 0.35], img: [66.89, 29.05], fundo: 3.5, borda: 0.6 };
  var ultimaMoldura = "";
  function moldura() {
    var fr = document.getElementById("pd-frente"), cv = document.getElementById("pd-chanfro"), vd = document.getElementById("pd-vidro");
    if (!fr) return;
    var B = MM.borda, Wmm = MM.face[0] + 2 * B, Hmm = MM.face[1] + 2 * B;
    var Wa = fr.clientWidth, k = Wa / Wmm, Ha = Hmm * k;
    fr.style.height = Ha + "px";
    vd.style.left = (Wmm - MM.vidro[0]) / 2 * k + "px";
    vd.style.top = (Hmm - MM.vidro[1]) / 2 * k + "px";
    vd.style.width = MM.vidro[0] * k + "px";
    vd.style.height = MM.vidro[1] * k + "px";
    vd.style.padding = (MM.vidro[1] - MM.img[1]) / 2 * k + "px " + (MM.vidro[0] - MM.img[0]) / 2 * k + "px";
    vd.style.borderRadius = MM.vidro[2] * k + "px";
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var w = Math.round(Wa * dpr), h = Math.round(Ha * dpr), chave = w + "x" + h;
    if (chave === ultimaMoldura) return;
    ultimaMoldura = chave;
    cv.width = w; cv.height = h;
    pintarChanfro(cv, k * dpr);
  }

  function pintarChanfro(cv, px) {
    /* px: pixels do canvas por milímetro. Origem no centro da janela, y para baixo, z para fora da peça. */
    var ctx = cv.getContext("2d"), w = cv.width, h = cv.height;
    var img = ctx.createImageData(w, h), d = img.data;
    var F = MM.face, V = MM.vidro, D = MM.fundo;
    function caixa(x, y, hx, hy, r) {
      var qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r;
      var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
      return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r;
    }
    /* o contorno do chanfro na profundidade t (0 na face, 1 no vidro) */
    function dist(x, y, t) {
      return caixa(x, y, (F[0] + (V[0] - F[0]) * t) / 2, (F[1] + (V[1] - F[1]) * t) / 2, F[2] + (V[2] - F[2]) * t);
    }
    function prof(x, y) {
      var a = 0, b = 1;
      for (var i = 0; i < 18; i++) { var m = (a + b) / 2; if (dist(x, y, m) < 0) a = m; else b = m; }
      return (a + b) / 2;
    }
    /* luz de cima, um pouco da esquerda e de frente, como numa mesa perto da janela */
    var L = [-0.25, -0.55, 0.8], ln = Math.hypot(L[0], L[1], L[2]); L = L.map(function (c) { return c / ln; });
    /* a luz da sala é quase toda difusa: pouca diferença entre os lados, e o chanfro sempre um pouco
       mais escuro que a face, para a borda aparecer até do lado que recebe mais luz */
    var AMB = 0.8, DIF = 0.2, CHANFRO = 0.92;
    var e = 0.5 / px; /* meio pixel, em mm */
    for (var j = 0; j < h; j++) {
      var y = (j + 0.5) / px - (F[1] / 2 + MM.borda);
      for (var i = 0; i < w; i++) {
        var x = (i + 0.5) / px - (F[0] / 2 + MM.borda);
        var fora = dist(x, y, 0), dentro = dist(x, y, 1);
        if (fora > e * 2 || dentro < -e * 2) continue;
        var t = prof(x, y);
        var tx = (prof(x + e, y) - prof(x - e, y)) / (2 * e), ty = (prof(x, y + e) - prof(x, y - e)) / (2 * e);
        var nx = D * tx, ny = D * ty, nz = 1, nn = Math.hypot(nx, ny, nz);
        var luz = CHANFRO * (AMB + DIF * Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / nn) / L[2]);
        luz *= 1 - 0.14 * Math.pow(t, 1.6); /* o fundo do chanfro recebe menos luz */
        if (fora > -1.2 / px) luz *= 0.9; /* a quina entre a face e o chanfro */
        var v = Math.max(0, Math.min(1, luz));
        /* bordas suaves: contra a face (fora) e contra o vidro (dentro) */
        var a = Math.max(0, Math.min(1, 0.5 - fora * px)) * Math.max(0, Math.min(1, 0.5 + dentro * px));
        var o = (j * w + i) * 4;
        d[o] = 255 * v; d[o + 1] = 255 * v; d[o + 2] = 255 * Math.min(1, v * 1.01 + 0.005); d[o + 3] = 255 * a;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function atualizar() {
    var t = pintar(canvas);
    var tit = document.getElementById("pd-a-lugar");
    tit.hidden = !estado || telaEspecial();
    if (estado && estado.d) {
      var hl = horaLocal();
      var direita = clima(estado.c) + ", " + doisDig(hl.h) + ":" + doisDig(hl.m);
      var w = Math.min(t.larg("j", t.cabe(nomeNaTela(), "j", 290 - t.larg("pob", direita) - 16)), 240);
      larguraTitulo = w + 2;
    } else {
      larguraTitulo = t.larg("j", t.cabe(nomeNaTela(), "j", 284)) + 2;
    }
    posicionarTudo();
    var semMar = estado && estado.d && !estado.m;
    document.querySelectorAll(".pd-area[data-parte]").forEach(function (b) {
      var p = b.getAttribute("data-parte");
      b.hidden = !estado || !estado.d || telaEspecial() || (semMar && (p === "grande" || p === "baixo"));
    });
    document.getElementById("pd-lugar-nome").textContent = estado && estado.n ? estado.n : "Nenhum lugar escolhido";
    document.getElementById("pd-lugar-desc").textContent = estado && estado.desc ? estado.desc : estado && estado.n ? "Toque para trocar" : "Toque para procurar";
    document.getElementById("pd-dica").textContent = !estado ? "" :
      estado.t === 4 ? "O painel está instalando uma versão nova. Não tire da tomada." :
      estado.t === 2 && estado.n ? "O painel acabou de ligar. Os dados do lugar aparecem na tela em alguns segundos." :
      !estado.d
      ? (estado && estado.n ? "Buscando os dados do lugar. A tela muda sozinha quando chegarem." : "Para começar, toque em Lugar, aqui embaixo, e escolha o lugar que o painel vai acompanhar.")
      : semMar ? "Longe do mar, o painel mostra o tempo. Toque em qualquer parte marcada para trocar o que ele mostra." : "Toque em qualquer parte marcada para trocar o que o painel mostra.";
  }

  function atualizarPainel() {
    var v = document.getElementById("pd-versao");
    var s = versao.situacao;
    v.textContent = !versao.atual ? "..." :
      s === "INSTALLING" ? versao.atual + ", instalando a " + versao.nova :
      s === "UPDATE AVAILABLE" ? versao.atual + ", baixando a " + versao.nova :
      versao.atual;
    document.getElementById("pd-ip").textContent = ip;
  }

  function conexao(ok) {
    var c = document.getElementById("pd-con");
    c.classList.toggle("pd-off", !ok);
    document.getElementById("pd-con-txt").textContent = ok ? "Conectado" : "Sem conexão com o painel";
  }

  function toast(msg) {
    var t = document.getElementById("pd-toast");
    t.textContent = msg; t.classList.add("pd-on");
    clearTimeout(toastTempo);
    toastTempo = setTimeout(function () { t.classList.remove("pd-on"); }, 3600);
  }

  /* ---------- folhas (painéis que sobem de baixo) ---------- */
  var antesDeAbrir = null;
  /* Folha acima do teclado. No Chrome do Android, o interactive-widget do viewport já encolhe a página
     quando o teclado abre. No Safari, o teclado cobre a página e só a área visível (visualViewport)
     encolhe, então a folha sobe a altura do teclado. Com o teclado aberto, a folha pode crescer
     até o alto da área visível, para caber o campo e a lista de resultados. */
  function ajustarFolha() {
    var f = document.getElementById("pd-folha"), vv = window.visualViewport;
    if (!f) return;
    var alto = vv ? vv.height : window.innerHeight;
    var teclado = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
    var digitando = document.activeElement && document.activeElement.tagName === "INPUT" && f.contains(document.activeElement);
    f.style.bottom = teclado + "px";
    f.style.maxHeight = (digitando ? alto - 12 : Math.min(alto * 0.6, 560)) + "px";
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", ajustarFolha);
    window.visualViewport.addEventListener("scroll", ajustarFolha);
  }
  window.addEventListener("resize", ajustarFolha);
  document.addEventListener("focusin", function () { setTimeout(ajustarFolha, 50); });
  document.addEventListener("focusout", function () { setTimeout(ajustarFolha, 50); });

  function abrirFolha(conteudo, foco) {
    var f = document.getElementById("pd-folha");
    f.innerHTML = ""; f.appendChild(conteudo);
    antesDeAbrir = document.activeElement;
    raiz.classList.add("pd-aberta");
    setTimeout(function () { var x = foco ? f.querySelector(foco) : f.querySelector("button,input"); if (x) x.focus({ preventScroll: true }); }, 60);
  }
  function fechar() {
    if (!aberto) return;
    var parte = aberto;
    aberto = null;
    raiz.classList.remove("pd-aberta");
    document.querySelectorAll(".pd-area.pd-ativa").forEach(function (b) { b.classList.remove("pd-ativa"); });
    if (parte.desfazer) parte.desfazer();
    atualizar();
    if (antesDeAbrir && antesDeAbrir.focus) antesDeAbrir.focus({ preventScroll: true });
  }
  function cabecalho(titulo, sub) {
    return el("div", { class: "pd-folha-cab" }, [
      el("div", {}, [el("h3", { id: "pd-folha-titulo", text: titulo }), sub ? el("small", { text: sub }) : null]),
      el("button", { class: "pd-fechar", type: "button", "aria-label": "Fechar", onclick: fechar, text: "×" })
    ]);
  }

  function abrirParte(parte) {
    var def = PARTES[parte];
    var original = escolhas[parte];
    aberto = { parte: parte, desfazer: function () { escolhas[parte] = original; } };
    document.querySelector('.pd-area[data-parte="' + parte + '"]').classList.add("pd-ativa");
    var lista = el("div", { class: "pd-opcoes", role: "radiogroup", "aria-labelledby": "pd-folha-titulo" });
    def.opcoes.forEach(function (op) {
      var soMar = op[2] && !(estado && estado.m);
      var b = el("button", {
        class: "pd-opcao" + (op[0] === original ? " pd-sel" : "") + (soMar ? " pd-somar" : ""),
        type: "button", role: "radio", "aria-checked": String(op[0] === original),
        onmouseenter: function () { if (!soMar) { escolhas[parte] = op[0]; pintar(canvas); } },
        onmouseleave: function () { escolhas[parte] = original; pintar(canvas); },
        onclick: function () { escolher(parte, op[0], b); }
      }, [
        el("span", { class: "pd-opcao-nome", text: op[1] }),
        el("span", { class: "pd-opcao-valor", text: soMar ? "só perto do mar" : resumoOpcao(parte, op[0]) }),
        el("span", { class: "pd-marca-sel", "aria-hidden": "true" })
      ]);
      lista.appendChild(b);
    });
    abrirFolha(el("div", {}, [cabecalho(def.titulo, def.sub), lista]), ".pd-sel");
  }

  function escolher(parte, k, botao) {
    document.querySelectorAll(".pd-opcao").forEach(function (b) { b.classList.remove("pd-sel"); b.setAttribute("aria-checked", "false"); });
    botao.classList.add("pd-sel"); botao.setAttribute("aria-checked", "true");
    escolhas[parte] = k;
    aberto.desfazer = null;
    pintar(canvas);
    var nome = PARTES[parte].titulo;
    enviar("select", parte, "set", "option", k).then(function () {
      toast(nome + " salvo. O painel redesenha em alguns segundos.");
    }).catch(function () { toast("Não consegui falar com o painel. Confira se o celular está no Wi-Fi da casa."); });
    setTimeout(fechar, 220);
  }

  /* ---------- nome na tela ---------- */
  function abrirTitulo() {
    var original = escolhas.nome;
    aberto = { parte: "titulo", desfazer: function () { escolhas.nome = original; } };
    document.getElementById("pd-a-lugar").classList.add("pd-ativa");
    var t = new Tela();
    var campo = el("input", { id: "pd-nome", type: "text", maxlength: "24", value: original, placeholder: estado.n, autocomplete: "off", spellcheck: "false", enterkeyhint: "done", "aria-describedby": "pd-nome-ajuda",
      oninput: function () { escolhas.nome = campo.value.trim(); pintar(canvas); ajuda(); } });
    var ajudaEl = el("small", { id: "pd-nome-ajuda", class: "pd-ajuda" });
    function ajuda() {
      var v = campo.value.trim();
      var hl = horaLocal(), direita = estado.d ? clima(estado.c) + ", " + doisDig(hl.h) + ":" + doisDig(hl.m) : "";
      var lim = estado.d ? 290 - t.larg("pob", direita) - 16 : 284;
      var cabe = t.larg("j", v || estado.n) <= lim;
      ajudaEl.textContent = !cabe ? "Esse nome não cabe inteiro e vai aparecer cortado. Tente um mais curto."
        : v ? "Deixe em branco para voltar a usar “" + estado.n + "”."
        : "Em branco, a tela usa o nome do lugar.";
      ajudaEl.classList.toggle("pd-aviso", !cabe);
    }
    var form = el("form", { onsubmit: function (ev) { ev.preventDefault(); salvarTitulo(campo.value.trim()); } }, [
      cabecalho("Nome na tela", "o que aparece no alto, à esquerda"),
      campo, ajudaEl,
      el("div", { class: "pd-botoes" }, [
        el("button", { class: "pd-btn", type: "button", onclick: fechar, text: "Cancelar" }),
        el("button", { class: "pd-btn pd-btn-forte", type: "submit", text: "Salvar" })
      ])
    ]);
    abrirFolha(form, "#pd-nome");
    ajuda();
  }

  function salvarTitulo(nome) {
    if (nome === estado.n) nome = "";
    escolhas.nome = nome;
    aberto.desfazer = null;
    fechar();
    enviar("text", "nome", "set", "value", nome).then(function () {
      toast(nome ? "Nome salvo. O painel redesenha em alguns segundos." : "A tela volta a mostrar o nome do lugar.");
    }).catch(function () { toast("Não consegui falar com o painel. Confira se o celular está no Wi-Fi da casa."); });
  }

  /* ---------- busca de lugar ---------- */
  var buscaTempo = null, buscaSeq = 0;
  function abrirLugar() {
    aberto = { parte: "lugar" };
    var campo = el("input", { id: "pd-busca", type: "search", autocomplete: "off", spellcheck: "false", enterkeyhint: "search", placeholder: "Ipanema, Florianópolis, Arraial do Cabo", "aria-label": "Procurar lugar", oninput: function () { procurar(campo.value); } });
    var res = el("div", { class: "pd-resultados", id: "pd-resultados", role: "listbox", "aria-label": "Resultados" }, [el("p", { class: "pd-vazio", text: "Escreva o nome de um bairro, cidade ou praia. Você escolhe o certo na lista, com o estado e o país." })]);
    abrirFolha(el("div", {}, [
      cabecalho("Escolher o lugar", estado && estado.n ? "Agora: " + estado.n + (estado.desc ? ", " + estado.desc : "") : null),
      el("div", { class: "pd-busca" }, [campo]),
      res
    ]), "#pd-busca");
  }

  function procurar(q) {
    clearTimeout(buscaTempo);
    var res = document.getElementById("pd-resultados");
    q = q.trim();
    if (q.length < 2) { res.innerHTML = ""; res.appendChild(el("p", { class: "pd-vazio", text: "Escreva pelo menos duas letras." })); return; }
    var coords = q.match(/^\s*(-?\d+(?:[.,]\d+)?)\s*[,;]\s*(-?\d+(?:[.,]\d+)?)\s*$/);
    buscaTempo = setTimeout(function () {
      var seq = ++buscaSeq;
      if (coords) {
        var la = parseFloat(coords[1].replace(",", ".")), lo = parseFloat(coords[2].replace(",", "."));
        mostrarResultados([{ name: "Meu lugar", latitude: la, longitude: lo, country: "", admin1: la.toFixed(4) + ", " + lo.toFixed(4) }], seq);
        return;
      }
      res.classList.add("pd-carregando");
      if (demo) { setTimeout(function () { mostrarResultados(buscaDemo(q), seq); }, 350); return; }
      /* duas buscas ao mesmo tempo: lugares do Brasil primeiro, depois o resto do mundo */
      var base = "https://geocoding-api.open-meteo.com/v1/search?count=10&language=pt&format=json&name=" + encodeURIComponent(q);
      var pedir = function (u) { return fetch(u).then(function (r) { return r.json(); }).then(function (j) { return j.results || []; }); };
      Promise.all([pedir(base + "&countryCode=BR"), pedir(base)])
        .then(function (rs) {
          var vistos = {}, lista = [];
          rs[0].concat(rs[1].filter(function (r) { return r.country_code !== "BR"; })).forEach(function (r) {
            if (!vistos[r.id]) { vistos[r.id] = 1; lista.push(r); }
          });
          mostrarResultados(lista.slice(0, 12), seq);
        })
        .catch(function () {
          if (seq !== buscaSeq) return;
          res.classList.remove("pd-carregando"); res.innerHTML = "";
          res.appendChild(el("p", { class: "pd-vazio", text: "A busca não respondeu. Confira se o Wi-Fi da casa tem internet e tente de novo." }));
        });
    }, coords ? 0 : 280);
  }

  var LUGARES_DEMO = [
    ["Copacabana", "Rio de Janeiro", "Rio de Janeiro", "Brasil", -22.969, -43.186, "BR"],
    ["Copacabana", "", "Departamento de La Paz", "Bolívia", -16.17, -69.079, "BO"],
    ["Copacabana", "", "Antioquia", "Colômbia", 6.346, -75.509, "CO"],
    ["Copacabana", "", "Mato Grosso", "Brasil", -16.8, -55.867, "BR"],
    ["Ipanema", "Rio de Janeiro", "Rio de Janeiro", "Brasil", -22.984, -43.205, "BR"],
    ["Ipanema", "", "Minas Gerais", "Brasil", -19.799, -41.716, "BR"],
    ["Florianópolis", "", "Santa Catarina", "Brasil", -27.597, -48.549, "BR"],
    ["Arraial do Cabo", "", "Rio de Janeiro", "Brasil", -22.966, -42.028, "BR"],
    ["Armação dos Búzios", "", "Rio de Janeiro", "Brasil", -22.747, -41.882, "BR"],
    ["Belo Horizonte", "", "Minas Gerais", "Brasil", -19.921, -43.938, "BR"],
    ["Ubatuba", "", "São Paulo", "Brasil", -23.434, -45.071, "BR"]
  ];
  function semAcento(s) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function buscaDemo(q) {
    var n = semAcento(q);
    return LUGARES_DEMO.filter(function (l) { return semAcento(l[0]).indexOf(n) === 0; })
      .sort(function (a, b) { return (a[6] === "BR" ? 0 : 1) - (b[6] === "BR" ? 0 : 1); })
      .map(function (l) { return { name: l[0], admin2: l[1], admin1: l[2], country: l[3], latitude: l[4], longitude: l[5] }; });
  }

  function mostrarResultados(lista, seq) {
    if (seq !== buscaSeq) return;
    var res = document.getElementById("pd-resultados");
    res.classList.remove("pd-carregando"); res.innerHTML = "";
    if (!lista.length) { res.appendChild(el("p", { class: "pd-vazio", text: "Nenhum lugar com esse nome. Tente o nome da cidade." })); return; }
    lista.forEach(function (r) {
      var partes = [];
      if (r.admin2 && r.admin2 !== r.name) partes.push(r.admin2);
      if (r.admin1 && r.admin1 !== r.name && r.admin1 !== r.admin2) partes.push(r.admin1);
      if (r.country) partes.push(r.country);
      var desc = partes.join(", ");
      res.appendChild(el("button", { class: "pd-res", type: "button", role: "option", onclick: function () { salvarLugar(r, desc); } }, [
        el("b", { text: r.name }), el("small", { text: desc })
      ]));
    });
  }

  function salvarLugar(r, desc) {
    /* lugar novo, nome novo: um nome escolhido para o lugar antigo não serve mais */
    var nome = "";
    var valor = r.latitude.toFixed(4) + ";" + r.longitude.toFixed(4) + ";" + r.name.slice(0, 40) + ";" + desc.slice(0, 80);
    aberto.desfazer = null;
    escolhas.nome = nome;
    estado = { n: r.name, desc: desc, d: 0, fz: estado && estado.fz };
    fechar();
    enviar("text", "nome", "set", "value", nome)
      .then(function () { return enviar("text", "lugar", "set", "value", valor); })
      .then(function () {
        toast("Lugar salvo. Buscando os dados de " + r.name + "…");
        if (demo) setTimeout(function () { iniciarDemoLugar(r, desc); }, 1600);
      })
      .catch(function () { toast("Não consegui falar com o painel. Confira se o celular está no Wi-Fi da casa."); });
  }
  function iniciarDemoLugar(r, desc) {
    iniciarDemo(true);
    estado.n = r.name; estado.desc = desc;
    if (Math.abs(r.latitude + 19.9) < 3 && Math.abs(r.longitude + 44) < 3) estado.m = 0;
    atualizar();
  }

  function apagarTudo() {
    enviar("button", "apagar", "press").then(function () {
      document.getElementById("pd-apagar").classList.remove("pd-confirma");
      toast(demo ? "Na placa, o painel reiniciaria agora sem Wi-Fi nem lugar." : "Apagado. O painel está reiniciando e vai mostrar “Configurar Wi-Fi”.");
    });
  }

  /* ---------- início ---------- */
  function iniciar() { montar(); atualizar(); atualizarPainel(); ouvir(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();

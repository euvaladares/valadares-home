(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Entrada suave dos blocos -------------------------------------------
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var sibs = el.parentElement ? [].slice.call(el.parentElement.children).filter(function (c) { return c.classList.contains("reveal"); }) : [];
        el.style.transitionDelay = Math.min(sibs.indexOf(el), 6) * 70 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  // Funil: linhas que ligam as etapas ----------------------------------
  var funnel = document.getElementById("funnel");
  var fsvg = document.getElementById("funnel-lines");
  var SVGNS = "http://www.w3.org/2000/svg";

  function fbox(el) {
    var r = el.getBoundingClientRect(), b = funnel.getBoundingClientRect();
    return { l: r.left - b.left, r: r.right - b.left, t: r.top - b.top, b: r.bottom - b.top, cx: (r.left + r.right) / 2 - b.left, cy: (r.top + r.bottom) / 2 - b.top };
  }
  function fadd(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    fsvg.appendChild(n);
    return n;
  }
  function fcurve(x1, y1, x2, y2) {
    var dx = (x2 - x1) * 0.55;
    return "M" + x1 + " " + y1 + " C" + (x1 + dx) + " " + y1 + " " + (x2 - dx) + " " + y2 + " " + x2 + " " + y2;
  }
  // Cotovelo com cantos arredondados: sai na horizontal, desce/sobe em mx, entra na horizontal.
  function felbow(x1, y1, x2, y2, mx) {
    var r = Math.min(12, Math.abs(y2 - y1) / 2);
    if (r < 1) return "M" + x1 + " " + y1 + " H" + x2;
    var s = y2 > y1 ? 1 : -1;
    return "M" + x1 + " " + y1 + " H" + (mx - r) + " Q" + mx + " " + y1 + " " + mx + " " + (y1 + s * r) +
      " V" + (y2 - s * r) + " Q" + mx + " " + y2 + " " + (mx + r) + " " + y2 + " H" + x2;
  }

  function drawFunnel() {
    if (getComputedStyle(fsvg).display === "none") return;
    while (fsvg.firstChild) fsvg.removeChild(fsvg.firstChild);
    var W = funnel.clientWidth, H = funnel.clientHeight;
    fsvg.setAttribute("viewBox", "0 0 " + W + " " + H);

    var phone = fbox(document.getElementById("f-phone"));
    var ad = fbox(document.getElementById("f-ad"));
    var lead = fbox(document.getElementById("f-lead"));
    var sale = fbox(document.getElementById("f-sale"));
    var roi = fbox(document.getElementById("f-roi"));
    var loop = fbox(document.getElementById("f-loop"));

    // 01: canais alimentam o anúncio; 01 → 02: o anúncio leva para a página
    funnel.querySelectorAll('[data-f="ch"]').forEach(function (c, i) {
      var b = fbox(c);
      var ty = ad.cy + (i - 1.5) * 14;
      fadd("path", { d: fcurve(b.r, b.cy, ad.l, ty), class: "flow" });
    });
    fadd("circle", { cx: ad.l, cy: ad.cy, r: 3.5 });
    var inX = phone.l - 2, inY = phone.cy;
    [-36, 0, 36].forEach(function (off) {
      fadd("path", { d: fcurve(ad.r, ad.cy + off, inX, inY), class: "flow" });
    });
    fadd("circle", { cx: ad.r, cy: ad.cy, r: 3.5 });
    fadd("circle", { cx: inX, cy: inY, r: 3.5 });

    // 02 → 03: página distribui para o atendimento
    var outX = phone.r + 2, mx1 = phone.r + (lead.l - phone.r) / 2;
    fadd("path", { d: felbow(outX, phone.cy, lead.l, lead.cy, mx1), class: "solid" });
    fadd("circle", { cx: lead.l, cy: lead.cy, r: 3.5 });
    fadd("circle", { cx: outX, cy: phone.cy, r: 3.5 });

    // 03 → 04: atendimento vira venda
    var mx2 = lead.r + (sale.l - lead.r) / 2;
    [sale, roi].forEach(function (target) {
      fadd("path", { d: felbow(lead.r, lead.cy, target.l, target.cy, mx2), class: "flow" });
      fadd("circle", { cx: target.l, cy: target.cy, r: 3.5 });
    });
    fadd("circle", { cx: lead.r, cy: lead.cy, r: 3.5 });

    // 04 → 01: a venda volta para os anúncios
    var ly = loop.cy, sx = roi.cx, ax = ad.cx, r = 18;
    fadd("path", {
      d: "M" + sx + " " + roi.b + " V" + (ly - r) + " Q" + sx + " " + ly + " " + (sx - r) + " " + ly +
        " H" + (ax + r) + " Q" + ax + " " + ly + " " + ax + " " + (ly - r) + " V" + (ad.b + 8),
      class: "loop"
    });
    fadd("path", { d: "M" + (ax - 5) + " " + (ad.b + 10) + " L" + ax + " " + (ad.b + 2) + " L" + (ax + 5) + " " + (ad.b + 10) + " Z", class: "arrow" });
    fadd("circle", { cx: sx, cy: roi.b, r: 3.5 });
  }

  var fraf = null;
  function scheduleFunnel() { cancelAnimationFrame(fraf); fraf = requestAnimationFrame(drawFunnel); }
  if ("ResizeObserver" in window) new ResizeObserver(scheduleFunnel).observe(funnel);
  window.addEventListener("resize", scheduleFunnel);
  window.addEventListener("load", scheduleFunnel);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFunnel);
  funnel.querySelectorAll("img").forEach(function (img) { if (!img.complete) img.addEventListener("load", scheduleFunnel); });
  scheduleFunnel();

  // Barra flutuante -----------------------------------------------------
  var bar = document.getElementById("floatbar");
  var barLinks = bar.querySelectorAll("a");
  var barOn = false;
  function onScroll() {
    var on = window.scrollY > window.innerHeight * 0.7;
    if (on === barOn) return;
    barOn = on;
    bar.classList.toggle("is-on", on);
    bar.setAttribute("aria-hidden", on ? "false" : "true");
    barLinks.forEach(function (a) { a.tabIndex = on ? 0 : -1; });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Menu mobile ---------------------------------------------------------
  var burger = document.getElementById("burger");
  var links = document.getElementById("navlinks");
  burger.addEventListener("click", function () {
    var open = links.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      links.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }
  });

  // Jornada da Ana ------------------------------------------------------
  var STEPS = [
    { t: "O anúncio", d: "A Ana procura há meses um tratamento para manchas. Um anúncio da sua clínica aparece no Instagram falando exatamente disso. Ele não foi feito para todo mundo. Foi feito para ela.", img: "paciente-celular.jpg", l: "Frente: Mídia" },
    { t: "O site", d: "Ela clica e cai numa página que explica o tratamento, mostra quem é o médico e tira as dúvidas mais comuns. Deixa o WhatsApp, e o contato chega no CRM já dizendo qual anúncio a trouxe.", img: "mao-celular.jpg", l: "Frente: Ambiente" },
    { t: "O atendimento", d: "Em poucos minutos a recepção chama a Ana e agenda a avaliação. Se ela some, o sistema lembra a equipe de tentar de novo. Nenhum contato fica perdido numa conversa antiga.", img: "recepcao.jpg", l: "Frente: Vendas" },
    { t: "O aprendizado", d: "A Ana faz o procedimento e o valor fica registrado. Essa informação volta, de forma segura, para o Meta e o Google, que passam a procurar mais pessoas como ela. E menos curiosos.", img: "medico-consultorio.jpg", l: "O ciclo de dados" },
    { t: "O retorno", d: "Meses depois, o CRM avisa que é hora da revisão. A Ana volta. E você vê no relatório quanto ela já rendeu desde aquele primeiro anúncio.", img: "paciente-sorriso.jpg", l: "LTV medido" }
  ];

  var stepsEl = document.querySelector(".steps");
  var jText = document.querySelector(".journey__text");
  var jn = document.getElementById("jn");
  var jt = document.getElementById("jt");
  var jd = document.getElementById("jd");
  var jimg = document.getElementById("jimg");
  var jlabel = document.getElementById("jlabel");
  var cur = 0;
  var buttons = [];

  // Pré-carrega as fotos da jornada
  STEPS.forEach(function (s) { var i = new Image(); i.src = "assets/img/" + s.img; });

  STEPS.forEach(function (s, i) {
    if (i > 0) {
      var line = document.createElement("span");
      line.className = "step__line";
      stepsEl.appendChild(line);
    }
    var b = document.createElement("button");
    b.className = "step";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", "Etapa " + (i + 1) + ": " + s.t);
    b.addEventListener("click", function () { go(i, true); });
    stepsEl.appendChild(b);
    buttons.push(b);
  });

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function paint() {
    buttons.forEach(function (b, i) {
      b.classList.toggle("is-active", i === cur);
      b.classList.toggle("is-done", i < cur);
      b.setAttribute("aria-selected", i === cur ? "true" : "false");
      b.textContent = i === cur ? pad(i + 1) : "";
    });
  }

  function go(i, user) {
    i = (i + STEPS.length) % STEPS.length;
    if (i === cur && !user) return;
    cur = i;
    var s = STEPS[i];
    paint();
    jText.classList.add("is-swap");
    jimg.classList.add("is-swap");
    setTimeout(function () {
      jn.textContent = pad(i + 1) + " / " + pad(STEPS.length);
      jt.textContent = s.t;
      jd.textContent = s.d;
      jlabel.textContent = s.l;
      jimg.src = "assets/img/" + s.img;
      jText.classList.remove("is-swap");
      jimg.classList.remove("is-swap");
    }, reduce ? 0 : 320);
    if (user) restart();
  }

  document.getElementById("jprev").addEventListener("click", function () { go(cur - 1, true); });
  document.getElementById("jnext").addEventListener("click", function () { go(cur + 1, true); });

  var timer = null;
  var journeyVisible = false;
  function restart() {
    clearInterval(timer);
    if (reduce || !journeyVisible) return;
    timer = setInterval(function () { go(cur + 1); }, 6000);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      journeyVisible = entries[0].isIntersecting;
      restart();
    }, { threshold: 0.4 }).observe(document.getElementById("jornada"));
  }
  jn.textContent = "01 / " + pad(STEPS.length);
  paint();

  document.getElementById("year").textContent = new Date().getFullYear();
})();

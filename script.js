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

  // Contadores ----------------------------------------------------------
  var counters = document.querySelectorAll("[data-count]");
  function runCount(el) {
    var end = +el.getAttribute("data-count");
    if (reduce || end < 2) { el.textContent = end; return; }
    var t0 = null, dur = 1400;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    el.textContent = "0";
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

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
    { t: "O anúncio", d: "A Ana vê no Instagram um anúncio sobre o tratamento que procura. Ele foi feito para alcançar pessoas com real interesse, não qualquer pessoa.", img: "paciente-celular.jpg", l: "Frente: Mídia" },
    { t: "O site", d: "Ela clica e chega a uma página feita para a sua clínica, que explica o tratamento e facilita o contato. Tudo o que ela faz ali fica registrado.", img: "mao-celular.jpg", l: "Frente: Ambiente" },
    { t: "O contato", d: "A Ana deixa o WhatsApp. Na mesma hora o contato aparece no CRM da sua equipe, já com a informação de qual anúncio a trouxe.", img: "mulher-celular.jpg", l: "Origem registrada no CRM" },
    { t: "O atendimento", d: "Sua recepção vê a Ana no pipeline, liga e agenda a consulta. Se ela não responder, o sistema lembra a equipe de fazer o follow-up.", img: "recepcao.jpg", l: "Frente: Vendas" },
    { t: "A consulta e o tratamento", d: "A Ana comparece e faz o procedimento. O valor fica registrado no CRM.", img: "consulta-1.jpg", l: "Faturamento registrado" },
    { t: "O aprendizado", d: "Esse resultado é enviado de forma segura ao Meta e ao Google. Eles passam a procurar mais pessoas parecidas com a Ana — gente que de fato vira paciente.", img: "medico-consultorio.jpg", l: "O ciclo de dados" },
    { t: "O retorno", d: "Meses depois, o CRM lembra a equipe de chamar a Ana para a revisão. Ela volta. O relatório mostra quanto a Ana já rendeu desde aquele primeiro anúncio.", img: "paciente-sorriso.jpg", l: "LTV medido" }
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

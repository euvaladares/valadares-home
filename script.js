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

  // Diagnóstico (formulário estilo Typeform) ---------------------------
  // Tudo fica num único <form>: o Astro CRM (no <head>) copia o envio na fase de captura,
  // então o evento de envio só pode acontecer depois que todas as etapas estiverem válidas.
  var quiz = document.getElementById("quiz");
  var qForm = document.getElementById("quiz-form");
  var qSteps = [].slice.call(qForm.querySelectorAll(".q[data-step]:not(.q--done)"));
  var qDone = qForm.querySelector(".q--done");
  var qBar = document.getElementById("quiz-bar");
  var qErr = document.getElementById("quiz-error");
  var qNext = document.getElementById("quiz-next");
  var qSubmit = document.getElementById("quiz-submit");
  var qActions = qForm.querySelector(".q__actions");
  var qTel = qForm.elements.telefone;
  var qCur = 0;
  var qSent = false;
  var qLastFocus = null;
  var qAuto = null;

  function qShow(i) {
    clearTimeout(qAuto);
    qCur = Math.max(0, Math.min(i, qSteps.length - 1));
    qSteps.forEach(function (s, n) {
      s.classList.toggle("is-active", n === qCur);
      s.classList.toggle("is-past", n < qCur);
    });
    var last = qCur === qSteps.length - 1;
    qNext.hidden = last;
    qSubmit.hidden = !last;
    qErr.textContent = "";
    qBar.style.width = (qCur / qSteps.length) * 100 + "%";
    document.getElementById("quiz-prev").disabled = qCur === 0;
    document.getElementById("quiz-fwd").disabled = last;
    var focusEl = qSteps[qCur].querySelector(".q__input:not([hidden])") || qSteps[qCur].querySelector("input:checked") || qSteps[qCur].querySelector("input[type=radio]");
    if (focusEl) setTimeout(function () { focusEl.focus({ preventScroll: true }); }, reduce ? 0 : 380);
  }

  function qCheck(i) {
    var step = qSteps[i];
    var radio = step.querySelector("input[type=radio]");
    if (radio) {
      var picked = step.querySelector("input[type=radio]:checked");
      if (!picked) return "Escolha uma opção para continuar.";
      var other = step.querySelector(".q__other");
      if (picked.value === "Outro" && other.value.trim().length < 2) return "Conte qual é, para continuar.";
      return "";
    }
    var input = step.querySelector(".q__input");
    var v = input.value.trim();
    if (!v) return "Preencha este campo para continuar.";
    if (input.name === "nome" && (v.replace(/[^A-Za-zÀ-ÿ]/g, "").length < 2)) return "Digite seu nome.";
    if (input.name === "clinica" && v.length < 2) return "Digite o nome da clínica.";
    if (input === qTel && !qPhoneOk(v)) return "Informe um WhatsApp válido, com DDD.";
    return "";
  }

  // DDD de 11 a 99, 10 ou 11 dígitos, celular começando com 9 e sem sequências repetidas.
  function qPhoneOk(v) {
    var d = v.replace(/\D/g, "");
    if (d.length < 10 || d.length > 11) return false;
    if (+d.slice(0, 2) < 11) return false;
    if (d.length === 11 && d.charAt(2) !== "9") return false;
    if (/^(\d)\1+$/.test(d.slice(2))) return false;
    return true;
  }

  // Trava de segurança: roda na fase de captura da janela, antes do Astro CRM (que escuta no document).
  // Se faltar qualquer resposta, o envio é cancelado e o CRM nunca recebe os dados.
  var qOpenedAt = 0;
  window.addEventListener("submit", function (e) {
    if (e.target !== qForm) return;
    var problem = null;
    for (var i = 0; i < qSteps.length && !problem; i++) {
      var msg = qCheck(i);
      if (msg) problem = { i: i, msg: msg };
    }
    var bot = qForm.elements.website.value !== "" || Date.now() - qOpenedAt < 2500;
    if (problem || bot) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (problem) { qShow(problem.i); qFail(problem.msg); }
      return;
    }
    [].forEach.call(qForm.querySelectorAll(".q__input"), function (el) { el.value = el.value.trim().replace(/\s+/g, " "); });
  }, true);

  function qFail(msg) {
    qErr.textContent = msg;
    qSteps[qCur].classList.remove("is-shake");
    void qSteps[qCur].offsetWidth;
    qSteps[qCur].classList.add("is-shake");
  }

  function qForward() {
    var msg = qCheck(qCur);
    if (msg) { qFail(msg); return; }
    if (qCur === qSteps.length - 1) {
      if (qForm.requestSubmit) qForm.requestSubmit(qSubmit); else qSubmit.click();
    } else {
      qShow(qCur + 1);
    }
  }

  function qOpen(e) {
    if (e) e.preventDefault();
    qLastFocus = document.activeElement;
    if (qSent) {
      qForm.reset();
      qSent = false;
      qForm.classList.remove("is-done");
      qForm.querySelectorAll(".q__other").forEach(function (o) { o.hidden = true; });
      qSubmit.disabled = false;
    }
    qOpenedAt = Date.now();
    quiz.hidden = false;
    document.documentElement.classList.add("quiz-open");
    requestAnimationFrame(function () { quiz.classList.add("is-open"); });
    qShow(0);
    if (window.fbq) fbq("trackCustom", "AbriuDiagnostico");
  }

  function qClose() {
    quiz.classList.remove("is-open");
    document.documentElement.classList.remove("quiz-open");
    setTimeout(function () { quiz.hidden = true; }, reduce ? 0 : 300);
    if (qLastFocus) qLastFocus.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-quiz], a.btn[href="#contato"], a.ask').forEach(function (el) {
    el.addEventListener("click", qOpen);
  });
  document.getElementById("quiz-close").addEventListener("click", qClose);
  document.getElementById("quiz-finish").addEventListener("click", qClose);
  document.getElementById("quiz-prev").addEventListener("click", function () { qShow(qCur - 1); });
  document.getElementById("quiz-fwd").addEventListener("click", qForward);
  qNext.addEventListener("click", qForward);

  // Botão de envio: bloqueia antes do envio se algo estiver faltando.
  qSubmit.addEventListener("click", function (e) {
    for (var i = 0; i < qSteps.length; i++) {
      var msg = qCheck(i);
      if (msg) { e.preventDefault(); qShow(i); qFail(msg); return; }
    }
  });

  qForm.addEventListener("submit", function (e) {
    e.preventDefault();
    qSent = true;
    qSubmit.disabled = true;
    qBar.style.width = "100%";
    qForm.classList.add("is-done");
    if (window.fbq) {
      fbq("track", "Lead", {
        content_name: "Diagnóstico — Site Valadares",
        content_category: qForm.elements.especialidade.value
      });
    }
    setTimeout(function () { document.getElementById("quiz-finish").focus(); }, 400);
  });

  qForm.addEventListener("change", function (e) {
    var t = e.target;
    if (t.type !== "radio") return;
    var step = t.closest(".q");
    var other = step.querySelector(".q__other");
    qErr.textContent = "";
    if (t.value === "Outro") {
      other.hidden = false;
      other.focus();
    } else {
      other.hidden = true;
      other.value = "";
      clearTimeout(qAuto);
      qAuto = setTimeout(qForward, reduce ? 0 : 420);
    }
  });

  qForm.addEventListener("input", function (e) {
    qErr.textContent = "";
    if (e.target.name === "nome") {
      var first = e.target.value.trim().split(/\s+/)[0];
      qForm.querySelectorAll(".q__name").forEach(function (s) { s.textContent = first ? ", " + first : ""; });
    }
  });

  qTel.addEventListener("input", function () {
    var d = qTel.value.replace(/\D/g, "").slice(0, 11);
    var out = d;
    if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length > 7) out = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
    qTel.value = out;
  });

  quiz.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { qClose(); return; }
    if (qSent) return;
    if (e.key === "Enter") {
      // Impede o envio implícito do formulário pelo Enter (que dispararia a captura do CRM antes da hora).
      if (e.target.tagName === "BUTTON" && e.target !== qSubmit) return;
      e.preventDefault();
      qForward();
      return;
    }
    if (e.key === "Tab") {
      var f = [].slice.call(quiz.querySelectorAll("button:not([hidden]):not([disabled]), input:not([type=hidden]):not([hidden]):not([tabindex='-1'])")).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      return;
    }
    // Letras A–F escolhem a opção, como no Typeform.
    if (e.target.matches && e.target.matches(".q__input") || e.metaKey || e.ctrlKey || e.altKey) return;
    var opts = qSteps[qCur].querySelectorAll("input[type=radio]");
    var idx = "abcdef".indexOf(e.key.toLowerCase());
    if (opts.length && idx > -1 && e.key.length === 1 && opts[idx]) {
      e.preventDefault(); // senão a letra cai no campo "Outro", que recebe o foco em seguida
      opts[idx].checked = true;
      opts[idx].dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  document.getElementById("year").textContent = new Date().getFullYear();
})();

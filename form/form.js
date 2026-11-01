(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Diagnóstico (formulário estilo Typeform, página /form) -------------
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
    // Um único event_id por envio. Vai no campo oculto (o Astro copia para o CRM) e no fbq,
    // que repassa o mesmo id ao gateway da API de Conversões. Assim o Meta deduplica os dois Leads.
    if (!qForm.elements.event_id.value) qForm.elements.event_id.value = qNewEventId();
  }, true);

  function qNewEventId() {
    if (window.crypto && crypto.randomUUID) return "lead_" + crypto.randomUUID();
    return "lead_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 12);
  }

  // Dados do usuário para a correspondência avançada. O pixel aplica o hash (SHA-256)
  // antes de enviar, tanto no navegador quanto na cópia que vai para o servidor.
  var PIXEL_ID = "1157603070025919";
  function qUserData() {
    var plain = function (v) { return v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]/g, "").trim(); };
    var parts = plain(qForm.elements.nome.value).split(/\s+/).filter(Boolean);
    var digits = qTel.value.replace(/\D/g, "");
    var ud = { country: "br" };
    if (digits.length >= 10) ud.ph = "55" + digits;
    if (parts.length) ud.fn = parts[0];
    if (parts.length > 1) ud.ln = parts[parts.length - 1];
    return ud;
  }

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
      fbq("init", PIXEL_ID, qUserData());
      fbq("track", "Lead", {
        content_name: "Diagnóstico — Site Valadares",
        content_category: qForm.elements.especialidade.value
      }, { eventID: qForm.elements.event_id.value });
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

  // Início ---------------------------------------------------------------
  qOpenedAt = Date.now();
  qShow(0);
  if (window.fbq) fbq("trackCustom", "AbriuDiagnostico");
})();

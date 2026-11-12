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

  // Abas do hero: trocam a tela mostrada no navegador -------------------
  // Avançam sozinhas a cada 6 s enquanto estão na tela; param de vez quando a pessoa escolhe uma aba.
  var tabs = [].slice.call(document.querySelectorAll(".tab"));
  var shots = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
  var curTab = 0;
  function showTab(i, focus) {
    curTab = (i + tabs.length) % tabs.length;
    tabs.forEach(function (t, n) {
      var on = n === curTab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      shots[n].classList.toggle("is-on", on);
    });
    if (focus) tabs[curTab].focus();
    // No celular a barra de abas rola para o lado: centraliza a aba ativa sem mexer na página.
    var strip = tabs[0].parentElement, t = tabs[curTab];
    if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }
  var auto = null;
  function stopAuto() { clearInterval(auto); auto = null; }
  tabs.forEach(function (t, n) {
    t.addEventListener("click", function () { stopAuto(); showTab(n); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        stopAuto();
        showTab(curTab + (e.key === "ArrowRight" ? 1 : -1), true);
      }
    });
  });
  if (!reduce && "IntersectionObserver" in window) {
    var stopped = false;
    tabs[0].parentElement.addEventListener("click", function () { stopped = true; });
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !stopped && !auto) {
        auto = setInterval(function () { if (!document.hidden) showTab(curTab + 1); }, 6000);
      } else if (!entries[0].isIntersecting) {
        stopAuto();
      }
    }, { threshold: 0.35 }).observe(document.querySelector(".shots__stage"));
  }

  // FAQ: abre e fecha com animação, um de cada vez -----------------------
  var qas = [].slice.call(document.querySelectorAll(".qa"));
  function qaSet(d, open) {
    var from = d.getBoundingClientRect().height;
    if (d._anim) { d._anim.cancel(); clearTimeout(d._done); }
    d.classList.toggle("is-closing", !open);
    d.open = true;
    var to = open ? d.getBoundingClientRect().height : d.querySelector("summary").getBoundingClientRect().height;
    if (reduce) { d.open = open; d.classList.remove("is-closing"); return; }
    d._anim = d.animate({ height: [from + "px", to + "px"] }, { duration: 420, easing: "cubic-bezier(.22, 1, .36, 1)" });
    // Um timer (e não o fim da animação) fecha o estado, para nunca ficar preso no meio.
    d._done = setTimeout(function () {
      d._anim.cancel();
      d._anim = null;
      d.open = open;
      d.classList.remove("is-closing");
    }, 440);
  }
  qas.forEach(function (d) {
    d.querySelector("summary").addEventListener("click", function (e) {
      e.preventDefault();
      var open = !d.open || d.classList.contains("is-closing");
      if (open) qas.forEach(function (o) { if (o !== d && o.open && !o.classList.contains("is-closing")) qaSet(o, false); });
      qaSet(d, open);
    });
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();

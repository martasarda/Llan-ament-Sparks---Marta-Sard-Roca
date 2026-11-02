(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /*  Escala: 1 px de disseny = --u */
  var DESIGN_WIDTH = 1512;
  var MAX_WIDTH = 1920;
  var unit = 1;

  function setUnit() {
    // clientWidth no compta la barra de scroll, així no hi ha scroll horitzontal
    unit = Math.min(root.clientWidth, MAX_WIDTH) / DESIGN_WIDTH;
    root.style.setProperty("--u", unit + "px");
  }
  setUnit();
  window.addEventListener("resize", function () {
    setUnit();
    requestParallax();
  });

  /* Menú */
  var menu = document.getElementById("menu");
  var page = document.getElementById("top");
  var opener = null;

  function focusables() {
    return Array.prototype.slice.call(menu.querySelectorAll("a[href], button"));
  }

  function openMenu(trigger) {
    opener = trigger || null;
    menu.hidden = false;
    page.inert = true;
    root.classList.add("menu-open");
    if (opener) opener.setAttribute("aria-expanded", "true");
    requestAnimationFrame(function () {
      menu.classList.add("is-open");
      var first = focusables()[0];
      if (first) first.focus({ preventScroll: true });
    });
  }

  function closeMenu() {
    if (!menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    root.classList.remove("menu-open");
    page.inert = false;
    if (opener) {
      opener.setAttribute("aria-expanded", "false");
      opener.focus({ preventScroll: true });
    }
    window.setTimeout(function () {
      if (!menu.classList.contains("is-open")) menu.hidden = true;
    }, 400);
  }

  document.querySelectorAll("[data-menu-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openMenu(btn);
    });
  });
  menu.querySelectorAll("[data-menu-close]").forEach(function (el) {
    el.addEventListener("click", closeMenu); // els enllaços continuen navegant a la seva ancora
  });
  document.addEventListener("keydown", function (e) {
    if (!menu.classList.contains("is-open")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key === "Tab") {
      var f = focusables();
      if (!f.length) return;
      var first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* Live Sparks */
  var live = document.getElementById("live");
  var items = live
    ? Array.prototype.slice.call(live.querySelectorAll(".live__item"))
    : [];

  // foto: inclinació en repòs, lazy d'entrada, durada i direcció
  items.forEach(function (el, i) {
    var d = parseFloat(el.getAttribute("data-depth")) || 0;
    el._depth = d;
    el._cy =
      parseFloat(el.style.getPropertyValue("--y")) +
      parseFloat(el.style.getPropertyValue("--h")) / 2;
    el.style.setProperty("--rot", (el.getAttribute("data-rot") || 0) + "deg");
    el.style.setProperty("--delay", ((i % 3) * 0.12).toFixed(2) + "s");
    el.style.setProperty("--dur", (7 + ((i * 1.7) % 5)).toFixed(1) + "s");
    el.style.setProperty("--dx", i % 2 ? -6 : 6);
    el.style.setProperty("--dy", i % 3 === 0 ? 10 : -10);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var reveal = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            reveal.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    items.forEach(function (el) {
      reveal.observe(el);
    });
  }

  // Parallax: cada foto es desplaça una mica segons l'scroll...
  var ticking = false;
  var liveVisible = false;

  function updateParallax() {
    ticking = false;
    if (reduceMotion || !live) return;
    var top = live.getBoundingClientRect().top;
    var vh = window.innerHeight;
    var limit = 150 * unit;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var center = top + el._cy * unit;
      var dy = (center - vh / 2) * el._depth;
      dy = Math.max(-limit, Math.min(limit, dy));
      el.style.setProperty("--py", dy.toFixed(1) + "px");
    }
  }

  function requestParallax() {
    if (ticking || !liveVisible) return;
    ticking = true;
    requestAnimationFrame(updateParallax);
  }

  if (live && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        liveVisible = entries[0].isIntersecting;
        if (liveVisible) requestParallax();
      },
      { rootMargin: "200px 0px 200px 0px" },
    ).observe(live);
  } else {
    liveVisible = true;
  }
  window.addEventListener("scroll", requestParallax, { passive: true });
  requestParallax();
})();

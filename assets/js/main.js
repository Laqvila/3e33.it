/* 3e33.it - interazioni del sito.
   Nessuna dipendenza, nessun cookie, nessuna chiamata a servizi esterni
   finche' il visitatore non lo chiede (video YouTube, post Facebook). */
(function () {
  "use strict";
  var d = document, w = window;
  var reduce = !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var each = function (sel, fn, root) { Array.prototype.forEach.call((root || d).querySelectorAll(sel), fn); };

  /* 1. Testata: ombra quando la pagina scorre */
  var header = d.querySelector(".site-header");
  if (header) {
    var ticking = false;
    var paint = function () { header.classList.toggle("is-scrolled", w.scrollY > 8); ticking = false; };
    w.addEventListener("scroll", function () { if (!ticking) { ticking = true; w.requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }

  /* 2. Menu su telefono. La chiusura "fuori dal menu" usa pointerdown e non
     focusout: Safari su iPhone toglie il focus prima del click sulla voce. */
  var toggle = d.querySelector(".nav-toggle"), nav = d.getElementById("site-nav");
  if (toggle && nav) {
    var label = toggle.querySelector(".nav-toggle-label");
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (label) label.textContent = open ? "Chiudi" : "Menu";
    };
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
    d.addEventListener("pointerdown", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    w.addEventListener("resize", function () { if (w.innerWidth > 960 && nav.classList.contains("is-open")) setOpen(false); });
  }

  /* 3. "Carica altri" nella griglia delle notizie */
  each("[data-load-more]", function (btn) {
    var grid = d.getElementById(btn.getAttribute("aria-controls"));
    var step = parseInt(btn.getAttribute("data-step"), 10) || 6;
    var status = btn.parentNode.querySelector(".load-status");
    btn.addEventListener("click", function () {
      var hidden = grid.querySelectorAll(".is-extra"), first = null, n = 0;
      for (var i = 0; i < hidden.length && i < step; i++) {
        hidden[i].classList.remove("is-extra");
        hidden[i].classList.add("in");
        if (!first) first = hidden[i];
        n++;
      }
      var left = grid.querySelectorAll(".is-extra").length;
      if (status) status.textContent = n + " articoli aggiunti" + (left ? "" : ", non ce ne sono altri");
      if (first) { var a = first.querySelector(".card-title a"); if (a) a.focus({ preventScroll: true }); }
      if (!left) btn.hidden = true;
    });
  });

  /* 4. Carosello della rassegna stampa */
  each("[data-carousel]", function (box) {
    var track = box.querySelector(".carousel-track");
    var slides = track ? track.children : [];
    if (!track || slides.length < 2) return;
    var prev = box.querySelector(".carousel-prev"), next = box.querySelector(".carousel-next");
    var dots = box.querySelector(".carousel-dots");
    var timer = null, stopped = reduce, hover = false;

    var slideW = function () {
      var s = slides[0].getBoundingClientRect().width;
      var gap = parseFloat(w.getComputedStyle(track).columnGap) || 0;
      return s + gap;
    };
    var perView = function () { return Math.max(1, Math.round(track.clientWidth / slideW())); };
    var maxStart = function () { return Math.max(0, slides.length - perView()); };
    var current = function () { return Math.round(track.scrollLeft / slideW()); };
    var go = function (i) {
      var m = maxStart();
      if (i > m) i = 0;
      if (i < 0) i = m;
      track.scrollTo({ left: slides[i].offsetLeft, behavior: reduce ? "auto" : "smooth" });
    };
    var buildDots = function () {
      if (!dots) return;
      dots.innerHTML = "";
      for (var i = 0; i <= maxStart(); i++) {
        var b = d.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Vai all'immagine " + (i + 1));
        (function (k) { b.addEventListener("click", function () { stop(); go(k); }); })(i);
        dots.appendChild(b);
      }
      mark();
    };
    var mark = function () {
      if (!dots) return;
      var c = Math.min(current(), maxStart());
      Array.prototype.forEach.call(dots.children, function (b, i) { b.setAttribute("aria-current", i === c ? "true" : "false"); });
    };
    var stop = function () { stopped = true; if (timer) { clearInterval(timer); timer = null; } };
    var start = function () {
      if (stopped || timer) return;
      timer = setInterval(function () { if (!hover && !d.hidden) go(current() + 1); }, 5000);
    };
    if (prev) prev.addEventListener("click", function () { stop(); go(current() - 1); });
    if (next) next.addEventListener("click", function () { stop(); go(current() + 1); });
    box.addEventListener("mouseenter", function () { hover = true; });
    box.addEventListener("mouseleave", function () { hover = false; });
    box.addEventListener("focusin", function () { hover = true; });
    box.addEventListener("focusout", function () { hover = false; });
    track.addEventListener("pointerdown", stop);
    track.addEventListener("wheel", function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stop(); }, { passive: true });
    var raf = false;
    track.addEventListener("scroll", function () { if (!raf) { raf = true; w.requestAnimationFrame(function () { mark(); raf = false; }); } }, { passive: true });
    var rt = null;
    w.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(buildDots, 150); });
    buildDots();
    start();
  });

  /* 5. Video YouTube caricati solo su richiesta (youtube-nocookie) */
  each(".yt[data-id] .yt-btn", function (btn) {
    btn.addEventListener("click", function () {
      var box = btn.closest(".yt"), id = box.getAttribute("data-id");
      var f = d.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
      f.title = btn.getAttribute("data-title") || "Video YouTube";
      f.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      f.setAttribute("allowfullscreen", "");
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      btn.parentNode.replaceChild(f, btn);
      f.focus();
    });
  });

  /* 6. Post della pagina Facebook caricati solo su richiesta */
  each("[data-fb-load]", function (btn) {
    btn.addEventListener("click", function () {
      var box = btn.closest(".fb-box"), frame = box.querySelector(".fb-frame");
      var f = d.createElement("iframe");
      f.src = btn.getAttribute("data-fb-load");
      f.title = "Post recenti della pagina Facebook dell'Associazione 3:33";
      f.setAttribute("scrolling", "no");
      f.setAttribute("allow", "clipboard-write; encrypted-media; picture-in-picture; web-share");
      frame.innerHTML = "";
      frame.appendChild(f);
      frame.hidden = false;
      btn.hidden = true;
    });
  });

  /* 7. Ingrandimento delle foto negli articoli */
  var zoomables = d.querySelectorAll(".prose figure img, .gallery img");
  if (zoomables.length && typeof w.HTMLDialogElement === "function") {
    var dlg = d.createElement("dialog");
    dlg.className = "lightbox";
    dlg.setAttribute("aria-label", "Immagine ingrandita");
    dlg.innerHTML = '<button class="lightbox-close" type="button" aria-label="Chiudi">&times;</button><img alt="">';
    d.body.appendChild(dlg);
    var big = dlg.querySelector("img");
    dlg.querySelector(".lightbox-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { big.removeAttribute("src"); });
    Array.prototype.forEach.call(zoomables, function (img) {
      if (img.closest("a")) return;
      img.classList.add("is-zoomable");
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Ingrandisci: " + (img.alt || "immagine"));
      var open = function () { big.src = img.currentSrc || img.src; big.alt = img.alt; dlg.showModal(); };
      img.addEventListener("click", open);
      img.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  }

  /* 8. Condivisione */
  each("[data-share-native]", function (b) {
    if (!navigator.share) return;
    b.hidden = false;
    b.addEventListener("click", function () {
      navigator.share({ title: d.title, url: b.getAttribute("data-share-native") }).catch(function () {});
    });
  });
  each("[data-copy]", function (b) {
    b.addEventListener("click", function () {
      var url = b.getAttribute("data-copy"), st = b.parentNode.querySelector(".share-status");
      var done = function () {
        if (!st) return;
        st.textContent = "Link copiato";
        setTimeout(function () { st.textContent = ""; }, 2500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { w.prompt("Copia il link:", url); });
      } else { w.prompt("Copia il link:", url); }
    });
  });

  /* 9. Video di sfondo della home: sorgente adatta allo schermo, pausa
     quando non e' visibile, pulsante pausa/riproduci (WCAG 2.2.2) */
  var hv = d.querySelector(".hero-video");
  if (hv) {
    var hbtn = d.querySelector(".hero-toggle");
    var userPaused = reduce;
    var small = w.matchMedia("(max-width: 767px)").matches;
    var setBtn = function () {
      if (!hbtn) return;
      var paused = hv.paused;
      hbtn.setAttribute("aria-pressed", paused ? "true" : "false");
      hbtn.setAttribute("aria-label", paused ? "Riproduci il video di sfondo" : "Metti in pausa il video di sfondo");
      hbtn.classList.toggle("is-paused", paused);
    };
    /* il video resta invisibile (si vede la copertina) finche' non parte davvero:
       se il browser blocca l'autoplay non compare mai un fotogramma fermo */
    var play = function () {
      var p = hv.play();
      if (p && p.catch) p.catch(function () { setBtn(); });
    };
    hv.muted = true;
    hv.src = small ? hv.getAttribute("data-src-small") : hv.getAttribute("data-src");
    hv.addEventListener("playing", function () { hv.classList.add("is-playing"); setBtn(); });
    hv.addEventListener("play", setBtn);
    hv.addEventListener("pause", setBtn);
    if (!userPaused) play();
    setBtn();
    if (hbtn) {
      hbtn.hidden = false;
      hbtn.addEventListener("click", function () {
        if (hv.paused) { userPaused = false; play(); } else { userPaused = true; hv.pause(); }
      });
    }
    if ("IntersectionObserver" in w) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { if (!userPaused) play(); } else if (!hv.paused) hv.pause(); });
      }).observe(hv);
    }
  }

  /* 10. Comparsa morbida degli elementi. Soglia 0 e rete di sicurezza al
     caricamento: nessun contenuto deve poter restare invisibile. */
  var rv = d.querySelectorAll(".reveal");
  if (rv.length) {
    var showAll = function () { Array.prototype.forEach.call(rv, function (el) { el.classList.add("in"); }); };
    if (reduce || !("IntersectionObserver" in w)) { showAll(); }
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0, rootMargin: "0px 0px -5% 0px" });
      Array.prototype.forEach.call(rv, function (el) { io.observe(el); });
      w.addEventListener("load", function () { setTimeout(showAll, 2500); });
    }
  }
})();

/* Dit is ASV'33 — werking van de website.
   Inhoud (teksten, afbeeldingen, posities) staat in inhoud.js */
(function () {
  "use strict";
  var D = window.ASV;
  if (!D) { document.body.insertAdjacentHTML("afterbegin", '<p class="geenjs">Het bestand inhoud.js ontbreekt.</p>'); return; }

  var LOC = D.locaties, K = D.kaart;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var rustig = window.matchMedia("(prefers-reduced-motion: reduce)");
  var isMobiel = function () { return window.matchMedia("(max-width: 820px)").matches; };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var wacht = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---------- teksten uit inhoud.js ---------- */
  $$("[data-tekst]").forEach(function (el) { var k = el.getAttribute("data-tekst"); if (D.site[k]) el.textContent = D.site[k]; });

  /* ---------- afbeeldingen ---------- */
  // "naam" = img/naam.webp + img/naam-klein.webp; "foto.jpg" (met extensie) = precies dat bestand
  function heeftExt(naam) { return /\.[a-z0-9]{3,4}$/i.test(naam); }
  var voorbeeld = {}; // nieuwe foto's uit de bewerkmodus die nog niet zijn opgeslagen
  function pad(naam) { return voorbeeld[naam] || "img/" + naam + (heeftExt(naam) ? "" : ".webp"); }
  function padKlein(naam) { return heeftExt(naam) ? pad(naam) : "img/" + naam + "-klein.webp"; }
  // Bouwt een <img> met kleine en grote versie; zonder klein-versie alleen groot
  function beeld(naam, alt, o) {
    o = o || {};
    var los = o.alleenGroot || heeftExt(naam);
    var src = los ? pad(naam) : padKlein(naam);
    var srcset = los ? "" : ' srcset="' + padKlein(naam) + ' 760w, ' + pad(naam) + ' 1800w" sizes="' + (o.sizes || "(max-width: 820px) 100vw, 640px") + '"';
    return '<img src="' + src + '"' + srcset + ' alt="' + esc(alt) + '" data-bestand="' + esc(pad(naam)) + '"' +
      (o.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' + (o.cls ? ' class="' + o.cls + '"' : "") + ">";
  }
  // Ontbrekend bestand: geen kapotte pagina, maar een duidelijke melding
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (!t || t.tagName !== "IMG" || !t.getAttribute("data-bestand") || t.getAttribute("data-fout")) return;
    t.setAttribute("data-fout", "1");
    var d = document.createElement("div");
    d.className = "ontbreekt";
    d.textContent = "Afbeelding ontbreekt: " + t.getAttribute("data-bestand");
    if (t.parentNode) t.parentNode.replaceChild(d, t);
  }, true);

  /* =====================================================================
     KAART (lichte eigen pan/zoom voor één afbeelding)
     ===================================================================== */
  var kaart = $("#kaart"), laag = $("#kaartLaag"), kImg = $("#kaartBeeld"), mkVak = $("#markers"), hint = $("#kaartHint");
  var W = K.breedte, H = K.hoogte;
  var st = { s: 1, tx: 0, ty: 0 }, cw = 0, ch = 0, anim = null;

  kImg.style.width = W + "px"; kImg.style.height = H + "px";
  kImg.alt = K.alt;
  kImg.src = K.afbeelding;
  kImg.addEventListener("error", function () {
    if (K.reserve && kImg.src.indexOf(K.reserve) < 0) { kImg.src = K.reserve; return; }
    var f = document.createElement("div"); f.className = "kaart__fout";
    f.textContent = "De luchtfoto (" + K.afbeelding + ") kon niet worden geladen. Gebruik de locatieknoppen hieronder.";
    kaart.appendChild(f);
  });

  function minS() { return Math.max(cw / W, ch / H); } // nooit lege randen naast de luchtfoto
  function maxS() { return K.maxZoom || 3; }
  function begrens(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function klem(s) {
    s.s = begrens(s.s, minS(), maxS());
    var iw = W * s.s, ih = H * s.s;
    s.tx = iw <= cw ? (cw - iw) / 2 : begrens(s.tx, cw - iw, 0);
    s.ty = ih <= ch ? (ch - ih) / 2 : begrens(s.ty, ch - ih, 0);
    return s;
  }
  function teken() {
    laag.style.transform = "translate3d(" + st.tx + "px," + st.ty + "px,0) scale(" + st.s + ")";
    markers.forEach(function (m) {
      var x = st.tx + m.loc.x * W * st.s, y = st.ty + m.loc.y * H * st.s;
      m.el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    });
  }
  function parkSchaal() {
    var p = K.sportpark, pad_ = isMobiel() ? 10 : 24;
    return begrens(Math.min((cw - 2 * pad_) / ((p.x2 - p.x1) * W), (ch - 2 * pad_) / ((p.y2 - p.y1) * H)), minS(), maxS());
  }
  function doelPark() {
    var p = K.sportpark, s = parkSchaal();
    return { s: s, cx: (p.x1 + p.x2) / 2 * W, cy: (p.y1 + p.y2) / 2 * H, ax: cw / 2, ay: ch / 2 };
  }
  function naarStaat(d) { return klem({ s: d.s, tx: d.ax - d.cx * d.s, ty: d.ay - d.cy * d.s }); }
  function stopAnim() { if (anim) { cancelAnimationFrame(anim); anim = null; } }
  function vlieg(d, duur) {
    stopAnim();
    var eind = naarStaat(d);
    if (rustig.matches || !duur) { st = eind; teken(); return wacht(0); }
    var b = { s: st.s, tx: st.tx, ty: st.ty };
    // werk met het beeldpunt in het midden, zodat de beweging rustig en recht oogt
    var c0x = (cw / 2 - b.tx) / b.s, c0y = (ch / 2 - b.ty) / b.s;
    var c1x = (cw / 2 - eind.tx) / eind.s, c1y = (ch / 2 - eind.ty) / eind.s;
    var l0 = Math.log(b.s), l1 = Math.log(eind.s), t0 = performance.now();
    return new Promise(function (klaar) {
      function stap(nu) {
        var t = Math.min(1, (nu - t0) / duur), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        var s = Math.exp(l0 + (l1 - l0) * e), cx = c0x + (c1x - c0x) * e, cy = c0y + (c1y - c0y) * e;
        st = { s: s, tx: cw / 2 - cx * s, ty: ch / 2 - cy * s }; teken();
        if (t < 1) anim = requestAnimationFrame(stap); else { anim = null; st = eind; teken(); klaar(); }
      }
      anim = requestAnimationFrame(stap);
    });
  }
  function zoomOm(f, px, py, duur) {
    var ns = begrens(st.s * f, minS(), maxS());
    var cx = (px - st.tx) / st.s, cy = (py - st.ty) / st.s;
    return vlieg({ s: ns, cx: cx, cy: cy, ax: px, ay: py }, duur);
  }
  function maat() {
    var r = kaart.getBoundingClientRect();
    var oud = cw ? { cx: (cw / 2 - st.tx) / st.s, cy: (ch / 2 - st.ty) / st.s, s: st.s } : null;
    cw = r.width; ch = r.height;
    if (oud) { st = klem({ s: oud.s, tx: cw / 2 - oud.cx * oud.s, ty: ch / 2 - oud.cy * oud.s }); teken(); }
  }

  /* markers */
  var markers = LOC.map(function (loc, i) {
    var el = document.createElement("div");
    el.className = "mk"; el.setAttribute("data-id", loc.id);
    el.innerHTML = '<svg class="mk__lijn" width="1" height="1" aria-hidden="true"><line x1="0" y1="0" x2="0" y2="0"/></svg><span class="mk__punt" aria-hidden="true"></span>' +
      '<button type="button" class="mk__label" aria-label="Locatie ' + (i + 1) + ': ' + esc(loc.naam) + '">' +
      '<span class="mk__nr" aria-hidden="true">' + (i + 1) + "</span><span>" + esc(loc.naam) + "</span></button>";
    $("button", el).addEventListener("click", function (e) { laatsteKnop = e.currentTarget; ga(loc.id); });
    mkVak.appendChild(el);
    return { el: el, loc: loc };
  });

  // Labels plaatsen (op smalle schermen kan een eigen plek gelden: labelMobiel)
  function plaatsLabels() {
    var smal = window.matchMedia("(max-width: 560px)").matches;
    markers.forEach(function (m) {
      var L = (smal && m.loc.labelMobiel) || m.loc.label || { dx: 0, dy: -34, uitlijning: "midden" };
      var tr = L.uitlijning === "links" ? "translate(0,-50%)" : L.uitlijning === "rechts" ? "translate(-100%,-50%)" : "translate(-50%,-50%)";
      $(".mk__label", m.el).style.transform = "translate(" + L.dx + "px," + L.dy + "px) " + tr;
      var ln = $("line", m.el); ln.setAttribute("x2", L.dx); ln.setAttribute("y2", L.dy);
    });
  }
  plaatsLabels();
  window.addEventListener("resize", plaatsLabels);

  /* muis: slepen, dubbelklik, Ctrl/⌘ + scrollwiel */
  var sleep = null;
  kaart.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch" || e.button !== 0 || e.target.closest("button")) return;
    stopAnim();
    sleep = { x: e.clientX, y: e.clientY, tx: st.tx, ty: st.ty, id: e.pointerId };
    kaart.setPointerCapture(e.pointerId); kaart.classList.add("sleept");
  });
  kaart.addEventListener("pointermove", function (e) {
    if (!sleep || e.pointerId !== sleep.id) return;
    st = klem({ s: st.s, tx: sleep.tx + e.clientX - sleep.x, ty: sleep.ty + e.clientY - sleep.y }); teken();
  });
  function stopSleep() { sleep = null; kaart.classList.remove("sleept"); }
  kaart.addEventListener("pointerup", stopSleep);
  kaart.addEventListener("pointercancel", stopSleep);
  kaart.addEventListener("dblclick", function (e) {
    if (e.target.closest("button")) return;
    var r = kaart.getBoundingClientRect(); zoomOm(1.8, e.clientX - r.left, e.clientY - r.top, 300);
  });
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  kaart.addEventListener("wheel", function (e) {
    if (!(e.ctrlKey || e.metaKey)) { toonHint("Houd " + (mac ? "⌘" : "Ctrl") + " ingedrukt en scroll om te zoomen"); return; }
    e.preventDefault(); stopAnim();
    var r = kaart.getBoundingClientRect(), f = Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0022));
    var px = e.clientX - r.left, py = e.clientY - r.top, ns = begrens(st.s * f, minS(), maxS());
    st = klem({ s: ns, tx: px - (px - st.tx) * ns / st.s, ty: py - (py - st.ty) * ns / st.s }); teken();
  }, { passive: false });

  /* aanraken: één vinger sleept de kaart, twee vingers zoomen (de pagina scrol je boven/onder de kaart) */
  var knijp = null, hintTimer = null, een = null;
  function afstand(a, b) { return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
  function startKnijp(e) {
    var a = e.touches[0], b = e.touches[1], r = kaart.getBoundingClientRect();
    var mx = (a.clientX + b.clientX) / 2 - r.left, my = (a.clientY + b.clientY) / 2 - r.top;
    knijp = { d: afstand(a, b), s: st.s, cx: (mx - st.tx) / st.s, cy: (my - st.ty) / st.s };
  }
  kaart.addEventListener("touchstart", function (e) {
    stopAnim();
    if (e.touches.length >= 2) { een = null; startKnijp(e); }
    else if (e.touches.length === 1) een = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: st.tx, ty: st.ty };
  }, { passive: true });
  kaart.addEventListener("touchmove", function (e) {
    if (e.touches.length >= 2) {
      e.preventDefault();
      if (!knijp) startKnijp(e);
      var a = e.touches[0], b = e.touches[1], r = kaart.getBoundingClientRect();
      var mx = (a.clientX + b.clientX) / 2 - r.left, my = (a.clientY + b.clientY) / 2 - r.top;
      var ns = begrens(knijp.s * afstand(a, b) / knijp.d, minS(), maxS());
      st = klem({ s: ns, tx: mx - knijp.cx * ns, ty: my - knijp.cy * ns }); teken();
    } else if (een && e.touches.length === 1) {
      e.preventDefault();
      st = klem({ s: st.s, tx: een.tx + e.touches[0].clientX - een.x, ty: een.ty + e.touches[0].clientY - een.y }); teken();
    }
  }, { passive: false });
  kaart.addEventListener("touchend", function (e) {
    if (e.touches.length < 2) knijp = null;
    if (e.touches.length === 1) een = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: st.tx, ty: st.ty };
    if (e.touches.length === 0) een = null;
  });
  function toonHint(t) {
    hint.textContent = t; hint.classList.add("zicht");
    clearTimeout(hintTimer); hintTimer = setTimeout(verbergHint, 1600);
  }
  function verbergHint() { hint.classList.remove("zicht"); }

  /* toetsenbord op de kaart */
  kaart.addEventListener("keydown", function (e) {
    if (e.target !== kaart) return;
    var stp = 90, k = e.key;
    if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") {
      e.preventDefault(); stopAnim();
      st = klem({ s: st.s, tx: st.tx + (k === "ArrowLeft" ? stp : k === "ArrowRight" ? -stp : 0), ty: st.ty + (k === "ArrowUp" ? stp : k === "ArrowDown" ? -stp : 0) }); teken();
    } else if (k === "+" || k === "=") { e.preventDefault(); zoomOm(1.4, cw / 2, ch / 2, 220); }
    else if (k === "-" || k === "_") { e.preventDefault(); zoomOm(1 / 1.4, cw / 2, ch / 2, 220); }
    else if (k === "0") { e.preventDefault(); vlieg(doelPark(), 500); }
  });
  $("#zoomIn").addEventListener("click", function () { zoomOm(1.5, cw / 2, ch / 2, 260); });
  $("#zoomUit").addEventListener("click", function () { zoomOm(1 / 1.5, cw / 2, ch / 2, 260); });
  $("#heelPark").addEventListener("click", function () { vlieg(doelPark(), 650); });

  maat();
  st = naarStaat(doelPark()); teken();
  if (window.ResizeObserver) new ResizeObserver(function () { maat(); }).observe(kaart);
  else window.addEventListener("resize", maat);

  /* =====================================================================
     LOCATIEKNOPPEN ONDER DE KAART
     ===================================================================== */
  $("#kaarten").innerHTML = LOC.map(function (l, i) {
    return '<li><button type="button" class="lk" data-id="' + l.id + '">' +
      '<span class="lk__beeld">' + beeld(l.kaartje, "", { sizes: "(max-width: 1000px) 50vw, 320px" }) + "</span>" +
      '<span class="lk__tekst"><span class="lk__nr" aria-hidden="true">' + (i + 1) + "</span><span>" +
      '<span class="lk__naam">' + esc(l.naam) + '</span><span class="lk__sub">' + esc(l.titel) + "</span></span></span></button></li>";
  }).join("");
  $$(".lk").forEach(function (b) { b.addEventListener("click", function () { laatsteKnop = b; ga(b.getAttribute("data-id")); }); });
  $("#startRonde").addEventListener("click", function (e) { laatsteKnop = e.currentTarget; ga(LOC[0].id); });

  /* =====================================================================
     DETAILVENSTER
     ===================================================================== */
  var venster = $("#venster"), paneel = $(".venster__paneel", venster), inhoud = $("#vensterInhoud");
  var huidig = null, laatsteKnop = null, zelfGeopend = false, sluitTimer = null;

  function sectie(titel, html) { return '<section class="d-sectie"><h3>' + esc(titel) + "</h3>" + html + "</section>"; }
  function p(t, pad_) { return "<p" + bw(pad_) + ">" + esc(t) + "</p>"; }
  // bewerkbare plekken: data-bewerk = pad in inhoud.js
  function bw(pad_) { return pad_ ? " data-bewerk='" + esc(JSON.stringify(pad_)) + "'" : ""; }
  function bwImg(pad_) { return pad_ ? " data-bewerk-img='" + esc(JSON.stringify(pad_)) + "'" : ""; }

  // Wisselknoppen huidige situatie / ontwerp
  var wisselNr = 0;
  function wissel(v, start, vpad) {
    var id = "w" + (++wisselNr), toon = start || "ontwerp";
    return '<div class="wissel-blok" data-wissel="' + id + '" data-toon="' + toon + '">' +
      '<div class="tabs" role="group" aria-label="Kies weergave">' +
      '<button type="button" class="tab" data-kies="huidig" aria-pressed="' + (toon === "huidig") + '">Huidige situatie</button>' +
      '<button type="button" class="tab" data-kies="ontwerp" aria-pressed="' + (toon === "ontwerp") + '">Ons ontwerp</button></div>' +
      '<div class="wisselbeeld">' +
      ["huidig", "ontwerp"].map(function (k) {
        return '<button type="button" class="beeldknop"' + bwImg(vpad && vpad.concat(k, "bestand")) + ' data-lb="' + id + '" data-lb-i="' + (k === "huidig" ? 0 : 1) + '"' + (k === toon ? "" : " hidden") + ' data-paar="' + k + '" aria-label="Vergroot: ' + (k === "huidig" ? "huidige situatie" : "ons ontwerp") + '">' +
          beeld(v[k].bestand, v[k].alt) + '<span class="d-badge' + (k === "huidig" ? " d-badge--grijs" : "") + '">' + (k === "huidig" ? "Huidige situatie" : "Ons ontwerp") + "</span></button>";
      }).join("") + "</div></div>";
  }
  // Vóór/na-schuif (alleen bij gelijk standpunt, uitsnede en verhouding)
  function schuif(v) {
    var id = "w" + (++wisselNr);
    return '<div class="schuif" style="--pos:50%" data-schuif>' +
      beeld(v.ontwerp.bestand, v.ontwerp.alt, { alleenGroot: true }) +
      '<div class="schuif__voor">' + beeld(v.huidig.bestand, v.huidig.alt, { alleenGroot: true }) + "</div>" +
      '<span class="schuif__lijn"></span><span class="schuif__greep" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6 3 12l6 6 1.4-1.4L5.8 12l4.6-4.6zm6 0-1.4 1.4 4.6 4.6-4.6 4.6L15 18l6-6z"/></svg></span>' +
      '<span class="schuif__lab schuif__lab--l">Huidige situatie</span><span class="schuif__lab schuif__lab--r">Ons ontwerp</span>' +
      '<input type="range" min="0" max="100" value="50" aria-label="Schuif tussen huidige situatie en ons ontwerp" aria-valuetext="50 procent huidige situatie">' +
      '</div><p class="uitleg-klein">Sleep de schuif naar links of rechts om te vergelijken. ' +
      '<button type="button" class="mini-knop" data-lb="' + id + '" data-lb-i="0">Bekijk beide groot</button></p>';
  }
  function vergelijk(v, start, vpad) { return v.type === "schuif" ? schuif(v) : wissel(v, start, vpad); }

  // Afbeeldingsgroepen voor de vergroting
  var groepen = {};
  function registreerGroep(id, items) { groepen[id] = items; }

  function bouw(loc, i) {
    groepen = {}; wisselNr = 0;
    var h = "";
    var L = ["locaties", i];
    h += '<header class="d-kop"><p class="d-naam"' + bw(L.concat("naam")) + '>' + esc(loc.naam) + '</p><h2 id="vensterTitel"' + bw(L.concat("titel")) + '>' + esc(loc.titel) + "</h2></header>";

    if (loc.id === "tribune") {
      // fotowand: de zes panelen op de tribunewand
      h += '<div class="carrousel" data-carrousel>' +
        '<button type="button" class="carrousel__beeld"' + bwImg(L.concat("panelen", 0, "mockup")) + ' data-lb="wand" data-lb-i="0" aria-label="Vergroot ontwerp">' +
        beeld(loc.panelen[0].mockup, "Ontwerp tribunewand: " + loc.panelen[0].alt, { eager: true }) +
        '<span class="d-badge">Ons ontwerp · ' + esc(loc.wandTitel) + "</span></button>" +
        '<div class="carrousel__nav"><button type="button" class="kb" data-car="-1" aria-label="Vorig paneel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 6.4 14 5l-7 7 7 7 1.4-1.4L9.8 12z"/></svg></button>' +
        '<p class="carrousel__tekst" aria-live="polite"></p>' +
        '<button type="button" class="kb" data-car="1" aria-label="Volgend paneel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 17.6 10 19l7-7-7-7-1.4 1.4 5.6 5.6z"/></svg></button></div></div>';
      registreerGroep("wand", loc.panelen.map(function (pn, k) {
        return { naam: pn.mockup, alt: "Ontwerp tribunewand: " + pn.alt, tekst: (k + 1) + "/6 · " + pn.titel + " — " + herkomstTekst(pn.herkomst) };
      }));
    } else {
      h += '<button type="button" class="d-hoofd"' + bwImg(L.concat("hoofdbeeld", "bestand")) + ' data-lb="hoofd" data-lb-i="0" aria-label="Vergroot ontwerp">' +
        beeld(loc.hoofdbeeld.bestand, loc.hoofdbeeld.alt, { eager: true }) +
        '<span class="d-badge">Ons ontwerp</span><span class="vergroot" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 4a6 6 0 0 1 4.8 9.6l5.3 5.3-1.4 1.4-5.3-5.3A6 6 0 1 1 10 4zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-1 1h2v2h2v2h-2v2H9v-2H7V9h2z"/></svg></span></button>';
      registreerGroep("hoofd", [{ naam: loc.hoofdbeeld.bestand, alt: loc.hoofdbeeld.alt, tekst: "Ons ontwerp — " + loc.titel }]);
      if (loc.notitie) h += '<div class="d-sectie" style="padding-bottom:0"><p class="d-notitie"' + bw(L.concat("notitie")) + '>' + esc(loc.notitie) + "</p></div>";
    }

    // Huidige situatie en ons ontwerp
    if (loc.onderdelen) {
      var tabs = '<div class="tabs" role="tablist" aria-label="Onderdelen van veld C">' + loc.onderdelen.map(function (o, k) {
        return '<button type="button" class="tab" role="tab" id="tab' + k + '" aria-controls="tp' + k + '" aria-selected="' + (k === 0) + '" tabindex="' + (k === 0 ? 0 : -1) + '" data-tab="' + k + '">' + esc(o.naam) + "</button>";
      }).join("") + "</div>";
      var panelen = loc.onderdelen.map(function (o, k) {
        var blok = vergelijk(o, "ontwerp", o.type === "wissel" ? L.concat("onderdelen", k) : null);
        return '<div role="tabpanel" id="tp' + k + '" aria-labelledby="tab' + k + '"' + (k ? " hidden" : "") + '><p class="onderdeel-uitleg"' + bw(L.concat("onderdelen", k, "uitleg")) + '>' + esc(o.uitleg) + "</p>" + blok + "</div>";
      }).join("");
      h += sectie("Huidige situatie en ons ontwerp", "<p>Kies een onderdeel en vergelijk.</p>" + tabs + panelen);
      loc.onderdelen.forEach(function (o, k) { registreerGroep("w" + (k + 1), paarGroep(o)); });
    } else if (loc.vergelijking) {
      var start = loc.id === "vrijwilligerswand" ? "huidig" : "ontwerp";
      var extra = "";
      if (loc.extraFotos && loc.extraFotos.length) {
        extra = '<p class="uitleg-klein">Meer van de huidige situatie:</p><div class="fotorij">' + loc.extraFotos.map(function (f, k) {
          return '<button type="button"' + bwImg(L.concat("extraFotos", k, "bestand")) + ' data-lb="extra" data-lb-i="' + k + '" aria-label="Vergroot: ' + esc(f.alt) + '">' + beeld(f.bestand, f.alt, { sizes: "200px" }) + "</button>";
        }).join("") + "</div>";
        registreerGroep("extra", loc.extraFotos.map(function (f) { return { naam: f.bestand, alt: f.alt, tekst: "Huidige situatie" }; }));
      }
      h += sectie("Huidige situatie en ons ontwerp", vergelijk(loc.vergelijking, start, loc.vergelijking.type === "wissel" ? L.concat("vergelijking") : null) + extra);
      registreerGroep("w1", paarGroep(loc.vergelijking));
    } else if (loc.panelen) {
      h += sectie("De zes panelen", '<p class="d-notitie"' + bw(L.concat("herkomstUitleg")) + '>' + esc(loc.herkomstUitleg) + '</p><div class="galerij">' + loc.panelen.map(function (pn, k) {
        return '<div class="gp"><button type="button" class="gp__beeld"' + bwImg(L.concat("panelen", k, "paneel")) + ' data-lb="panelen" data-lb-i="' + k + '" aria-label="Vergroot paneel ' + (k + 1) + ": " + esc(pn.titel) + '">' + beeld(pn.paneel, pn.alt, { sizes: "(max-width: 820px) 50vw, 300px" }) + "</button>" +
          "<span>" + (k + 1) + '. <span class="gp__titel"' + bw(L.concat("panelen", k, "titel")) + ">" + esc(pn.titel) + '</span><br><span class="herkomst herkomst--' + pn.herkomst + '">' + esc(herkomstKort(pn.herkomst)) + "</span></span></div>";
      }).join("") + "</div>");
      registreerGroep("panelen", loc.panelen.map(function (pn, k) { return { naam: pn.paneel, alt: pn.alt, tekst: (k + 1) + ". " + pn.titel + " — " + herkomstTekst(pn.herkomst) }; }));
      h += sectie("Huidige situatie", '<div class="fotorij">' + loc.huidigeFotos.map(function (f, k) {
        return '<button type="button"' + bwImg(L.concat("huidigeFotos", k, "bestand")) + ' data-lb="huidig" data-lb-i="' + k + '" aria-label="Vergroot: ' + esc(f.alt) + '">' + beeld(f.bestand, f.alt, { sizes: "200px" }) + "</button>";
      }).join("") + "</div>");
      registreerGroep("huidig", loc.huidigeFotos.map(function (f) { return { naam: f.bestand, alt: f.alt, tekst: "Huidige situatie" }; }));
    }

    var wat = p(loc.watVeranderen, L.concat("watVeranderen"));
    if (loc.citaat) wat += '<p class="d-citaat">‘<span' + bw(L.concat("citaat")) + '>' + esc(loc.citaat).replace(/^ASV’ers/, "<b>ASV’ers</b>") + "</span>’</p>";
    h += sectie("Wat veranderen we?", wat);
    h += sectie("Waarom deze keuze?", p(loc.waarom, L.concat("waarom")));
    h += sectie("Wat levert het op?", p(loc.oplevering, L.concat("oplevering")) + (loc.slogan ? '<p class="d-slogan"' + bw(L.concat("slogan")) + '>' + esc(loc.slogan) + "</p>" : ""));

    h += '<div class="d-terug"><button type="button" class="knop knop--rand" data-sluit>Terug naar het overzicht</button></div>' +
      '<p class="d-disclaimer"' + bw(["site", "disclaimer"]) + '>' + esc(D.site.disclaimer) + "</p>";
    return h;
  }
  function paarGroep(v) {
    return [{ naam: v.huidig.bestand, alt: v.huidig.alt, tekst: "Huidige situatie", groot: v.type === "schuif" },
            { naam: v.ontwerp.bestand, alt: v.ontwerp.alt, tekst: "Ons ontwerp", groot: v.type === "schuif" }];
  }
  function herkomstKort(h) { return h === "echt" ? "Echte clubfoto" : "AI-sfeerbeeld"; }
  function herkomstTekst(h) { return h === "echt" ? "echte clubfoto" : "AI-sfeerbeeld: reconstructie, geen archieffoto"; }

  function koppel(loc) {
    // wisselknoppen
    $$("[data-wissel]", inhoud).forEach(function (w) {
      $$("[data-kies]", w).forEach(function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-kies");
          $$("[data-kies]", w).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          $$("[data-paar]", w).forEach(function (x) { x.hidden = x.getAttribute("data-paar") !== k; });
        });
      });
    });
    // schuifregelaars
    $$("[data-schuif]", inhoud).forEach(function (s) {
      var r = $("input", s), actief = null;
      var zet = function (v) {
        v = Math.round(begrens(v, 0, 100));
        s.style.setProperty("--pos", v + "%"); r.value = v;
        r.setAttribute("aria-valuetext", v + " procent huidige situatie");
      };
      var vanX = function (x) { var b = s.getBoundingClientRect(); zet((x - b.left) / b.width * 100); };
      r.addEventListener("input", function () { zet(Number(r.value)); });
      s.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        actief = { id: e.pointerId, x: e.clientX, y: e.clientY, bezig: e.pointerType !== "touch" };
        if (actief.bezig) { s.setPointerCapture(e.pointerId); vanX(e.clientX); e.preventDefault(); r.focus({ preventScroll: true }); }
      });
      s.addEventListener("pointermove", function (e) {
        if (!actief || e.pointerId !== actief.id) return;
        if (!actief.bezig) {
          // aanraken: pas schuiven als de beweging vooral horizontaal is (verticaal = pagina scrollen)
          if (Math.abs(e.clientX - actief.x) > 6 && Math.abs(e.clientX - actief.x) > Math.abs(e.clientY - actief.y)) { actief.bezig = true; try { s.setPointerCapture(e.pointerId); } catch (x) {} }
          else return;
        }
        vanX(e.clientX);
      });
      var stop = function (e) {
        if (actief && !actief.bezig && e.type === "pointerup") vanX(e.clientX); // tik = spring naar die plek
        actief = null;
      };
      s.addEventListener("pointerup", stop); s.addEventListener("pointercancel", function () { actief = null; });
    });
    // tabs (veld C)
    var tabs = $$('[role="tab"]', inhoud);
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { kiesTab(k); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault(); var n = (k + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length; kiesTab(n); tabs[n].focus();
        }
      });
    });
    function kiesTab(k) {
      tabs.forEach(function (t, j) { t.setAttribute("aria-selected", String(j === k)); t.tabIndex = j === k ? 0 : -1; });
      $$('[role="tabpanel"]', inhoud).forEach(function (p_, j) { p_.hidden = j !== k; });
    }
    // carrousel tribune
    var car = $("[data-carrousel]", inhoud);
    if (car) {
      var n = 0, pn = loc.panelen;
      var zet = function (k) {
        n = (k + pn.length) % pn.length;
        var knop = $(".carrousel__beeld", car);
        knop.setAttribute("data-lb-i", n);
        knop.setAttribute("data-bewerk-img", JSON.stringify(["locaties", LOC.indexOf(loc), "panelen", n, "mockup"]));
        knop.innerHTML = beeld(pn[n].mockup, "Ontwerp tribunewand: " + pn[n].alt) + '<span class="d-badge">Ons ontwerp · ' + esc(loc.wandTitel) + "</span>";
        $(".carrousel__tekst", car).innerHTML = "<strong>Paneel " + (n + 1) + " van " + pn.length + ": " + esc(pn[n].titel) + "</strong>" + esc(herkomstKort(pn[n].herkomst));
      };
      $$("[data-car]", car).forEach(function (b) { b.addEventListener("click", function () { zet(n + Number(b.getAttribute("data-car"))); }); });
      // vegen over de foto = volgend/vorig paneel
      var cb = $(".carrousel__beeld", car), veeg = null, geveegd = false;
      cb.addEventListener("pointerdown", function (e) { veeg = { x: e.clientX, y: e.clientY, id: e.pointerId }; geveegd = false; });
      cb.addEventListener("pointermove", function (e) {
        if (!veeg || e.pointerId !== veeg.id) return;
        var dx = e.clientX - veeg.x, dy = e.clientY - veeg.y;
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { var im = $("img", cb); if (im) { im.style.transition = "none"; im.style.transform = "translateX(" + dx + "px)"; } }
      });
      var veegLos = function (e) {
        if (!veeg || e.pointerId !== veeg.id) return;
        var dx = e.clientX - veeg.x, dy = e.clientY - veeg.y; veeg = null;
        var im = $("img", cb);
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { geveegd = true; zet(n + (dx < 0 ? 1 : -1)); }
        else if (im) { im.style.transition = "transform .2s ease"; im.style.transform = "none"; }
      };
      cb.addEventListener("pointerup", veegLos); cb.addEventListener("pointercancel", function () { veeg = null; var im = $("img", cb); if (im) im.style.transform = "none"; });
      cb.addEventListener("click", function (e) { if (geveegd) { e.stopImmediatePropagation(); e.preventDefault(); geveegd = false; } }, true);
      zet(0);
    }
    // vergroten
    $$("[data-lb]", inhoud).forEach(function (b) {
      b.addEventListener("click", function () {
        var g = groepen[b.getAttribute("data-lb")];
        if (g) lichtbak(g, Number(b.getAttribute("data-lb-i")) || 0, b);
      });
    });
    // navigatie
    $$("[data-ga]", inhoud).forEach(function (b) { b.addEventListener("click", function () { ga(b.getAttribute("data-ga"), true); }); });
    $$("[data-sluit]", inhoud).forEach(function (b) { b.addEventListener("click", sluitVenster); });
  }

  function markeerActief(id) { markers.forEach(function (m) { m.el.classList.toggle("actief", m.loc.id === id); }); }

  function doelLocatie(loc) {
    var s = begrens(parkSchaal() * (loc.kaartZoom || 2), minS(), maxS());
    var ax = cw / 2;
    if (!isMobiel()) {
      // het venster ligt links over de kaart: centreer in het zichtbare deel
      var r = kaart.getBoundingClientRect(), pb = paneel.getBoundingClientRect().width || Math.min(640, innerWidth * .46);
      var over = begrens(pb - r.left, 0, cw - 160);
      ax = over + (cw - over) / 2;
    }
    return { s: s, cx: loc.x * W, cy: loc.y * H, ax: ax, ay: ch / 2 };
  }

  // Toon een locatie (wordt aangeroepen vanuit de URL-hash)
  function toon(id, direct) {
    var i = LOC.findIndex(function (l) { return l.id === id; });
    if (i < 0) return;
    var loc = LOC[i], wasOpen = !!huidig;
    huidig = id;
    clearTimeout(sluitTimer);
    markeerActief(id);
    var vul = function () {
      inhoud.innerHTML = bouw(loc, i);
      koppel(loc);
      if (window.ASVBewerk) window.ASVBewerk.vernieuw();
      inhoud.scrollTop = 0;
      $("#vensterStap").innerHTML = '<span class="lang">Locatie </span>' + (i + 1) + '<span class="lang"> van </span><span class="kort">/</span>' + LOC.length;
      var vo = LOC[(i - 1 + LOC.length) % LOC.length], vg = LOC[(i + 1) % LOC.length];
      $("#kopVorige").dataset.ga = vo.id; $("#kopVorige").setAttribute("aria-label", "Vorige locatie: " + vo.naam);
      $("#kopVolgende").dataset.ga = vg.id; $("#kopVolgende").setAttribute("aria-label", "Volgende locatie: " + vg.naam);
      document.title = loc.naam + " — Dit is ASV’33";
    };
    if (wasOpen) {
      vul(); inhoud.classList.remove("wissel"); void inhoud.offsetWidth; inhoud.classList.add("wissel");
      paneel.focus({ preventScroll: true });
      vlieg(doelLocatie(loc), direct ? 0 : 800);
      return;
    }
    var openen = function () {
      vul();
      venster.hidden = false;
      document.body.classList.add("zonder-scroll");
      requestAnimationFrame(function () { venster.classList.add("open"); paneel.focus({ preventScroll: true }); });
    };
    if (direct || rustig.matches) { openen(); requestAnimationFrame(function () { vlieg(doelLocatie(loc), 0); }); return; }
    // rustig naar de locatie bewegen; op mobiel eerst de kaart, dan het venster
    var r = kaart.getBoundingClientRect(), zichtbaar = r.top > -r.height * 0.3 && r.bottom < innerHeight + r.height * 0.3;
    var stap1 = zichtbaar ? Promise.resolve() : (window.scrollTo({ top: window.scrollY + r.top - 70, behavior: "smooth" }), wacht(450));
    stap1.then(function () {
      if (huidig !== id) return;
      if (isMobiel()) return vlieg(doelLocatie(loc), 750).then(function () { if (huidig === id) openen(); });
      openen();
      return wacht(60).then(function () { return vlieg(doelLocatie(loc), 850); });
    });
  }

  function verberg() {
    if (!huidig) return;
    huidig = null;
    markeerActief(null);
    venster.classList.remove("open");
    document.body.classList.remove("zonder-scroll");
    document.title = "Dit is ASV’33 — Ontdek het ASV’33 van morgen";
    sluitTimer = setTimeout(function () { venster.hidden = true; inhoud.innerHTML = ""; }, rustig.matches ? 0 : 430);
    vlieg(doelPark(), 700);
    var terug = laatsteKnop;
    if (terug && document.contains(terug)) setTimeout(function () { try { terug.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }

  /* ---------- deelbare adressen (#veld-c, #tribune, ...) ---------- */
  function ga(id, vervang) {
    if (location.hash === "#" + id) { toon(id); return; }
    if (huidig || vervang) location.replace("#" + id);   // binnen het venster: geen extra stap terug
    else { zelfGeopend = true; location.hash = id; }
  }
  function sluitVenster() {
    if (zelfGeopend) { zelfGeopend = false; history.back(); }
    else location.replace("#overzicht");
  }
  function route(direct) {
    var h = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (LOC.some(function (l) { return l.id === h; })) toon(h, direct);
    else { zelfGeopend = false; verberg(); }
  }
  window.addEventListener("hashchange", function () { route(false); });

  ["#kopVorige", "#kopVolgende"].forEach(function (s) { $(s).addEventListener("click", function (e) { ga(e.currentTarget.dataset.ga, true); }); });
  venster.addEventListener("click", function (e) { if (e.target.classList.contains("venster__achter") || e.target.closest(".venster__kop [data-sluit]")) sluitVenster(); });

  /* ---------- toetsenbord: Esc en focus binnen het venster ---------- */
  function focusbaar(root) {
    return $$('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])', root).filter(function (el) { return !el.closest("[hidden]") && el.offsetParent !== null; });
  }
  document.addEventListener("keydown", function (e) {
    var lbOpen = !lb.hidden, vidOpen = !$("#videoVak").hidden;
    if (e.key === "Escape") {
      if (vidOpen) return sluitVideo();
      if (lbOpen) return sluitLb();
      if (huidig) return sluitVenster();
    }
    if (lbOpen && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { lbStap(e.key === "ArrowLeft" ? -1 : 1); }
    if (e.key === "Tab") {
      var root = vidOpen ? $("#videoVak") : lbOpen ? lb : huidig ? paneel : null;
      if (!root) return;
      var f = focusbaar(root); if (!f.length) return;
      var eerst = f[0], laatst = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === eerst || !root.contains(document.activeElement))) { e.preventDefault(); laatst.focus(); }
      else if (!e.shiftKey && (document.activeElement === laatst || !root.contains(document.activeElement))) { e.preventDefault(); eerst.focus(); }
    }
  });

  /* =====================================================================
     VERGROTING
     ===================================================================== */
  var lb = $("#lichtbak"), lbBeeld = $("#lbBeeld"), lbTekst = $("#lbTekst"), lbGroep = [], lbI = 0, lbTerug = null;
  function lichtbak(groep, i, terug) {
    lbGroep = groep; lbI = i; lbTerug = terug;
    lb.hidden = false; lbToon();
    $("#lbSluit").focus();
  }
  // zoom/sleep-status van de vergrote foto
  var zs = { s: 1, x: 0, y: 0 }, lbImg = null;
  function lbZet(anim) {
    if (!lbImg) return;
    lbImg.style.transition = anim && !rustig.matches ? "transform .25s ease" : "none";
    lbImg.style.transform = "translate(" + zs.x + "px," + zs.y + "px) scale(" + zs.s + ")";
  }
  function lbKlem() {
    if (!lbImg) return;
    if (zs.s <= 1) { zs.s = 1; zs.x = 0; zs.y = 0; return; }
    var r = lbBeeld.getBoundingClientRect(), w = lbImg.offsetWidth * zs.s, h = lbImg.offsetHeight * zs.s;
    var mx = Math.max(0, (w - r.width) / 2), my = Math.max(0, (h - r.height) / 2);
    zs.x = begrens(zs.x, -mx, mx); zs.y = begrens(zs.y, -my, my);
  }
  function lbZoomOm(ns, px, py) {
    // px/py: punt t.o.v. het midden van het beeldvak dat op zijn plek blijft
    ns = begrens(ns, 1, 5);
    zs.x = px - (px - zs.x) * ns / zs.s; zs.y = py - (py - zs.y) * ns / zs.s; zs.s = ns;
    lbKlem();
  }
  function lbToon(richting) {
    var it = lbGroep[lbI];
    zs = { s: 1, x: 0, y: 0 };
    lbBeeld.innerHTML = '<img src="' + pad(it.naam) + '" alt="' + esc(it.alt) + '" data-bestand="' + esc(pad(it.naam)) + '" draggable="false">';
    lbImg = $("img", lbBeeld);
    if (richting && lbImg && !rustig.matches) {
      lbImg.style.transform = "translateX(" + (richting * 60) + "px)"; lbImg.style.opacity = "0";
      requestAnimationFrame(function () { lbImg.style.transition = "transform .25s ease, opacity .25s ease"; lbImg.style.transform = "none"; lbImg.style.opacity = "1"; });
    }
    lbTekst.textContent = it.tekst + (lbGroep.length > 1 ? "  ·  " + (lbI + 1) + " / " + lbGroep.length : "");
    $("#lbVorige").hidden = $("#lbVolgende").hidden = lbGroep.length < 2;
  }
  function lbStap(d) { if (lbGroep.length > 1) { lbI = (lbI + d + lbGroep.length) % lbGroep.length; lbToon(d); } }
  function sluitLb() { lb.hidden = true; lbBeeld.innerHTML = ""; lbImg = null; if (lbTerug) lbTerug.focus(); }

  // slepen, vegen, knijpen en dubbeltikken in de vergroting
  var lbPtr = {}, lbGebaar = null, laatsteTik = 0;
  function lbMidden(e) { var r = lbBeeld.getBoundingClientRect(); return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 }; }
  lbBeeld.addEventListener("pointerdown", function (e) {
    if (!lbImg) return;
    lbBeeld.setPointerCapture(e.pointerId);
    lbPtr[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(lbPtr);
    if (ids.length === 2) {
      var a = lbPtr[ids[0]], b = lbPtr[ids[1]], r = lbBeeld.getBoundingClientRect();
      lbGebaar = { soort: "knijp", d: Math.hypot(a.x - b.x, a.y - b.y), s: zs.s, x: zs.x, y: zs.y,
        mx: (a.x + b.x) / 2 - r.left - r.width / 2, my: (a.y + b.y) / 2 - r.top - r.height / 2 };
    } else if (ids.length === 1) {
      lbGebaar = { soort: zs.s > 1 ? "sleep" : "veeg", sx: e.clientX, sy: e.clientY, x: zs.x, y: zs.y, bewogen: false };
    }
  });
  lbBeeld.addEventListener("pointermove", function (e) {
    if (!lbPtr[e.pointerId] || !lbGebaar) return;
    lbPtr[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (lbGebaar.soort === "knijp") {
      var ids = Object.keys(lbPtr); if (ids.length < 2) return;
      var a = lbPtr[ids[0]], b = lbPtr[ids[1]];
      var ns = begrens(lbGebaar.s * Math.hypot(a.x - b.x, a.y - b.y) / lbGebaar.d, 1, 5);
      zs.x = lbGebaar.mx - (lbGebaar.mx - lbGebaar.x) * ns / lbGebaar.s; zs.y = lbGebaar.my - (lbGebaar.my - lbGebaar.y) * ns / lbGebaar.s; zs.s = ns;
      lbKlem(); lbZet(false); return;
    }
    var dx = e.clientX - lbGebaar.sx, dy = e.clientY - lbGebaar.sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) lbGebaar.bewogen = true;
    if (lbGebaar.soort === "sleep") { zs.x = lbGebaar.x + dx; zs.y = lbGebaar.y + dy; lbKlem(); lbZet(false); }
    else { // vegen: foto beweegt mee met je vinger
      lbImg.style.transition = "none";
      lbImg.style.transform = "translate(" + dx + "px," + (Math.abs(dy) > Math.abs(dx) ? dy : 0) + "px)";
      lbImg.style.opacity = String(1 - Math.min(.5, Math.abs(dy) / 500));
    }
  });
  function lbLos(e) {
    if (!lbPtr[e.pointerId]) return;
    delete lbPtr[e.pointerId];
    var g = lbGebaar;
    if (!g) return;
    if (g.soort === "knijp") { if (Object.keys(lbPtr).length === 0) lbGebaar = null; else { var id = Object.keys(lbPtr)[0]; lbGebaar = { soort: zs.s > 1 ? "sleep" : "veeg", sx: lbPtr[id].x, sy: lbPtr[id].y, x: zs.x, y: zs.y, bewogen: true }; } return; }
    lbGebaar = null;
    var dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (!g.bewogen && e.type === "pointerup") {
      // dubbeltik / dubbelklik = in- of uitzoomen op die plek
      var nu = Date.now();
      if (nu - laatsteTik < 320) { var m = lbMidden(e); if (zs.s > 1) zs = { s: 1, x: 0, y: 0 }; else lbZoomOm(2.5, m.x, m.y); lbZet(true); laatsteTik = 0; }
      else laatsteTik = nu;
      return;
    }
    if (g.soort === "veeg") {
      lbImg.style.opacity = "1";
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && lbGroep.length > 1) { lbStap(dx < 0 ? 1 : -1); return; }
      if (dy > 110 && Math.abs(dy) > Math.abs(dx)) { sluitLb(); return; }
      zs = { s: 1, x: 0, y: 0 }; lbZet(true);
    }
  }
  lbBeeld.addEventListener("pointerup", lbLos);
  lbBeeld.addEventListener("pointercancel", lbLos);
  lbBeeld.addEventListener("wheel", function (e) {
    if (!lbImg) return; e.preventDefault();
    var m = lbMidden(e); lbZoomOm(zs.s * Math.exp(-e.deltaY * 0.0025), m.x, m.y); lbZet(false);
  }, { passive: false });
  $("#lbSluit").addEventListener("click", sluitLb);
  $("#lbVorige").addEventListener("click", function () { lbStap(-1); });
  $("#lbVolgende").addEventListener("click", function () { lbStap(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) sluitLb(); });

  /* =====================================================================
     INTROVIDEO (optioneel)
     ===================================================================== */
  var introKnop = $("#introKnop");
  function sluitVideo() { var v = $("video", $("#videoHouder")); if (v) v.pause(); $("#videoVak").hidden = true; $("#videoHouder").innerHTML = ""; introKnop.focus(); }
  if (D.site.introVideo) {
    introKnop.hidden = false;
    introKnop.addEventListener("click", function () {
      $("#videoHouder").innerHTML = '<video controls playsinline preload="metadata" src="' + esc(D.site.introVideo) + '">Je browser kan deze video niet afspelen.</video>';
      $("#videoVak").hidden = false; $("#videoSluit").focus();
    });
    $("#videoSluit").addEventListener("click", sluitVideo);
  }

  /* bewerkmodus (alleen op je eigen pc, zie bewerken.js) */
  window.ASVIntern = {
    voorbeeld: voorbeeld,
    herteken: function () { if (huidig) { var id = huidig, top = inhoud.scrollTop; inhoud.innerHTML = bouw(LOC[LOC.findIndex(function (l) { return l.id === id; })], LOC.findIndex(function (l) { return l.id === id; })); koppel(LOC.find(function (l) { return l.id === id; })); if (window.ASVBewerk) window.ASVBewerk.vernieuw(); inhoud.scrollTop = top; } },
    lightboxUit: false
  };

  /* start: open direct de juiste locatie als de URL er een bevat */
  route(true);
})();

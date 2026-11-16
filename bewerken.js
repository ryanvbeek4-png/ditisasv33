/* Dit is ASV'33 — BEWERKMODUS
   Werkt alleen als je de website op je eigen pc opent (dubbelklik op index.html).
   Op de openbare website verschijnt deze knop niet, en niemand anders kan er iets mee opslaan. */
(function () {
  "use strict";
  var lokaal = location.protocol === "file:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  // Online (GitHub Pages): alleen zichtbaar via de geheime link #bewerken of als jouw sleutel al op dit apparaat staat
  var GH = /\.github\.io$/.test(location.hostname) ? { eigenaar: location.hostname.split(".")[0], repo: (location.pathname.split("/")[1] || "") } : null;
  var SLEUTEL = "asv33-github-sleutel";
  function leesS() { try { return localStorage.getItem(SLEUTEL) || ""; } catch (e) { return ""; } }
  var online = !!(GH && GH.repo && (location.hash === "#bewerken" || leesS()));
  if ((!lokaal && !online) || !window.ASV || !window.ASVIntern) return;
  var opslagTekst = online ? "Opslaan op de website" : "Opslaan op deze pc";

  var D = window.ASV, I = window.ASVIntern;
  var KOP = "/* =====================================================================\n" +
    "   DIT IS ASV'33 — ALLE INHOUD OP ÉÉN PLEK\n" +
    "   ---------------------------------------------------------------------\n" +
    "   Makkelijkst: open index.html op je eigen pc, klik op ‘Bewerken’,\n" +
    "   pas teksten en foto's aan en klik op ‘Opslaan’. Dit bestand wordt dan\n" +
    "   automatisch bijgewerkt.\n" +
    "   Met de hand kan ook: verander alleen tekst tussen de aanhalingstekens\n" +
    "   en laat komma's en haakjes staan.\n" +
    "   - Afbeeldingen staan in de map img/. \"naam\" betekent img/naam.webp met\n" +
    "     een kleine versie img/naam-klein.webp. Een naam mét extensie\n" +
    "     (bijv. \"nieuwe-foto.jpg\") gebruikt precies dat ene bestand.\n" +
    "   - x / y: plek op de luchtfoto (0 = links/boven, 1 = rechts/onder).\n" +
    "   - label / labelMobiel: plek van het naamlabel naast de stip (pixels).\n" +
    "   ===================================================================== */\n\n";

  var aan = false, gewijzigd = {}, nieuweFotos = {}, mapHandle = null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- opmaak van de bewerkmodus ---------- */
  var css = document.createElement("style");
  css.textContent =
    ".bw-knop{position:fixed;right:16px;bottom:16px;z-index:40;display:flex;align-items:center;gap:8px;min-height:48px;padding:10px 18px;border-radius:999px;border:0;background:#24272c;color:#fff;font:600 15px/1 Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.3)}" +
    ".bw-balk{position:fixed;left:0;right:0;top:0;z-index:95;display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 16px;background:#24272c;color:#fff;font:15px/1.3 Inter,system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.3)}" +
    ".bw-balk strong{font-weight:800}.bw-balk .bw-uitleg{flex:1;min-width:220px;opacity:.9}" +
    ".bw-balk button{min-height:42px;padding:8px 16px;border-radius:999px;border:2px solid rgba(255,255,255,.35);background:transparent;color:#fff;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}" +
    ".bw-balk button.bw-opslaan{background:#9e1b26;border-color:#9e1b26}.bw-balk button:disabled{opacity:.45;cursor:default}" +
    "body.bewerkmodus{padding-top:64px}" +
    "body.bewerkmodus [data-bewerk]{outline:2px dashed rgba(158,27,38,.55);outline-offset:3px;border-radius:4px;cursor:text;min-width:2ch}" +
    "body.bewerkmodus [data-bewerk]:hover{background:rgba(255,230,150,.35)}" +
    "body.bewerkmodus [data-bewerk]:focus{outline:3px solid #e0a800;background:#fffbea;color:#24272c}" +
    "body.bewerkmodus [data-bewerk].bw-gewijzigd{background:rgba(255,230,150,.45)}" +
    "body.bewerkmodus [data-bewerk-img]{position:relative;cursor:pointer!important}" +
    "body.bewerkmodus [data-bewerk-img]::after{content:'📷 Vervang foto';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(36,39,44,.88);color:#fff;font:700 14px Inter,system-ui,sans-serif;padding:10px 14px;border-radius:999px;pointer-events:none;white-space:nowrap;z-index:2}" +
    "body.bewerkmodus [data-bewerk-img]:hover::after{background:#9e1b26}" +
    "body.bewerkmodus .venster{top:64px}" +
    ".bw-melding{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:99;background:#24272c;color:#fff;padding:12px 18px;border-radius:12px;font:600 15px/1.35 Inter,system-ui,sans-serif;max-width:min(560px,92vw);text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.3);opacity:0;transition:opacity .25s;pointer-events:none}" +
    ".bw-melding.zicht{opacity:1}";
  document.head.appendChild(css);

  var knop = document.createElement("button");
  knop.type = "button"; knop.className = "bw-knop"; knop.innerHTML = "✏️ Bewerken";
  knop.title = "Alleen zichtbaar op je eigen pc";
  document.body.appendChild(knop);

  var balk = document.createElement("div");
  balk.className = "bw-balk"; balk.hidden = true; balk.setAttribute("role", "region"); balk.setAttribute("aria-label", "Bewerkmodus");
  balk.innerHTML = '<span class="bw-uitleg"><strong>Bewerkmodus</strong> · klik op een tekst om te typen of op een foto om hem te vervangen. <span class="bw-teller"></span></span>' +
    '<button type="button" class="bw-opslaan" disabled>' + opslagTekst + '</button>' + (online ? '<button type="button" class="bw-uit">Sleutel wissen</button>' : '') + '<button type="button" class="bw-stop">Klaar</button>';
  document.body.appendChild(balk);

  var melding = document.createElement("div");
  melding.className = "bw-melding"; melding.setAttribute("role", "status"); melding.setAttribute("aria-live", "polite");
  document.body.appendChild(melding);
  var mt;
  function meld(t, lang) { melding.textContent = t; melding.classList.add("zicht"); clearTimeout(mt); mt = setTimeout(function () { melding.classList.remove("zicht"); }, lang ? 7000 : 3000); }

  var invoer = document.createElement("input");
  invoer.type = "file"; invoer.accept = "image/*"; invoer.hidden = true;
  document.body.appendChild(invoer);

  /* ---------- hulpjes ---------- */
  function zet(pad, waarde) { var o = D; for (var i = 0; i < pad.length - 1; i++) o = o[pad[i]]; o[pad[pad.length - 1]] = waarde; }
  function haal(pad) { return pad.reduce(function (o, k) { return o == null ? o : o[k]; }, D); }
  function teller() {
    var n = Object.keys(gewijzigd).length + Object.keys(nieuweFotos).length;
    $(".bw-teller", balk).textContent = n ? "(" + n + " niet opgeslagen)" : "";
    $(".bw-opslaan", balk).disabled = !n;
  }

  function vernieuw() {
    $$("[data-bewerk]").forEach(function (el) {
      if (aan) {
        el.contentEditable = "plaintext-only";
        if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
        el.spellcheck = true; el.setAttribute("lang", "nl");
      } else el.removeAttribute("contenteditable");
    });
  }
  window.ASVBewerk = { vernieuw: vernieuw };

  function start() { aan = true; document.body.classList.add("bewerkmodus"); balk.hidden = false; knop.hidden = true; vernieuw(); teller(); meld("Bewerkmodus aan. Wijzigingen zie je meteen; klik daarna op ‘" + opslagTekst + "’."); }
  function stop() {
    if (Object.keys(gewijzigd).length + Object.keys(nieuweFotos).length) { meld("Je hebt nog niet opgeslagen. Klik eerst op ‘" + opslagTekst + "’."); return; }
    aan = false; document.body.classList.remove("bewerkmodus"); balk.hidden = true; knop.hidden = false; vernieuw();
  }
  knop.addEventListener("click", function () { if (online && !leesS()) vraagSleutel(start); else start(); });
  $(".bw-stop", balk).addEventListener("click", stop);

  /* ---------- tekst typen ---------- */
  document.addEventListener("input", function (e) {
    if (!aan) return;
    var el = e.target.closest && e.target.closest("[data-bewerk]"); if (!el) return;
    var pad = JSON.parse(el.getAttribute("data-bewerk"));
    var t = el.innerText.replace(/ /g, " ").replace(/\s*\n\s*/g, " ").trim();
    if (haal(pad) !== t) { zet(pad, t); gewijzigd[JSON.stringify(pad)] = 1; el.classList.add("bw-gewijzigd"); el.dataset.bwGewijzigd = "1"; }
    teller();
  }, true);
  document.addEventListener("keydown", function (e) {
    if (!aan) return;
    var el = e.target.closest && e.target.closest("[data-bewerk]");
    if (el && e.key === "Enter") { e.preventDefault(); el.blur(); }
    if (el && (e.key === " " || e.key === "Enter")) e.stopPropagation(); // spatie mag geen knop indrukken
  }, true);

  /* ---------- klikken: tekst kiezen of foto vervangen (niet de vergroting openen) ---------- */
  var fotoPad = null, fotoEl = null;
  document.addEventListener("click", function (e) {
    if (!aan || balk.contains(e.target)) return;
    var tekst = e.target.closest("[data-bewerk]");
    if (tekst) { if (tekst.closest("button")) { e.preventDefault(); e.stopPropagation(); } return; }
    var foto = e.target.closest("[data-bewerk-img]");
    if (foto) {
      e.preventDefault(); e.stopPropagation();
      fotoEl = foto; fotoPad = JSON.parse(foto.getAttribute("data-bewerk-img"));
      invoer.value = ""; invoer.click();
    }
  }, true);

  invoer.addEventListener("change", function () {
    var f = invoer.files && invoer.files[0]; if (!f || !fotoPad) return;
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      // verkleinen voor snelle mobiele website, verhouding blijft gelijk
      var max = 1800, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function (blob) {
        if (!blob) { meld("Deze foto kon niet worden gelezen. Probeer een JPG of PNG."); return; }
        var ext = blob.type === "image/webp" ? ".webp" : ".jpg";
        var basis = (f.name.replace(/\.[^.]+$/, "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "foto").slice(0, 40);
        var naam = "eigen-" + basis + "-" + Date.now().toString(36) + ext;
        nieuweFotos[naam] = blob;
        I.voorbeeld[naam] = URL.createObjectURL(blob);
        zet(fotoPad, naam);
        // direct tonen zonder het venster opnieuw op te bouwen
        var oud = fotoEl.querySelector("img, .ontbreekt"), nieuw = document.createElement("img");
        nieuw.src = I.voorbeeld[naam]; nieuw.alt = oud && oud.alt || ""; nieuw.className = oud && oud.className || "";
        if (oud) oud.parentNode.replaceChild(nieuw, oud); else fotoEl.insertBefore(nieuw, fotoEl.firstChild);
        teller();
        meld("Foto vervangen (" + c.width + " × " + c.height + " px). Vergeet niet op te slaan.");
      }, "image/webp", 0.84);
    };
    img.onerror = function () { meld("Dit bestand is geen afbeelding die de browser kan openen."); };
    img.src = url;
  });

  /* ---------- opslaan ---------- */
  function code() { return KOP + "window.ASV = " + JSON.stringify(D, null, 2) + ";\n"; }
  async function schrijfBestand(map, naam, inhoud) {
    var h = await map.getFileHandle(naam, { create: true }), w = await h.createWritable();
    await w.write(inhoud); await w.close();
  }
  async function opslaan() {
    var knopO = $(".bw-opslaan", balk);
    if (online) return opslaanOnline(knopO);
    if (window.showDirectoryPicker) {
      try {
        if (!mapHandle) {
          meld("Kies de map van de website (de map waarin index.html staat).", true);
          var m = await window.showDirectoryPicker({ id: "asv33-website", mode: "readwrite" });
          try { await m.getFileHandle("index.html"); await m.getFileHandle("inhoud.js"); }
          catch (x) { meld("In deze map staan index.html en inhoud.js niet. Kies de map van de website."); return; }
          mapHandle = m;
        }
        knopO.disabled = true; knopO.textContent = "Bezig met opslaan…";
        var imgMap = await mapHandle.getDirectoryHandle("img", { create: true });
        var namen = Object.keys(nieuweFotos);
        for (var i = 0; i < namen.length; i++) await schrijfBestand(imgMap, namen[i], nieuweFotos[namen[i]]);
        await schrijfBestand(mapHandle, "inhoud.js", code());
        klaar(namen.length);
        meld("Opgeslagen op je pc ✔ " + (namen.length ? namen.length + " foto('s) in de map img/ en " : "") + "inhoud.js bijgewerkt.", true);
      } catch (err) {
        if (err && err.name === "AbortError") { meld("Opslaan geannuleerd."); }
        else { meld("Opslaan lukte niet (" + (err && err.message || err) + "). De bestanden worden nu gedownload."); downloadAlles(); }
      } finally { knopO.textContent = opslagTekst; teller(); }
    } else downloadAlles();
  }
  function download(naam, blob) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = naam;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function downloadAlles() {
    var namen = Object.keys(nieuweFotos);
    download("inhoud.js", new Blob([code()], { type: "text/javascript" }));
    namen.forEach(function (n, i) { setTimeout(function () { download(n, nieuweFotos[n]); }, 400 * (i + 1)); });
    klaar(namen.length);
    meld("Gedownload. Zet inhoud.js in de map van de website" + (namen.length ? " en de foto's in de map img/" : "") + " (vervang het oude bestand). Tip: in Chrome of Edge gaat dit vanzelf.", true);
  }
  function klaar() {
    nieuweFotos = {}; gewijzigd = {};
    $$("[data-bw-gewijzigd]").forEach(function (el) { delete el.dataset.bwGewijzigd; el.classList.remove("bw-gewijzigd"); });
    teller();
  }
  $(".bw-opslaan", balk).addEventListener("click", opslaan);

  /* ---------- online opslaan via GitHub (alleen met jouw sleutel) ---------- */
  function api(pad, opties) {
    opties = opties || {};
    return fetch("https://api.github.com/repos/" + GH.eigenaar + "/" + GH.repo + pad, {
      method: opties.method || "GET",
      headers: { "Authorization": "Bearer " + leesS(), "Accept": "application/vnd.github+json", "Content-Type": "application/json" },
      body: opties.body ? JSON.stringify(opties.body) : undefined, cache: "no-store"
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var f = new Error(j.message || ("HTTP " + r.status)); f.status = r.status; throw f; } return j; }); });
  }
  function naarBase64Tekst(t) { var bytes = new TextEncoder().encode(t), s = ""; for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
  function naarBase64Blob(blob) { return new Promise(function (ok, nee) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(",")[1]); }; r.onerror = nee; r.readAsDataURL(blob); }); }
  async function schrijfOnline(pad, base64, bericht) {
    var sha; try { sha = (await api("/contents/" + pad + "?ref=main")).sha; } catch (e) { if (e.status !== 404) throw e; }
    await api("/contents/" + pad, { method: "PUT", body: { message: bericht, content: base64, sha: sha, branch: "main" } });
  }
  async function opslaanOnline(knopO) {
    knopO.disabled = true;
    try {
      var namen = Object.keys(nieuweFotos);
      for (var i = 0; i < namen.length; i++) {
        knopO.textContent = "Foto " + (i + 1) + " van " + namen.length + " uploaden…";
        await schrijfOnline("img/" + namen[i], await naarBase64Blob(nieuweFotos[namen[i]]), "Foto vervangen via de bewerkmodus");
      }
      knopO.textContent = "Teksten opslaan…";
      await schrijfOnline("inhoud.js", naarBase64Tekst(code()), "Teksten aangepast via de bewerkmodus");
      klaar();
      meld("Opgeslagen ✔ Over ongeveer 1 minuut ziet iedereen de wijziging (ververs met Ctrl + F5).", true);
    } catch (err) {
      if (err.status === 401 || err.status === 403 || err.status === 404) meld("De sleutel werkt niet (meer) of heeft geen schrijfrecht. Klik op ‘Sleutel wissen’ en vul een nieuwe in.", true);
      else meld("Opslaan lukte niet: " + (err.message || err) + ". Je wijzigingen staan nog op je scherm; probeer het opnieuw.", true);
    } finally { knopO.textContent = opslagTekst; teller(); }
  }
  function vraagSleutel(daarna) {
    var v = document.createElement("div");
    v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true"); v.setAttribute("aria-label", "Sleutel invullen");
    v.style.cssText = "position:fixed;inset:0;z-index:100;background:rgba(20,22,26,.6);display:flex;align-items:center;justify-content:center;padding:16px;font:16px/1.5 Inter,system-ui,sans-serif";
    var url = "https://github.com/settings/personal-access-tokens/new";
    v.innerHTML = '<div style="background:#fff;color:#24272c;border-radius:16px;max-width:520px;width:100%;padding:20px 22px;box-shadow:0 20px 50px rgba(0,0,0,.35)">' +
      '<h2 style="margin:0 0 8px;font:900 1.3rem Inter,system-ui,sans-serif">Eenmalig: jouw sleutel</h2>' +
      '<p style="margin:0 0 10px">Met deze sleutel mag alleen jij opslaan. Hij blijft alleen op dit apparaat.</p>' +
      '<ol style="margin:0 0 12px;padding-left:20px"><li>Open <a href="' + url + '" target="_blank" rel="noopener">deze GitHub-pagina</a>.</li>' +
      '<li>Token name: <b>bewerken</b> · Expiration: <b>90 days</b>.</li>' +
      '<li>Repository access: <b>Only select repositories</b> → <b>' + GH.repo + '</b>.</li>' +
      '<li>Permissions → Repository permissions → <b>Contents</b>: <b>Read and write</b>.</li>' +
      '<li>Klik <b>Generate token</b>, kopieer de code (begint met <code>github_pat_</code>) en plak hem hieronder.</li></ol>' +
      '<input type="password" placeholder="github_pat_…" autocomplete="off" style="width:100%;font:inherit;padding:12px;border:2px solid #e4e0db;border-radius:10px">' +
      '<p class="bw-fout" style="color:#9e1b26;font-weight:600;min-height:1.5em;margin:8px 0"></p>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-x style="min-height:44px;padding:8px 16px;border-radius:999px;border:2px solid #e4e0db;background:#fff;font:600 15px Inter,system-ui,sans-serif;cursor:pointer">Annuleren</button>' +
      '<button type="button" data-ok style="min-height:44px;padding:8px 18px;border-radius:999px;border:0;background:#9e1b26;color:#fff;font:700 15px Inter,system-ui,sans-serif;cursor:pointer">Controleren en starten</button></div></div>';
    document.body.appendChild(v);
    var inp = $("input", v), fout = $(".bw-fout", v); inp.focus();
    $("[data-x]", v).addEventListener("click", function () { v.remove(); });
    $("[data-ok]", v).addEventListener("click", async function () {
      var t = inp.value.trim(); if (!t) { fout.textContent = "Plak eerst de sleutel."; return; }
      try { localStorage.setItem(SLEUTEL, t); } catch (e) { fout.textContent = "Deze browser kan de sleutel niet bewaren (privévenster?)."; return; }
      fout.textContent = "Bezig met controleren…";
      try {
        var r = await api("");
        if (!r.permissions || !r.permissions.push) throw Object.assign(new Error("geen schrijfrecht"), { status: 403 });
        v.remove(); daarna();
      } catch (e) {
        try { localStorage.removeItem(SLEUTEL); } catch (x) {}
        fout.textContent = "Deze sleutel werkt niet voor " + GH.repo + ". Controleer stap 3 en 4.";
      }
    });
  }
  var uit = $(".bw-uit", balk);
  if (uit) uit.addEventListener("click", function () { try { localStorage.removeItem(SLEUTEL); } catch (e) {} meld("Sleutel gewist van dit apparaat."); uit.disabled = true; });

  window.addEventListener("beforeunload", function (e) {
    if (Object.keys(gewijzigd).length + Object.keys(nieuweFotos).length) { e.preventDefault(); e.returnValue = ""; }
  });
})();

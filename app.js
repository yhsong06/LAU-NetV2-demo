(() => {
  const $ = (sel) => document.querySelector(sel);

  const statusLine = $("#statusLine");
  const grid = $("#cardsGrid");
  const speakerRadios = $("#speakerRadios");
  const snrTabs = $("#snrTabs");
  const refsList = $("#refsList");

  // Modal
  const modal = $("#modal");
  const modalImg = $("#modalImg");
  const modalTitle = $("#modalTitle");
  const modalClose = $("#modalClose");
  const modalBackdrop = $("#modalBackdrop");

  function openModal(imgSrc, title) {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modalImg.src = imgSrc;
    modalTitle.textContent = title;
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    modalTitle.textContent = "";
  }
  modalClose.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  let DEMO = null;
  let state = { speaker: null, snr: null };

  async function loadManifest() {
    try {
      const res = await fetch("manifest.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      DEMO = await res.json();
      init();
    } catch (e) {
      statusLine.textContent = `Failed to load manifest.json. Run build_manifest.py and serve via http (not file://). Error: ${e}`;
    }
  }

  function setLinks() {
    const code = $("#btnCode");
    const dataset = $("#btnDataset");
    if (DEMO.links?.code) code.href = DEMO.links.code;
    if (DEMO.links?.dataset) dataset.href = DEMO.links.dataset;
  }

  function renderSpeakers() {
    speakerRadios.innerHTML = "";

    DEMO.speakers.forEach((sp, idx) => {
      const el = document.createElement("div");
      el.className = "pill" + (sp.id === state.speaker ? " active" : "");
      el.textContent = sp.label;

      el.addEventListener("click", () => {
        state.speaker = sp.id;
        [...speakerRadios.children].forEach((c) => c.classList.remove("active"));
        el.classList.add("active");
        renderCards();
      });

      speakerRadios.appendChild(el);

      // 첫 번째 speaker를 기본값으로
      if (idx === 0 && !state.speaker) {
        state.speaker = sp.id;
        el.classList.add("active");   // 🔥 이것도 추가
      }
    });

    // 🔥🔥🔥 가장 중요
    renderCards();
  }

  function renderSNRs() {
    snrTabs.innerHTML = "";
    DEMO.snrs.forEach((v, idx) => {
      const el = document.createElement("div");
      el.className = "pill" + (v === state.snr ? " active" : "");
      el.textContent = `${v}`;
      el.addEventListener("click", () => {
        state.snr = v;
        [...snrTabs.children].forEach((c) => c.classList.remove("active"));
        el.classList.add("active");
        renderCards();
      });
      snrTabs.appendChild(el);
      if (idx === 0 && state.snr === null) state.snr = v;
    });
  }

  function renderRefs() {
    refsList.innerHTML = "";
    (DEMO.references || []).forEach((r) => {
      const li = document.createElement("li");
      li.className = "ref-item";

      const text = document.createElement("div");
      text.className = "ref-text";
      text.textContent = r.ieee;

      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "Copy BibTeX";
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(r.bibtex || "");
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = "Copy BibTeX"), 1200);
        } catch {
          btn.textContent = "Copy failed";
          setTimeout(() => (btn.textContent = "Copy BibTeX"), 1200);
        }
      });

      li.appendChild(text);
      li.appendChild(btn);
      refsList.appendChild(li);
    });
  }

  function keyFor(speaker, snr) {
    return `${speaker}|${snr}`;
  }

  function renderCards() {
    grid.innerHTML = "";

    const k = keyFor(state.speaker, state.snr);
    const entry = DEMO.items[k];
    if (!entry) {
      statusLine.textContent = `No entry found for ${k}. Check build_manifest.py output.`;
      return;
    }

    // statusLine.textContent = `Speaker: ${state.speaker} · SNR: ${state.snr} dB · Prefix: ${entry.prefix}`;
    statusLine.textContent = "";

    DEMO.cards.forEach((c) => {
      const files = entry.files[c.key];
      if (!files) return;

      const card = document.createElement("div");
      card.className = "card";

      const h = document.createElement("div");
      h.className = "card-h";

      const t = document.createElement("div");
      t.className = "card-title";
      t.textContent = c.title;

      const sub = document.createElement("div");
      sub.className = "card-sub";
      // sub.textContent = `${entry.prefix}`;
      sub.textContent = "";

      h.appendChild(t);
      h.appendChild(sub);

      const b = document.createElement("div");
      b.className = "card-b";

      const audio = document.createElement("audio");
      audio.className = "audio";
      audio.controls = true;
      audio.preload = "none";
      const src = document.createElement("source");
      src.src = files.audio;
      src.type = "audio/wav";
      audio.appendChild(src);

      const img = document.createElement("img");
      img.className = "spec-thumb";
      img.loading = "lazy";
      img.src = files.spec;
      img.alt = `Spectrogram - ${c.title}`;
      img.addEventListener("click", () => openModal(files.spec, `${c.title} · ${state.speaker} · ${state.snr} dB · ${entry.prefix}`));

      b.appendChild(audio);
      b.appendChild(img);

      card.appendChild(h);
      card.appendChild(b);
      grid.appendChild(card);
    });
  }

  function init() {
    setLinks();

    // initial state
    state.speaker = DEMO.speakers[0].id;
    state.snr = DEMO.snrs[0];

    renderSpeakers();
    renderSNRs();
    renderRefs();
    renderCards();
  }

  loadManifest();
})();
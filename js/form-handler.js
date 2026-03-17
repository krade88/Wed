(() => {
  const form = document.getElementById("rsvp-form");
  if (!form) return;

  const LS_KEY = "wedding_rsvp_v1";

  const modal = document.getElementById("thanks-modal");
  const closeEls = modal ? Array.from(modal.querySelectorAll("[data-modal-close]")) : [];
  let lastActive = null;

  function openModal() {
    if (!modal) return;
    lastActive = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const focusTarget = modal.querySelector(".modal__close") || modal.querySelector("button, [href], input, textarea");
    focusTarget?.focus?.();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    lastActive?.focus?.();
  }

  for (const el of closeEls) el.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hidden) closeModal();
  });
  modal?.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.matches?.("[data-modal-close]")) closeModal();
  });

  function setError(name, message) {
    const holder = form.querySelector(`[data-error-for="${CSS.escape(name)}"]`);
    if (holder) holder.textContent = message || "";
  }

  function getFormData() {
    const fd = new FormData(form);
    const drinks = fd.getAll("drinks");
    return {
      name: String(fd.get("name") || "").trim(),
      attendance: String(fd.get("attendance") || ""),
      guests: String(fd.get("guests") || "").trim(),
      drinks,
      overnight: String(fd.get("overnight") || ""),
      ts: new Date().toISOString(),
    };
  }

  function validate(data) {
    let ok = true;

    setError("name", "");
    setError("attendance", "");
    setError("overnight", "");

    if (!data.name) {
      setError("name", "Пожалуйста, укажите имя и фамилию.");
      ok = false;
    }

    if (!data.attendance) {
      setError("attendance", "Пожалуйста, выберите вариант ответа.");
      ok = false;
    }

    if (!data.overnight) {
      setError("overnight", "Пожалуйста, выберите вариант ответа.");
      ok = false;
    }

    return ok;
  }

  function saveDraft() {
    try {
      const draft = getFormData();
      localStorage.setItem(LS_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d?.name) form.elements.namedItem("name").value = d.name;
      if (d?.guests) form.elements.namedItem("guests").value = d.guests;
      if (d?.attendance) {
        const r = form.querySelector(`input[name="attendance"][value="${CSS.escape(d.attendance)}"]`);
        if (r) r.checked = true;
      }
      if (Array.isArray(d?.drinks)) {
        for (const v of d.drinks) {
          const c = form.querySelector(`input[name="drinks"][value="${CSS.escape(String(v))}"]`);
          if (c) c.checked = true;
        }
      }
      if (d?.overnight) {
        const r = form.querySelector(`input[name="overnight"][value="${CSS.escape(d.overnight)}"]`);
        if (r) r.checked = true;
      }
    } catch {
      // ignore
    }
  }

  restoreDraft();

  form.addEventListener("input", () => {
    window.clearTimeout(form.__saveTimer);
    form.__saveTimer = window.setTimeout(saveDraft, 200);
  });

  async function submitToMockEndpoint(payload) {
    // Static-friendly: try real fetch, but don't block UX if offline.
    const url = "https://jsonplaceholder.typicode.com/posts";
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6500);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = getFormData();
    if (!validate(data)) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const prevText = submitBtn?.textContent || "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Отправляем…";
    }

    let sent = false;
    try {
      await submitToMockEndpoint(data);
      sent = true;
    } catch {
      sent = false;
    }

    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ ...data, sent }));
    } catch {
      // ignore
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = prevText;
    }

    openModal();
  });
})();


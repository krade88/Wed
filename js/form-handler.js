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
      drinks,
      ts: new Date().toISOString(),
    };
  }

  function validate(data) {
    let ok = true;

    setError("name", "");
    setError("attendance", "");

    if (!data.name) {
      setError("name", "Пожалуйста, укажите имя и фамилию.");
      ok = false;
    }

    if (!data.attendance) {
      setError("attendance", "Пожалуйста, выберите вариант ответа.");
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
    } catch {
      // ignore
    }
  }

  restoreDraft();

  form.addEventListener("input", () => {
    window.clearTimeout(form.__saveTimer);
    form.__saveTimer = window.setTimeout(saveDraft, 200);
  });

  // === Отправка в Telegram ===
  // Укажите здесь ваш токен бота и ID чата.
  const TG_BOT_TOKEN = "8781823342:AAEFAYtnYN-Y_ipLxLz056e6JyNde6NeWX4";
  const TG_CHAT_ID = "-1003836633399";

  function formatTelegramMessage(data) {
    const attendanceText =
      data.attendance === "yes" ? "Обязательно буду" : data.attendance === "no" ? "К сожалению, не смогу присутствовать" : "—";

    const drinksMap = {
      red_wine: "Вино красное",
      white_wine: "Вино белое",
      champagne: "Шампанское",
      whiskey: "Виски",
      cognac: "Коньяк",
      vodka: "Водка",
    };

    const drinksList = Array.isArray(data.drinks) && data.drinks.length
      ? data.drinks.map((d) => drinksMap[d] || d).join(", ")
      : "не выбрано";

    return [
      "🍾 <b>Новая анкета гостя</b>",
      "",
      `<b>Имя:</b> ${data.name || "—"}`,
      `<b>Присутствие:</b> ${attendanceText}`,
      `<b>Напитки:</b> ${drinksList}`,
      "",
      `<i>Отправлено:</i> ${new Date(data.ts).toLocaleString("ru-RU")}`,
    ].join("\n");
  }

  async function submitToTelegram(payload) {
    if (!TG_BOT_TOKEN || TG_BOT_TOKEN === "PASTE_YOUR_BOT_TOKEN_HERE") {
      // Если токен не задан, просто считаем отправку успешной,
      // чтобы не ломать UX при разработке.
      return { ok: true };
    }

    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6500);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: formatTelegramMessage(payload),
          parse_mode: "HTML",
        }),
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
      await submitToTelegram(data);
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


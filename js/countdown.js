(() => {
  const root = document.querySelector("[data-countdown]");
  if (!root) return;

  const fields = {
    days: root.querySelector("[data-cd='days']"),
    hours: root.querySelector("[data-cd='hours']"),
    minutes: root.querySelector("[data-cd='minutes']"),
    seconds: root.querySelector("[data-cd='seconds']"),
  };
  const status = root.querySelector("[data-cd-status]");

  // 20.06.2026 16:00 MSK (UTC+3) => 13:00 UTC
  const targetUtcMs = Date.UTC(2026, 6, 20, 13, 0, 0);

  const pad2 = (n) => String(n).padStart(2, "0");

  function render(diffMs) {
    const total = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    if (fields.days) fields.days.textContent = String(days);
    if (fields.hours) fields.hours.textContent = pad2(hours);
    if (fields.minutes) fields.minutes.textContent = pad2(minutes);
    if (fields.seconds) fields.seconds.textContent = pad2(seconds);

    if (status) status.textContent = diffMs <= 0 ? "Событие уже началось." : "";
  }

  let timer = null;
  function tick() {
    const now = Date.now();
    const diff = targetUtcMs - now;
    render(diff);
    if (diff <= 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  tick();
  timer = window.setInterval(tick, 1000);
})();


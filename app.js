(() => {
  "use strict";

  const data = window.SCHEDULE_DATA;
  if (!data || !Array.isArray(data.days)) {
    document.body.innerHTML = "<main><p>Der Arbeitsplan konnte nicht geladen werden.</p></main>";
    return;
  }

  const schedule = new Map(data.days);
  const today = startOfDay(new Date());
  const startDate = fromKey(data.start);
  const endDate = fromKey(data.end);
  const initialDate = today < startDate ? startDate : today > endDate ? endDate : today;
  let visibleMonth = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);

  const todayDate = document.getElementById("todayDate");
  const todayWorkers = document.getElementById("todayWorkers");
  const nextWorker = document.getElementById("nextWorker");
  const nextDate = document.getElementById("nextDate");
  const monthLabel = document.getElementById("monthLabel");
  const calendarDays = document.getElementById("calendarDays");
  const upcomingList = document.getElementById("upcomingList");
  const previousMonth = document.getElementById("previousMonth");
  const nextMonth = document.getElementById("nextMonth");

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function fromKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function addDays(date, amount) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  }

  function workersFor(code) {
    if (code === "JL") return ["Jacek", "Lukasz"];
    if (code === "J") return ["Jacek"];
    if (code === "L") return ["Lukasz"];
    return [];
  }

  function workerLabel(code) {
    const workers = workersFor(code);
    if (workers.length === 2) return "Jacek und Lukasz";
    return workers[0] || "Keine Eintragung";
  }

  function statusClass(code) {
    if (code === "JL") return "both";
    if (code === "J") return "jacek";
    if (code === "L") return "lukasz";
    return "none";
  }

  function formatLong(date) {
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function formatShort(date) {
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  }

  function renderToday() {
    todayDate.textContent = formatLong(today);
    const currentCode = schedule.get(dateKey(today)) || "";
    const workers = workersFor(currentCode);
    todayWorkers.replaceChildren();

    if (workers.length === 0) {
      const badge = document.createElement("span");
      badge.className = "worker-badge none";
      badge.textContent = today < startDate || today > endDate ? "Außerhalb des Planzeitraums" : "Keine Eintragung";
      todayWorkers.append(badge);
    } else {
      workers.forEach((worker) => {
        const badge = document.createElement("span");
        badge.className = `worker-badge ${worker.toLowerCase()}`;
        badge.textContent = worker;
        todayWorkers.append(badge);
      });
    }

    let change = addDays(today, 1);
    while (change <= endDate && (schedule.get(dateKey(change)) || "") === currentCode) {
      change = addDays(change, 1);
    }

    if (change <= endDate) {
      nextWorker.textContent = workerLabel(schedule.get(dateKey(change)) || "");
      nextDate.textContent = formatLong(change);
    } else {
      nextWorker.textContent = "Kein weiterer Wechsel";
      nextDate.textContent = `Plan endet am ${formatLong(endDate)}`;
    }
  }

  function renderCalendar() {
    monthLabel.textContent = new Intl.DateTimeFormat("de-DE", {
      month: "long",
      year: "numeric",
    }).format(visibleMonth);

    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -mondayOffset);
    calendarDays.replaceChildren();

    for (let index = 0; index < 42; index += 1) {
      const date = addDays(gridStart, index);
      const code = schedule.get(dateKey(date)) || "";
      const cell = document.createElement("div");
      const outside = date.getMonth() !== visibleMonth.getMonth();
      const isToday = dateKey(date) === dateKey(today);
      cell.className = `day ${statusClass(code)}${outside ? " outside" : ""}${isToday ? " today" : ""}`;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `${formatLong(date)}: ${workerLabel(code)}`);

      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = String(date.getDate());
      cell.append(number);

      if (!outside && code) {
        const worker = document.createElement("span");
        worker.className = "day-worker";
        worker.textContent = code === "JL" ? "Beide" : workerLabel(code);
        cell.append(worker);
      }
      calendarDays.append(cell);
    }

    const minMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const maxMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    previousMonth.disabled = visibleMonth <= minMonth;
    nextMonth.disabled = visibleMonth >= maxMonth;
  }

  function renderUpcoming() {
    upcomingList.replaceChildren();
    for (let offset = 0; offset < 14; offset += 1) {
      const date = addDays(today, offset);
      const code = schedule.get(dateKey(date)) || "";
      const row = document.createElement("div");
      row.className = "upcoming-row";

      const dateText = document.createElement("p");
      dateText.className = "upcoming-date";
      dateText.textContent = offset === 0 ? `Heute, ${formatShort(date)}` : formatShort(date);

      const worker = document.createElement("span");
      worker.className = `upcoming-worker ${statusClass(code)}`;
      worker.textContent = workerLabel(code);

      row.append(dateText, worker);
      upcomingList.append(row);
    }
  }

  previousMonth.addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  nextMonth.addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  document.getElementById("todayButton").addEventListener("click", () => {
    visibleMonth = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
    renderCalendar();
    document.getElementById("todayHeading").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("dataRange").textContent = `Planzeitraum: ${formatLong(startDate)} bis ${formatLong(endDate)}`;
  renderToday();
  renderCalendar();
  renderUpcoming();
})();


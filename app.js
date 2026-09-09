(() => {
  "use strict";

  const data = window.SCHEDULE_DATA;
  if (!data || !Array.isArray(data.days)) {
    document.body.innerHTML = "<main><p>Nie udało się wczytać grafiku.</p></main>";
    return;
  }

  const translations = {
    pl: {
      locale: "pl-PL",
      title: "Grafik pracy",
      description: "Grafik pracy Jacka i Lukasza",
      language: "Język",
      todayButton: "Dzisiaj",
      today: "Dzisiaj",
      nextChange: "Następna zmiana",
      monthOverview: "Widok miesiąca",
      calendar: "Kalendarz",
      previousMonth: "Poprzedni miesiąc",
      nextMonth: "Następny miesiąc",
      legend: "Legenda kolorów",
      both: "Obaj",
      bothNames: "Jacek i Lukasz",
      preview: "Podgląd",
      next14Days: "Najbliższe 14 dni",
      noEntry: "Brak wpisu",
      outsidePlan: "Poza okresem planu",
      noFurtherChange: "Brak kolejnej zmiany",
      planEnds: "Plan kończy się",
      planRange: "Okres planu",
      holidayLabel: "Poprzednie święta",
      holidayHeading: "Kto pracował?",
      lastEaster: "Ostatnia Wielkanoc",
      lastChristmas: "Ostatnie Boże Narodzenie",
      weekdays: ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"],
    },
    de: {
      locale: "de-DE",
      title: "Arbeitsplan",
      description: "Arbeitsplan für Jacek und Lukasz",
      language: "Sprache",
      todayButton: "Heute",
      today: "Heute",
      nextChange: "Nächster Wechsel",
      monthOverview: "Monatsübersicht",
      calendar: "Kalender",
      previousMonth: "Vorheriger Monat",
      nextMonth: "Nächster Monat",
      legend: "Farblegende",
      both: "Beide",
      bothNames: "Jacek und Lukasz",
      preview: "Vorschau",
      next14Days: "Nächste 14 Tage",
      noEntry: "Keine Eintragung",
      outsidePlan: "Außerhalb des Planzeitraums",
      noFurtherChange: "Kein weiterer Wechsel",
      planEnds: "Plan endet am",
      planRange: "Planzeitraum",
      holidayLabel: "Letzte Feiertage",
      holidayHeading: "Wer hat gearbeitet?",
      lastEaster: "Letztes Ostern",
      lastChristmas: "Letzte Weihnachten",
      weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    },
  };

  const schedule = new Map(data.days);
  const today = startOfDay(new Date());
  const startDate = fromKey(data.start);
  const endDate = fromKey(data.end);
  const initialDate = today < startDate ? startDate : today > endDate ? endDate : today;
  let visibleMonth = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  let selectedDateKey = "";
  let language = readLanguage();

  const elements = {
    todayDate: document.getElementById("todayDate"),
    todayWorkers: document.getElementById("todayWorkers"),
    nextWorker: document.getElementById("nextWorker"),
    nextDate: document.getElementById("nextDate"),
    monthLabel: document.getElementById("monthLabel"),
    calendarDays: document.getElementById("calendarDays"),
    upcomingList: document.getElementById("upcomingList"),
    previousMonth: document.getElementById("previousMonth"),
    nextMonth: document.getElementById("nextMonth"),
    easterDate: document.getElementById("easterDate"),
    easterWorker: document.getElementById("easterWorker"),
    christmasDate: document.getElementById("christmasDate"),
    christmasWorker: document.getElementById("christmasWorker"),
    dataRange: document.getElementById("dataRange"),
  };

  function readLanguage() {
    try {
      return localStorage.getItem("plan-language") === "de" ? "de" : "pl";
    } catch {
      return "pl";
    }
  }

  function saveLanguage(value) {
    try {
      localStorage.setItem("plan-language", value);
    } catch {
      // The choice still works for this visit when storage is unavailable.
    }
  }

  function t(key) {
    return translations[language][key];
  }

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
    if (workers.length === 2) return t("bothNames");
    return workers[0] || t("noEntry");
  }

  function statusClass(code) {
    if (code === "JL") return "both";
    if (code === "J") return "jacek";
    if (code === "L") return "lukasz";
    return "none";
  }

  function formatLong(date) {
    return new Intl.DateTimeFormat(t("locale"), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function formatShort(date) {
    return new Intl.DateTimeFormat(t("locale"), {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  }

  function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function lastEaster() {
    let easter = easterSunday(today.getFullYear());
    if (easter > today) easter = easterSunday(today.getFullYear() - 1);
    return easter;
  }

  function lastChristmas() {
    let christmas = new Date(today.getFullYear(), 11, 25);
    if (christmas > today) christmas = new Date(today.getFullYear() - 1, 11, 25);
    return christmas;
  }

  function renderStaticLanguage() {
    document.documentElement.lang = language;
    document.title = t("title");
    document.querySelector('meta[name="description"]').content = t("description");
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
    });
    document.querySelector(".language-switch").setAttribute("aria-label", t("language"));
    document.querySelector(".legend").setAttribute("aria-label", t("legend"));
    document.querySelector(".calendar").setAttribute("aria-label", t("calendar"));
    elements.previousMonth.setAttribute("aria-label", t("previousMonth"));
    elements.previousMonth.title = t("previousMonth");
    elements.nextMonth.setAttribute("aria-label", t("nextMonth"));
    elements.nextMonth.title = t("nextMonth");
    document.querySelectorAll(".weekday").forEach((cell, index) => {
      cell.textContent = t("weekdays")[index];
    });
  }

  function renderToday() {
    elements.todayDate.textContent = formatLong(today);
    const currentCode = schedule.get(dateKey(today)) || "";
    const workers = workersFor(currentCode);
    elements.todayWorkers.replaceChildren();

    if (workers.length === 0) {
      const badge = document.createElement("span");
      badge.className = "worker-badge none";
      badge.textContent = today < startDate || today > endDate ? t("outsidePlan") : t("noEntry");
      elements.todayWorkers.append(badge);
    } else {
      workers.forEach((worker) => {
        const badge = document.createElement("span");
        badge.className = `worker-badge ${worker.toLowerCase()}`;
        badge.textContent = worker;
        elements.todayWorkers.append(badge);
      });
    }

    let change = addDays(today, 1);
    while (change <= endDate && (schedule.get(dateKey(change)) || "") === currentCode) {
      change = addDays(change, 1);
    }

    if (change <= endDate) {
      elements.nextWorker.textContent = workerLabel(schedule.get(dateKey(change)) || "");
      elements.nextDate.textContent = formatLong(change);
    } else {
      elements.nextWorker.textContent = t("noFurtherChange");
      elements.nextDate.textContent = `${t("planEnds")} ${formatLong(endDate)}`;
    }
  }

  function renderHolidayWorker(element, date) {
    const code = schedule.get(dateKey(date)) || "";
    element.className = `holiday-worker ${statusClass(code)}`;
    element.textContent = workerLabel(code);
  }

  function renderHolidays() {
    const easter = lastEaster();
    const christmas = lastChristmas();
    elements.easterDate.textContent = formatLong(easter);
    elements.christmasDate.textContent = formatLong(christmas);
    renderHolidayWorker(elements.easterWorker, easter);
    renderHolidayWorker(elements.christmasWorker, christmas);
  }

  function renderCalendar() {
    elements.monthLabel.textContent = new Intl.DateTimeFormat(t("locale"), {
      month: "long",
      year: "numeric",
    }).format(visibleMonth);

    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -mondayOffset);
    elements.calendarDays.replaceChildren();

    for (let index = 0; index < 42; index += 1) {
      const date = addDays(gridStart, index);
      const key = dateKey(date);
      const code = schedule.get(key) || "";
      const cell = document.createElement("div");
      const outside = date.getMonth() !== visibleMonth.getMonth();
      const isToday = key === dateKey(today);
      const isSelected = key === selectedDateKey;
      cell.className = `day ${statusClass(code)}${outside ? " outside" : ""}${isToday ? " today" : ""}${isSelected ? " selected" : ""}`;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `${formatLong(date)}: ${workerLabel(code)}`);

      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = String(date.getDate());
      cell.append(number);

      if (!outside && code) {
        const worker = document.createElement("span");
        worker.className = "day-worker";
        worker.textContent = code === "JL" ? t("both") : workerLabel(code);
        cell.append(worker);
      }
      elements.calendarDays.append(cell);
    }

    const minMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const maxMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    elements.previousMonth.disabled = visibleMonth <= minMonth;
    elements.nextMonth.disabled = visibleMonth >= maxMonth;
  }

  function renderUpcoming() {
    elements.upcomingList.replaceChildren();
    for (let offset = 0; offset < 14; offset += 1) {
      const date = addDays(today, offset);
      const code = schedule.get(dateKey(date)) || "";
      const row = document.createElement("div");
      row.className = "upcoming-row";

      const dateText = document.createElement("p");
      dateText.className = "upcoming-date";
      dateText.textContent = offset === 0 ? `${t("today")}, ${formatShort(date)}` : formatShort(date);

      const worker = document.createElement("span");
      worker.className = `upcoming-worker ${statusClass(code)}`;
      worker.textContent = workerLabel(code);

      row.append(dateText, worker);
      elements.upcomingList.append(row);
    }
  }

  function renderFooter() {
    elements.dataRange.textContent = `${t("planRange")}: ${formatLong(startDate)} – ${formatLong(endDate)}`;
  }

  function renderAll() {
    renderStaticLanguage();
    renderToday();
    renderHolidays();
    renderCalendar();
    renderUpcoming();
    renderFooter();
  }

  function jumpToDate(date) {
    selectedDateKey = dateKey(date);
    visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    renderCalendar();
    document.querySelector(".calendar-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  elements.previousMonth.addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    selectedDateKey = "";
    renderCalendar();
  });

  elements.nextMonth.addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    selectedDateKey = "";
    renderCalendar();
  });

  document.getElementById("todayButton").addEventListener("click", () => {
    selectedDateKey = dateKey(today);
    visibleMonth = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
    renderCalendar();
    document.getElementById("todayHeading").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("easterButton").addEventListener("click", () => jumpToDate(lastEaster()));
  document.getElementById("christmasButton").addEventListener("click", () => jumpToDate(lastChristmas()));

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => {
      language = button.dataset.language;
      saveLanguage(language);
      renderAll();
    });
  });

  renderAll();
})();

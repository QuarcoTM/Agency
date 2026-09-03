(() => {
  'use strict';

  const DAY_MS = 24 * 60 * 60 * 1000;
  const monthNames = [
    'януари','февруари','март','април','май','юни',
    'юли','август','септември','октомври','ноември','декември'
  ];
  const weekdayNames = ['неделя','понеделник','вторник','сряда','четвъртък','петък','събота'];

  function addDays(date, days) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }

  // Meeus algorithm for Orthodox Easter:
  // first calculates the Easter date in the Julian calendar,
  // then converts it to the Gregorian calendar used in Bulgaria.
  function orthodoxEaster(year) {
    const a = year % 4;
    const b = year % 7;
    const c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const julianMonth = Math.floor((d + e + 114) / 31);
    const julianDay = ((d + e + 114) % 31) + 1;

    // Difference between Julian and Gregorian calendars for March/April in this year.
    const calendarShift = Math.floor(year / 100) - Math.floor(year / 400) - 2;
    const gregorianBase = new Date(Date.UTC(year, julianMonth - 1, julianDay));
    return addDays(gregorianBase, calendarShift);
  }

  function previousSaturdayBeforeNov8(year) {
    const nov8 = new Date(Date.UTC(year, 10, 8));
    const weekday = nov8.getUTCDay(); // Sun=0 ... Sat=6
    // Strictly the Saturday before 8 November.
    const daysBack = weekday === 6 ? 7 : ((weekday + 1) % 7);
    return addDays(nov8, -daysBack);
  }

  function zadushnitsiForYear(year) {
    const easter = orthodoxEaster(year);

    return [
      {
        key: 'mesopustna',
        name: 'Месопустна задушница',
        date: addDays(easter, -57),
        text: 'Съботата преди Месопустна неделя. Ден за общ помен на починалите.'
      },
      {
        key: 'chereshova',
        name: 'Черешова задушница',
        date: addDays(easter, 48),
        text: 'Съботата преди Петдесетница. Нарича се още Свето-Троична задушница.'
      },
      {
        key: 'arhangelova',
        name: 'Архангелова задушница',
        date: previousSaturdayBeforeNov8(year),
        text: 'Съботата преди Архангеловден – празника Събор на св. архангел Михаил.'
      }
    ];
  }

  function formatDate(date) {
    return `${date.getUTCDate()} ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()} г.`;
  }

  function formatLongDate(date) {
    return `${weekdayNames[date.getUTCDay()]}, ${formatDate(date)}`;
  }

  function ymd(date) {
    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0')
    ].join('-');
  }

  function icsDate(date) {
    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0')
    ].join('');
  }

  function escapeICS(value) {
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  function downloadCalendarEvent(item) {
    const nextDay = addDays(item.date, 1);
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const uid = `${item.key}-${ymd(item.date)}@deninosht.bg`;

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Den i Nosht//Zadushnitsi//BG',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(item.date)}`,
      `DTEND;VALUE=DATE:${icsDate(nextDay)}`,
      `SUMMARY:${escapeICS(item.name)}`,
      `DESCRIPTION:${escapeICS('Задушница – ден за помен на починалите. deninosht.bg')}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.key}-${ymd(item.date)}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function daysUntil(date, today) {
    return Math.ceil((date.getTime() - today.getTime()) / DAY_MS);
  }

  function nextZadushnitsa(today) {
    const currentYear = today.getUTCFullYear();
    const candidates = [
      ...zadushnitsiForYear(currentYear),
      ...zadushnitsiForYear(currentYear + 1)
    ].filter(item => item.date.getTime() >= today.getTime());

    candidates.sort((a, b) => a.date - b.date);
    return candidates[0];
  }

  function cardMarkup(item) {
    return `
      <article class="zad-card">
        <div class="zad-card-date">
          <span class="zad-card-day">${item.date.getUTCDate()}</span>
          <span>${monthNames[item.date.getUTCMonth()]}</span>
        </div>
        <div class="zad-card-copy">
          <h3>${item.name}</h3>
          <p class="zad-full-date">${formatLongDate(item.date)}</p>
          <p>${item.text}</p>
        </div>
        <button class="zad-calendar-button" type="button" data-key="${item.key}" data-date="${ymd(item.date)}">
          Добави в календара
        </button>
      </article>`;
  }

  function renderYear(year, target) {
    target.innerHTML = `
      <div class="zad-year-head">
        <h2>Задушници през ${year} г.</h2>
      </div>
      <div class="zad-list">
        ${zadushnitsiForYear(year).map(cardMarkup).join('')}
      </div>`;
  }

  function renderSearchIntent(year, target) {
    const items = zadushnitsiForYear(year);
    target.innerHTML = `
      <h2>Дати на задушниците през ${year} г.</h2>
      <div class="zad-search-grid">
        <article>
          <h3>Кога е Месопустна задушница през ${year}?</h3>
          <p>Месопустна задушница през ${year} г. е на <strong>${formatDate(items[0].date)}</strong></p>
        </article>
        <article>
          <h3>Кога е Черешова задушница през ${year}?</h3>
          <p>Черешова задушница през ${year} г. е на <strong>${formatDate(items[1].date)}</strong></p>
        </article>
        <article>
          <h3>Кога е Архангелова задушница през ${year}?</h3>
          <p>Архангелова задушница през ${year} г. е на <strong>${formatDate(items[2].date)}</strong></p>
        </article>
      </div>`;
  }

  function init() {
    const currentTarget = document.querySelector('[data-zad-current]');
    const nextTarget = document.querySelector('[data-zad-next]');
    const nextBox = document.querySelector('[data-zad-next-up]');
    const pageHeading = document.querySelector('[data-zad-page-heading]');
    const searchIntent = document.querySelector('[data-zad-search-intent]');

    if (!currentTarget || !nextTarget || !nextBox) return;

    const nowLocal = new Date();
    // Work with a date-only UTC value to avoid DST/timezone day shifts.
    const today = new Date(Date.UTC(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate()));
    const year = today.getUTCFullYear();

    if (pageHeading) {
      pageHeading.textContent = `Задушници през ${year} и ${year + 1} г.`;
    }

    renderYear(year, currentTarget);
    renderYear(year + 1, nextTarget);
    if (searchIntent) renderSearchIntent(year, searchIntent);

    const upcoming = nextZadushnitsa(today);
    const remaining = daysUntil(upcoming.date, today);
    let remainingText = '';
    if (remaining === 0) remainingText = 'Днес е задушница';
    else if (remaining === 1) remainingText = 'Остава 1 ден';
    else remainingText = `Остават ${remaining} дни`;

    nextBox.innerHTML = `
      <div class="zad-next-label">Следваща задушница</div>
      <div class="zad-next-main">
        <div>
          <strong>${upcoming.name}</strong>
          <span>${formatLongDate(upcoming.date)}</span>
        </div>
        <div class="zad-countdown">${remainingText}</div>
      </div>`;

    const itemMap = new Map();
    [...zadushnitsiForYear(year), ...zadushnitsiForYear(year + 1)].forEach(item => {
      itemMap.set(`${item.key}|${ymd(item.date)}`, item);
    });

    document.addEventListener('click', event => {
      const button = event.target.closest('.zad-calendar-button');
      if (!button) return;
      const item = itemMap.get(`${button.dataset.key}|${button.dataset.date}`);
      if (item) downloadCalendarEvent(item);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

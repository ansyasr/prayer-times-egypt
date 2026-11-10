(function () {
  "use strict";

  /* ============ أدوات مساعدة ============ */
  const $ = (id) => document.getElementById(id);
  const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  const num = (s) => String(s).replace(/\d/g, (d) => AR_DIGITS[d]);
  const pad = (n) => String(n).padStart(2, "0");
  const apiDate = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  const toMin = (t) => { const [h, m] = t.slice(0, 5).split(":").map(Number); return h * 60 + m; };
  const addMin = (t, add) => {
    const total = (toMin(t) + add + 1440) % 1440;
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  };
  const fmt12 = (t) => {
    const [h, m] = t.slice(0, 5).split(":").map(Number);
    const h12 = h % 12 || 12;
    return `${num(h12 + ":" + pad(m))} ${h >= 12 ? "م" : "ص"}`;
  };
  const fmtLongDate = (d) =>
    d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  /* ============ الاتصال بالـ API (Aladhan) ============ */
  const cache = {};
  async function getData(url) {
    if (cache[url]) return cache[url];
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (json.code !== 200) throw new Error("API error");
    cache[url] = json.data;
    return json.data;
  }
  // method=5 : الهيئة المصرية العامة للمساحة
  const getTimings = (date, lat, lng) =>
    getData(
      `https://api.aladhan.com/v1/timings/${apiDate(date)}?latitude=${lat}&longitude=${lng}&method=5&timezonestring=Africa/Cairo`
    );

  /* ============ اختيار المحافظة والمدينة ============ */
  const selection = { g: "", c: "" };
  let hasSavedSelection = false;
  let selectionRevision = 0;
  try {
    const saved = JSON.parse(localStorage.getItem("egPrayerSel") || "null");
    if (saved && EGYPT[saved.g] && EGYPT[saved.g].c[saved.c]) {
      selection.g = String(saved.g);
      selection.c = String(saved.c);
      hasSavedSelection = true;
    }
  } catch (e) { /* تجاهل */ }

  function saveSelection() {
    try { localStorage.setItem("egPrayerSel", JSON.stringify(selection)); } catch (e) { /* تجاهل */ }
  }

  function fillGovs(sel) {
    sel.innerHTML = '<option value="">اختر المحافظة</option>' +
      EGYPT.map((x, i) => `<option value="${i}">${x.g}</option>`).join("");
  }
  function fillCities(sel, gIdx) {
    if (gIdx === "") {
      sel.innerHTML = '<option value="">اختر المدينة</option>';
      sel.disabled = true;
      return;
    }
    sel.innerHTML = '<option value="">اختر المدينة</option>' +
      EGYPT[gIdx].c.map((x, i) => `<option value="${i}">${x[0]}</option>`).join("");
    sel.disabled = false;
  }
  function applySelectionToForms() {
    [["dGov", "dCity"], ["oGov", "oCity"]].forEach(([g, c]) => {
      $(g).value = selection.g;
      fillCities($(c), selection.g);
      $(c).value = selection.c;
    });
  }
  function currentPlace() {
    if (selection.g === "" || selection.c === "") return null;
    const gov = EGYPT[selection.g];
    const city = gov.c[selection.c];
    return {
      gov: gov.g,
      name: city[0],
      lat: city[1],
      lng: city[2]
    };
  }

  function onGovChange(e) {
    selectionRevision++;
    selection.g = e.target.value;
    selection.c = "";
    saveSelection();
    applySelectionToForms();
    renderAll();
  }
  function onCityChange(e) {
    selectionRevision++;
    selection.c = e.target.value;
    saveSelection();
    applySelectionToForms();
    renderAll();
  }

  function setLocationStatus(message) {
    const status = $("locationStatus");
    status.textContent = message;
    status.hidden = !message;
  }

  function nearestPlace(lat, lng) {
    const radians = (degrees) => degrees * Math.PI / 180;
    let nearest = null;
    let shortest = Infinity;

    EGYPT.forEach((gov, g) => {
      gov.c.forEach((city, c) => {
        const latDistance = radians(city[1] - lat);
        const lngDistance = radians(city[2] - lng);
        const a = Math.sin(latDistance / 2) ** 2 +
          Math.cos(radians(lat)) * Math.cos(radians(city[1])) * Math.sin(lngDistance / 2) ** 2;
        const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distance < shortest) {
          shortest = distance;
          nearest = { g, c, distance };
        }
      });
    });

    return nearest;
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationStatus("تحديد الموقع غير متاح في هذا المتصفح. اختر المحافظة والمدينة يدويًا.");
      return;
    }

    const revision = selectionRevision;
    const button = $("locateBtn");
    button.disabled = true;
    setLocationStatus("جاري تحديد موقعك...");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        button.disabled = false;
        if (revision !== selectionRevision) {
          setLocationStatus("تم الاحتفاظ بالمحافظة والمدينة اللتين اخترتهما يدويًا.");
          return;
        }

        const { latitude, longitude } = coords;
        if (latitude < 21.5 || latitude > 32.5 || longitude < 24.5 || longitude > 37.5) {
          setLocationStatus("الموقع خارج مصر. اختر المحافظة والمدينة يدويًا.");
          return;
        }

        const nearest = nearestPlace(latitude, longitude);
        if (!nearest || nearest.distance > 100) {
          setLocationStatus("تعذر تحديد أقرب مدينة لموقعك. اختر المحافظة والمدينة يدويًا.");
          return;
        }

        selection.g = String(nearest.g);
        selection.c = String(nearest.c);
        saveSelection();
        applySelectionToForms();
        renderAll();

        const place = currentPlace();
        setLocationStatus(`تم تحديد موقعك بالقرب من ${place.name}، محافظة ${place.gov}.`);
      },
      (error) => {
        button.disabled = false;
        if (revision !== selectionRevision) {
          setLocationStatus("تم الاحتفاظ بالمحافظة والمدينة اللتين اخترتهما يدويًا.");
          return;
        }
        const message = error.code === error.PERMISSION_DENIED
          ? "لم يتم السماح بالوصول إلى الموقع. اختر المحافظة والمدينة يدويًا أو اسمح بالموقع."
          : error.code === error.TIMEOUT
            ? "استغرق تحديد الموقع وقتًا طويلًا. اختر المحافظة والمدينة يدويًا أو حاول مرة أخرى."
            : "تعذر تحديد موقعك. اختر المحافظة والمدينة يدويًا أو حاول مرة أخرى.";
        setLocationStatus(message);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
    );
  }

  function autoLocateWhenAvailable() {
    if (!navigator.geolocation) return;
    if (!hasSavedSelection) {
      locateUser();
      return;
    }
    if (!navigator.permissions || !navigator.permissions.query) return;

    const revision = selectionRevision;
    navigator.permissions.query({ name: "geolocation" }).then((permission) => {
      if (permission.state === "granted" && revision === selectionRevision) locateUser();
    }).catch(() => {
      setLocationStatus("يمكنك تحديد موقعك تلقائيًا من الزر، أو اختيار المحافظة والمدينة يدويًا.");
    });
  }

  /* ============ التبويبات ============ */
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll(".tab").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on);
      });
      $("tab-daily").hidden = tab !== "daily";
      $("tab-other").hidden = tab !== "other";
    });
  });

  /* ============ مواعيد الصلاة اليومية ============ */
  const PRAYERS = [
    { key: "Fajr", name: "الفجر" },
    { key: "Sunrise", name: "الشروق", minor: true },
    { key: "Dhuhr", name: "الظهر" },
    { key: "Asr", name: "العصر" },
    { key: "Maghrib", name: "المغرب" },
    { key: "Isha", name: "العشاء" }
  ];
  let daily = null;       // { times, tomorrowFajr }
  let dailyToken = 0;
  let hijriYear = null;

  function show(prefix, state) {
    // state: hint | loading | error | result
    $(prefix + "Hint").hidden = state !== "hint";
    $(prefix + "Loading").hidden = state !== "loading";
    $(prefix + "Error").hidden = state !== "error";
    $(prefix + "Result").hidden = state !== "result";
  }

  async function renderDaily() {
    const place = currentPlace();
    const token = ++dailyToken;
    daily = null;
    if (!place) { show("d", "hint"); return; }
    show("d", "loading");
    try {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 86400000);
      const [t, tm] = await Promise.all([
        getTimings(today, place.lat, place.lng),
        getTimings(tomorrow, place.lat, place.lng)
      ]);
      if (token !== dailyToken) return;
      hijriYear = parseInt(t.date.hijri.year, 10);
      daily = { times: t.timings, tomorrowFajr: tm.timings.Fajr };

      $("dList").innerHTML = PRAYERS.map((p) =>
        `<li data-key="${p.key}" class="${p.minor ? "minor" : ""}">
           <span class="name">${p.name}</span>
           <span class="time">${fmt12(t.timings[p.key])}</span>
         </li>`
      ).join("");
      $("dPlace").textContent = `المواعيد بتوقيت ${place.name} - ${place.gov} (الهيئة المصرية العامة للمساحة)`;
      show("d", "result");
      updateNext();
    } catch (err) {
      if (token !== dailyToken) return;
      show("d", "error");
    }
  }

  function updateNext() {
    if (!daily) return;
    const now = new Date();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const five = PRAYERS.filter((p) => !p.minor);
    let next = null, remain = 0, timeStr = "";

    for (const p of five) {
      const sec = toMin(daily.times[p.key]) * 60;
      if (sec > nowSec) { next = p; remain = sec - nowSec; timeStr = daily.times[p.key]; break; }
    }
    if (!next) {
      next = five[0];
      timeStr = daily.tomorrowFajr;
      remain = 86400 - nowSec + toMin(daily.tomorrowFajr) * 60;
    }

    document.querySelectorAll("#dList li").forEach((li) =>
      li.classList.toggle("next", li.dataset.key === next.key)
    );
    $("nextName").textContent = next.name;
    $("nextTime").textContent = fmt12(timeStr);
    const h = Math.floor(remain / 3600), m = Math.floor((remain % 3600) / 60), s = remain % 60;
    $("nextCount").textContent = num(`${pad(h)}:${pad(m)}:${pad(s)}`);
  }
  setInterval(updateNext, 1000);

  // لو الصفحة فضلت مفتوحة وعدّى منتصف الليل، نحدّث التاريخ والمواعيد تلقائياً
  let lastDay = new Date().getDate();
  setInterval(() => {
    const d = new Date().getDate();
    if (d !== lastDay) {
      lastDay = d;
      $("todayText").textContent = fmtLongDate(new Date());
      renderAll();
    }
  }, 30000);

  /* ============ صلوات أخرى ============ */
  let otherToken = 0;

  function parseApiDate(str) {
    const [d, m, y] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  async function hijriToGreg(day, month, year) {
    const data = await getData(`https://api.aladhan.com/v1/hToG/${pad(day)}-${pad(month)}-${year}`);
    return parseApiDate(data.gregorian.date);
  }
  async function getHijriYear(place) {
    if (hijriYear) return hijriYear;
    const t = await getTimings(new Date(), place.lat, place.lng);
    hijriYear = parseInt(t.date.hijri.year, 10);
    return hijriYear;
  }

  function showOther(title, big, sub, details, note) {
    $("oTitle").textContent = title;
    $("oBig").textContent = big;
    $("oSub").textContent = sub;
    $("oDetails").innerHTML = details.map((d) => `<li><span>${d[0]}</span><span>${d[1]}</span></li>`).join("");
    $("oNote").textContent = note;
    show("o", "result");
  }

  async function renderOther() {
    const place = currentPlace();
    const token = ++otherToken;
    if (!place) { show("o", "hint"); return; }
    show("o", "loading");
    const type = $("oType").value;
    const today = new Date();

    try {
      if (type === "qiyam") {
        const tomorrow = new Date(today.getTime() + 86400000);
        const [t, tm] = await Promise.all([
          getTimings(today, place.lat, place.lng),
          getTimings(tomorrow, place.lat, place.lng)
        ]);
        if (token !== otherToken) return;
        showOther(
          "قيام الليل",
          fmt12(t.timings.Lastthird),
          "بداية الثلث الأخير من الليل",
          [
            ["أذان المغرب", fmt12(t.timings.Maghrib)],
            ["منتصف الليل", fmt12(t.timings.Midnight)],
            ["بداية الثلث الأخير", fmt12(t.timings.Lastthird)],
            ["ينتهي عند أذان الفجر", fmt12(tm.timings.Fajr)]
          ],
          "الثلث الأخير من الليل هو أفضل وقت للقيام والدعاء. يمكن القيام في أي وقت بعد صلاة العشاء حتى الفجر."
        );
      } else if (type === "jumua") {
        const diff = (5 - today.getDay() + 7) % 7;
        const friday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
        const t = await getTimings(friday, place.lat, place.lng);
        if (token !== otherToken) return;
        showOther(
          "صلاة الجمعة",
          fmt12(t.timings.Dhuhr),
          diff === 0 ? "اليوم" : "الجمعة القادمة",
          [
            ["اليوم", fmtLongDate(friday)],
            ["دخول وقت الظهر (الأذان)", fmt12(t.timings.Dhuhr)],
            ["أذان العصر", fmt12(t.timings.Asr)]
          ],
          "تبدأ صلاة الجمعة بعد الأذان والخطبة، ويختلف موعد إقامتها قليلاً من مسجد لآخر."
        );
      } else {
        const isFitr = type === "fitr";
        const year = await getHijriYear(place);
        let date = isFitr ? await hijriToGreg(1, 10, year) : await hijriToGreg(10, 12, year);
        if (date < startOfDay(today)) {
          date = isFitr ? await hijriToGreg(1, 10, year + 1) : await hijriToGreg(10, 12, year + 1);
        }
        const t = await getTimings(date, place.lat, place.lng);
        if (token !== otherToken) return;
        const prayerTime = addMin(t.timings.Sunrise, 20);
        const days = Math.round((startOfDay(date) - startOfDay(today)) / 86400000);
        showOther(
          isFitr ? "صلاة عيد الفطر" : "صلاة عيد الأضحى",
          fmt12(prayerTime),
          days === 0 ? "اليوم" : `بعد ${num(days)} يوم`,
          [
            ["التاريخ المتوقع", fmtLongDate(date)],
            ["شروق الشمس", fmt12(t.timings.Sunrise)],
            ["موعد الصلاة (تقريباً)", fmt12(prayerTime)]
          ],
          "تُصلّى صلاة العيد بعد شروق الشمس بحوالي 15 إلى 20 دقيقة. التاريخ والموعد الرسميان تحددهما رؤية الهلال ووزارة الأوقاف، وقد يختلف الموعد من مسجد لآخر."
        );
      }
    } catch (err) {
      if (token !== otherToken) return;
      show("o", "error");
    }
  }

  /* ============ تشغيل ============ */
  function renderAll() {
    renderDaily();
    renderOther();
  }

  function init() {
    $("todayText").textContent = fmtLongDate(new Date());
    $("year").textContent = num(new Date().getFullYear());

    fillGovs($("dGov"));
    fillGovs($("oGov"));
    applySelectionToForms();

    $("dGov").addEventListener("change", onGovChange);
    $("oGov").addEventListener("change", onGovChange);
    $("dCity").addEventListener("change", onCityChange);
    $("oCity").addEventListener("change", onCityChange);
    $("oType").addEventListener("change", renderOther);
    $("dRetry").addEventListener("click", renderDaily);
    $("oRetry").addEventListener("click", renderOther);
    $("locateBtn").addEventListener("click", locateUser);

    renderAll();
    autoLocateWhenAvailable();
  }

  init();
})();
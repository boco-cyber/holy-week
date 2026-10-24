const params = new URLSearchParams(location.search);
const lang = params.get('lang') === 'ar' ? 'ar' : 'en';
const ar = lang === 'ar';
const $ = id => document.getElementById(id);
const copy = ar ? {
  brand: 'شرح الإيمان القبطي', eyebrow: 'رحلة إلى القيامة', title: 'أسبوع الآلام', titleSub: 'ساعة بساعة.',
  subtitle: 'الأناجيل والتأملات الروحية لكل ساعة من رحلة البصخة.', edition: 'العربية والإنجليزية · ٧ أيام · ٥٩ قراءة',
  api: 'واجهة بيانات القراءات ↗', searchLabel: 'ابحث عن قراءة', placeholder: 'ابحث في الأناجيل…', dayLabel: 'يوم من أسبوع الآلام',
  allDays: 'كل الأيام', count: 'قراءة', intro: 'المقدمة', loading: 'جارٍ تحميل القراءات…', print: 'طباعة', previous: 'السابق', next: 'التالي',
  error: 'تعذّر تحميل القراءات. يُرجى المحاولة مرة أخرى.', retry: 'حاول مرة أخرى', empty: 'لا توجد قراءات مطابقة. جرّب بحثًا آخر.',
  footer: 'أسبوع الآلام · شرح الإيمان القبطي', source: 'المصدر على GitHub ↗', smaller: 'تصغير الخط', larger: 'تكبير الخط',
} : {
  brand: 'Coptic Faith', eyebrow: 'THE JOURNEY TO THE RESURRECTION', title: 'Holy Week', titleSub: 'Hour by hour.',
  subtitle: 'The Gospels and spiritual reflections for each hour of the Pascha journey.', edition: 'ENGLISH & ARABIC · 7 DAYS · 59 READINGS',
  api: 'Public readings API ↗', searchLabel: 'Find a reading', placeholder: 'Search the Gospels…', dayLabel: 'Day of Holy Week', allDays: 'All days',
  count: 'readings', intro: 'Introduction', loading: 'Loading readings…', print: 'Print', previous: 'Previous', next: 'Next',
  error: 'Unable to load the readings. Please try again.', retry: 'Try again', empty: 'No matching readings. Try another search.',
  footer: 'Holy Week · Coptic Faith Explained', source: 'Source on GitHub ↗', smaller: 'Decrease text size', larger: 'Increase text size',
};
document.documentElement.lang = lang;
document.documentElement.dir = ar ? 'rtl' : 'ltr';
document.title = `${copy.title} · ${copy.titleSub}`;
for (const [id, value] of Object.entries({ brand: copy.brand, eyebrow: copy.eyebrow, subtitle: copy.subtitle, edition: copy.edition, api: copy.api, 'search-label': copy.searchLabel, 'day-label': copy.dayLabel, count: copy.loading, print: copy.print, previous: copy.previous, next: copy.next, retry: copy.retry, footer: copy.footer, source: copy.source })) $(id).textContent = value;
$('title').replaceChildren(document.createTextNode(copy.title));
const titleSub = document.createElement('span'); titleSub.textContent = copy.titleSub; $('title').append(titleSub);
$('search').placeholder = copy.placeholder;
$('smaller').setAttribute('aria-label', copy.smaller); $('larger').setAttribute('aria-label', copy.larger);
$(lang).setAttribute('aria-current', 'page');
$('api').href = `/api/v1/book?lang=${lang}`;
let all = [], filtered = [], active = '', size = 19;
function normalize(text) { return String(text).normalize('NFKD').replace(/[\u064B-\u065F\u0670ـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase(); }
function paragraphs(target, rows) {
  $(target).replaceChildren(...(rows || []).map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
}
function updateUrl() {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries({ lang, day: $('day').value, q: $('search').value, entry: active })) {
    if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
  }
  history.replaceState(null, '', url);
  for (const language of ['en', 'ar']) {
    const link = new URL(url); link.searchParams.set('lang', language); $(language).href = link.pathname + link.search;
  }
}
function select(id, focus = false) {
  const entry = filtered.find(item => item.id === id) || filtered[0];
  if (!entry) return;
  active = entry.id;
  $('reading-day').textContent = entry.day;
  $('reading-title').textContent = entry.hour_heading || entry.commentary_title;
  $('reference').textContent = entry.scripture_reference || '';
  $('commentary-title').textContent = entry.commentary_title || '';
  paragraphs('passage', entry.biblical_passage); paragraphs('commentary', entry.commentary_body);
  $('reading').setAttribute('aria-busy', 'false');
  $('previous').disabled = filtered.indexOf(entry) === 0;
  $('next').disabled = filtered.indexOf(entry) === filtered.length - 1;
  for (const button of $('list').children) {
    if (button.dataset.id === active) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
  }
  updateUrl();
  if (focus) { $('reading').focus({ preventScroll: true }); $('reading').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}
function filter() {
  const terms = normalize($('search').value).split(/\s+/).filter(Boolean);
  filtered = all.filter(entry => (!$('day').value || String(entry.day_index) === $('day').value) && terms.every(term => entry.search.includes(term)));
  $('count').textContent = `${filtered.length.toLocaleString(lang)} ${copy.count}`;
  $('list').replaceChildren(...filtered.map(entry => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.id = entry.id;
    const day = document.createElement('span'); day.textContent = entry.day;
    button.append(day, document.createTextNode(entry.hour_heading || entry.commentary_title));
    button.addEventListener('click', () => select(entry.id, true)); return button;
  }));
  if (filtered.length) select(active);
  else {
    active = ''; $('reading-title').textContent = copy.empty; $('reading-day').textContent = ''; $('reference').textContent = '';
    $('passage').replaceChildren(); $('commentary-title').textContent = ''; $('commentary').replaceChildren();
    $('previous').disabled = true; $('next').disabled = true; updateUrl();
  }
}
async function load() {
  $('error').hidden = true; $('retry').hidden = true; $('reading').setAttribute('aria-busy', 'true');
  try {
    const response = await fetch(`/api/v1/book?lang=${lang}`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const { data } = await response.json();
    const intro = data.introduction;
    all = [{ id: 'introduction', day: copy.intro, day_index: 0, hour_heading: intro.title, commentary_title: intro.commentary_title, commentary_body: intro.commentary_body },
      ...data.days.flatMap((day, di) => day.hours.map((hour, hi) => ({ ...hour, id: `day-${di + 1}-hour-${hi + 1}`, day: day.day, day_index: di + 1 })))];
    all.forEach(entry => { entry.search = normalize(JSON.stringify(entry)); });
    $('day').replaceChildren(new Option(copy.allDays, ''), new Option(copy.intro, '0'), ...data.days.map((day, i) => new Option(day.day, String(i + 1))));
    const current = new URLSearchParams(location.search);
    $('day').value = current.get('day') || ''; $('search').value = current.get('q') || ''; active = current.get('entry') || '';
    filter();
  } catch {
    $('count').textContent = ''; $('error').textContent = copy.error; $('error').hidden = false; $('retry').hidden = false;
  } finally { $('reading').setAttribute('aria-busy', 'false'); }
}
let timer;
$('search').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(filter, 150); });
$('day').addEventListener('change', filter);
$('previous').addEventListener('click', () => select(filtered[filtered.findIndex(item => item.id === active) - 1]?.id, true));
$('next').addEventListener('click', () => select(filtered[filtered.findIndex(item => item.id === active) + 1]?.id, true));
for (const [id, delta] of [['smaller', -1], ['larger', 1]]) $(id).addEventListener('click', () => { size = Math.max(15, Math.min(28, size + delta)); document.documentElement.style.setProperty('--reader-size', size + 'px'); });
$('print').addEventListener('click', () => window.print());
$('retry').addEventListener('click', load);
load();

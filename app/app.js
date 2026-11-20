// Leonida Legend — GTA VI trophy guide and tracker.
// Static app: loads app/data/trophies.json from its own files, renders the
// checklist, roadmap, next-up planner and source matrix, and keeps earned
// trophies plus per-trophy notes in localStorage. Nothing is fetched from
// the network at run time.
const EARNED_KEY = 'leonida-legend-earned-v2';
const NOTES_KEY = 'leonida-legend-notes-v2';
const SPOILER_KEY = 'leonida-legend-spoiler-v2';

const KINDS = [
  ['all', 'All'], ['story', 'Story'], ['missable', 'Missable'],
  ['collectibles', 'Collectibles'], ['activities', 'Activities'],
  ['side', 'Side missions'], ['crime', 'Crime'], ['exploration', 'Exploration'],
  ['online', 'Online'],
];
const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', when: '60–80 hours · 12 trophies',
    blurb: 'Finish Chapters 1–4, the named missions and the finale. Meditate at Jason\u2019s house in Chapter 1, before the chapter ends.' },
  { n: 2, title: 'Stage 2 — Strangers & side missions', when: 'After the story · 6 trophies',
    blurb: 'Finish the stranger strands — Andy, Kenton, Billy, Randy and Tyrone — plus three more strands for Strangers & Freaks.' },
  { n: 3, title: 'Stage 3 — Activities & skills', when: '10 trophies',
    blurb: 'Stunts, Shooting Range golds, races, fishing, arcade, bowling and 50 Challenges.' },
  { n: 4, title: 'Stage 4 — Collectibles & exploration', when: '9 trophies',
    blurb: 'Meditation spots, cards, WAiNK scans, vehicles, the whole map — and the beachfront cocktail.' },
  { n: 5, title: 'Stage 5 — Crime, money & cleanup', when: '18 trophies',
    blurb: 'Vaults, trucks, shops, laundering and spending — then the 100% checklist and the platinum.' },
];

const params = new URLSearchParams(location.search);
const listEl = document.getElementById('trophyList');
const emptyEl = document.getElementById('empty');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoiler');
const hideEarnedEl = document.getElementById('hideEarned');

let trophies = [];
let earned = readSet(EARNED_KEY, params.get('earned'));
let notes = readNotes();
let kindFilter = KINDS.some(([k]) => k === params.get('kind')) ? params.get('kind') : 'all';
let openId = null;

function readSet(key, demo) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (Array.isArray(saved) && saved.length) return new Set(saved.map(String));
  } catch { /* corrupted save: start fresh */ }
  // ?earned=2,3,15 seeds a demo checklist only when nothing is saved.
  if (demo) return new Set(demo.split(',').map((s) => s.trim()).filter(Boolean));
  return new Set();
}

function readNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch { return {}; }
}

function saveEarned() { localStorage.setItem(EARNED_KEY, JSON.stringify([...earned])); }
function saveNotes() { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }

function spoilerOn() {
  if (params.get('spoiler') === 'off') return false;
  if (params.get('spoiler') === 'on') return true;
  const saved = localStorage.getItem(SPOILER_KEY);
  return saved === null ? true : saved === '1';
}

const isMasked = (t) => spoilerOn() && t.kind === 'story' && !earned.has(String(t.id));
const showName = (t) => (isMasked(t) ? 'Hidden story trophy — earn it to reveal' : t.name);
const showDesc = (t) => (isMasked(t) ? 'Hidden until earned. Turn spoiler-safe off to see it.' : t.description);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const isDone = (t) => earned.has(String(t.id));

function statusBadge(t) {
  if (t.status === 'unconfirmed') return 'Method not yet confirmed';
  if (t.status === 'reported') return 'Reported — check source';
  return null;
}

function renderAudit() {
  const confirmed = trophies.filter((t) => t.status === 'confirmed').length;
  const reported = trophies.filter((t) => t.status === 'reported').length;
  const unconfirmed = trophies.filter((t) => t.status === 'unconfirmed').length;
  const sourceNames = new Set();
  trophies.forEach((t) => (t.sources ?? []).forEach((s) => sourceNames.add(s.name)));
  const el = document.getElementById('auditStrip');
  el.innerHTML = '';
  el.append(
    document.createTextNode('Data checked 20 Nov 2026 · '),
    bold(`${confirmed} confirmed`),
    document.createTextNode(' · '),
    bold(`${reported} reported`),
    document.createTextNode(' · '),
    bold(`${unconfirmed} not yet confirmed`),
    document.createTextNode(` · ${sourceNames.size} named sources · works offline`),
  );
  function bold(text) { const b = document.createElement('b'); b.textContent = text; return b; }
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter(isDone).length;
  document.getElementById('progressText').textContent = `${done} of ${total} earned`;
  document.getElementById('barFill').style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
  const counts = document.getElementById('gradeCounts');
  counts.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const gTotal = trophies.filter((t) => t.grade === grade).length;
    const gDone = trophies.filter((t) => t.grade === grade && isDone(t)).length;
    const span = document.createElement('span');
    span.append(document.createTextNode(`${cap(grade)} `));
    const b = document.createElement('b');
    b.textContent = `${gDone}/${gTotal}`;
    span.append(b);
    counts.append(span);
  }
  document.getElementById('barNote').textContent =
    done === total && total
      ? 'Platinum earned — Vice Got a Price! is yours. Leonida Legend.'
      : 'Tick a trophy off and it is saved in this browser. Export it to keep a backup.';
}

function nextUp() {
  // Missable first, then roadmap order, skipping the platinum itself.
  const rest = trophies.filter((t) => !isDone(t) && t.id !== 1);
  const missable = rest.filter((t) => t.missable === 'possible');
  const ordered = [...missable, ...rest.filter((t) => t.missable !== 'possible')]
    .sort((a, b) => (missable.includes(a) ? -1 : missable.includes(b) ? 1 : 0) || a.stage - b.stage || a.id - b.id);
  return ordered.slice(0, 3);
}

function whyNow(t) {
  if (t.missable === 'possible') return 'Do this first — its first spot is only open in Chapter 1.';
  if (t.kind === 'story') return `Story — unlocks on its own in Stage ${t.stage}.`;
  if (t.status === 'unconfirmed') return 'No confirmed method yet — check back before spending time on it.';
  if (t.count) return `PSN target: ${t.count.toLocaleString()} — chip away at it while doing other stages.`;
  return `Stage ${t.stage} — ${cap(t.kind)}.`;
}

function renderPlanner() {
  const wrap = document.getElementById('nextList');
  wrap.replaceChildren();
  const upcoming = nextUp();
  if (!upcoming.length) {
    const li = document.createElement('li');
    li.textContent = 'Everything is earned — Vice Got a Price! is yours.';
    wrap.append(li);
    return;
  }
  upcoming.forEach((t, i) => {
    const li = document.createElement('li');
    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = String(i + 1);
    const body = document.createElement('span');
    const name = document.createElement('b');
    name.textContent = showName(t);
    const why = document.createElement('span');
    why.className = 'why';
    why.textContent = ` — ${whyNow(t)}`;
    body.append(name, why);
    const go = document.createElement('button');
    go.type = 'button';
    go.textContent = 'Open guide';
    go.addEventListener('click', () => {
      openId = t.id;
      kindFilter = 'all';
      searchEl.value = '';
      buildKindChips();
      renderTrophyList();
      document.getElementById(`trophy-${t.id}`)?.scrollIntoView({ block: 'start' });
    });
    li.append(rank, body, go);
    wrap.append(li);
  });
}

function buildKindChips() {
  const wrap = document.getElementById('kindChips');
  wrap.replaceChildren();
  for (const [kind, label] of KINDS) {
    const count = kind === 'all' ? trophies.length
      : kind === 'missable' ? trophies.filter((t) => t.missable === 'possible').length
      : kind === 'online' ? 0
      : trophies.filter((t) => t.kind === kind).length;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.setAttribute('aria-pressed', String(kind === kindFilter));
    chip.append(document.createTextNode(`${label} `));
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = `(${count})`;
    chip.append(n);
    chip.addEventListener('click', () => {
      kindFilter = kind;
      buildKindChips();
      renderTrophyList();
    });
    wrap.append(chip);
  }
}

function renderRoadmap() {
  const wrap = document.getElementById('stages');
  wrap.replaceChildren();
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.stage === stage.n);
    const done = members.filter(isDone).length;
    const card = document.createElement('article');
    card.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const when = document.createElement('p');
    when.className = 'when';
    when.textContent = `${stage.when} · ${done}/${members.length} earned`;
    const bar = document.createElement('div');
    bar.className = 'stage-bar';
    const fill = document.createElement('i');
    fill.style.width = members.length ? `${Math.round((done / members.length) * 100)}%` : '0%';
    bar.append(fill);
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    const ul = document.createElement('ul');
    for (const t of members) {
      const li = document.createElement('li');
      if (isDone(t)) li.className = 'earned';
      li.textContent = `${isDone(t) ? '✓ ' : ''}${showName(t)} (${cap(t.grade)})`;
      ul.append(li);
    }
    card.append(h, when, bar, blurb, ul);
    wrap.append(card);
  }
}

function matches(t) {
  if (kindFilter === 'missable' && t.missable !== 'possible') return false;
  if (kindFilter === 'online') return false; // the game has no online trophies
  if (kindFilter !== 'all' && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (hideEarnedEl.checked && isDone(t)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${(t.steps ?? []).join(' ')} ${t.kind}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderTrophyList() {
  const shown = trophies.filter(matches);
  document.getElementById('listCount').textContent = `Showing ${shown.length} of ${trophies.length}`;
  document.getElementById('listTitle').textContent =
    kindFilter === 'all' ? 'All 55 trophies' : `${KINDS.find(([k]) => k === kindFilter)?.[1] ?? ''} trophies`;
  emptyEl.hidden = shown.length !== 0;
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy' + (isDone(t) ? ' earned' : '') + (t.missable === 'possible' ? ' missable' : '');
    li.id = `trophy-${t.id}`;
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isDone(t);
    box.setAttribute('aria-label', `Mark ${showName(t)} earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(String(t.id));
      else earned.delete(String(t.id));
      saveEarned();
      renderAll();
    });
    const title = document.createElement('div');
    title.className = 'trophy-title';
    const h = document.createElement('h3');
    h.textContent = showName(t);
    if (t.count !== null && t.count !== undefined) {
      const c = document.createElement('span');
      c.className = 'count';
      c.textContent = (t.id === 52 || t.id === 53)
        ? ` — $${t.count.toLocaleString()}`
        : ` — ${t.count.toLocaleString()}`;
      h.append(c);
    }
    const desc = document.createElement('p');
    desc.className = 'desc' + (isMasked(t) ? ' spoiled' : '');
    desc.textContent = showDesc(t);
    title.append(h, desc);
    const badges = document.createElement('div');
    badges.className = 'badges';
    const grade = document.createElement('span');
    grade.className = `badge ${t.grade}`;
    grade.textContent = cap(t.grade);
    badges.append(grade);
    const kind = document.createElement('span');
    kind.className = 'badge kind';
    kind.textContent = KINDS.find(([k]) => k === t.kind)?.[1] ?? t.kind;
    badges.append(kind);
    if (t.hidden) {
      const hid = document.createElement('span');
      hid.className = 'badge hidden-flag';
      hid.textContent = 'Hidden on PS';
      badges.append(hid);
    }
    if (t.missable === 'possible') {
      const m = document.createElement('span');
      m.className = 'badge miss';
      m.textContent = 'Possibly missable';
      badges.append(m);
    }
    const status = statusBadge(t);
    if (status) {
      const s = document.createElement('span');
      s.className = 'badge ' + (t.status === 'unconfirmed' ? 'status-unconfirmed' : 'status-reported');
      s.textContent = status;
      badges.append(s);
    }
    head.append(box, title, badges);
    li.append(head);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-toggle';
    toggle.textContent = openId === t.id ? 'Hide the guide ▲' : 'Read the guide — steps & sources ▼';
    const guide = document.createElement('div');
    guide.className = 'guide';
    guide.hidden = openId !== t.id;
    const g = document.createElement('p');
    g.textContent = t.guide;
    guide.append(g);
    if (Array.isArray(t.steps) && t.steps.length) {
      const ol = document.createElement('ol');
      for (const step of t.steps) {
        const s = document.createElement('li');
        s.textContent = step;
        ol.append(s);
      }
      guide.append(ol);
    }
    if (t.count !== null && t.count !== undefined) {
      const target = document.createElement('p');
      target.className = 'target';
      target.textContent = (t.id === 52 || t.id === 53)
        ? `PSN target: $${t.count.toLocaleString()}`
        : `PSN target: ${t.count.toLocaleString()}`;
      guide.append(target);
    }
    const src = document.createElement('p');
    src.className = 'sources';
    const strong = document.createElement('strong');
    strong.textContent = 'Sources: ';
    src.append(strong);
    (t.sources ?? []).forEach((s, i) => {
      if (i) src.append(document.createTextNode(' · '));
      if (s.url) {
        const a = document.createElement('a');
        a.href = s.url;
        a.rel = 'noopener';
        a.textContent = s.name;
        src.append(a);
      } else {
        src.append(document.createTextNode(s.name));
      }
    });
    guide.append(src);
    const noteLabel = document.createElement('label');
    noteLabel.className = 'note-label';
    noteLabel.textContent = 'My note';
    const noteBox = document.createElement('textarea');
    noteBox.className = 'note-box';
    noteBox.rows = 2;
    noteBox.placeholder = 'Your own note — where you left off, a spot to revisit…';
    noteBox.value = notes[String(t.id)] ?? '';
    noteBox.addEventListener('input', () => {
      const v = noteBox.value.trim();
      if (v) notes[String(t.id)] = v;
      else delete notes[String(t.id)];
      saveNotes();
    });
    noteLabel.append(noteBox);
    guide.append(noteLabel);
    toggle.addEventListener('click', () => {
      openId = openId === t.id ? null : t.id;
      renderTrophyList();
      if (openId === t.id) document.getElementById(`trophy-${t.id}`)?.scrollIntoView({ block: 'nearest' });
    });
    li.append(toggle, guide);
    listEl.append(li);
  }
}

function renderMatrix() {
  // One row per source: which trophies cite it, and what it was used for.
  const roles = {
    'PSNProfiles — GTA 6 trophy list': 'Official list — names, descriptions, grades, PSN targets',
    'Exophase — GTA 6 trophy list': 'Official list — names, descriptions, grades',
    'PowerPyx — GTA 6 Trophy Guide & Roadmap': 'Roadmap, 100% checklist, missable warning',
    'KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap': 'Roadmap, counts, activity methods',
    'PlanetGTA6 — GTA 6 Trophies': 'Official list, visible vs hidden',
    'Sixshore — GTA 6 Trophy and Achievement List': 'Trophy list, counts, collectibles',
    'GTA Vice City Hub — GTA 6 Achievements': 'Achievement list, reported methods',
  };
  const counts = {};
  trophies.forEach((t) => (t.sources ?? []).forEach((s) => {
    counts[s.name] = (counts[s.name] ?? 0) + 1;
  }));
  const wrap = document.getElementById('matrixTable');
  wrap.replaceChildren();
  const table = document.createElement('table');
  const head = document.createElement('tr');
  for (const h of ['Source', 'Used for', 'Trophies citing it']) {
    const th = document.createElement('th');
    th.textContent = h;
    head.append(th);
  }
  table.append(head);
  for (const [name, role] of Object.entries(roles)) {
    const tr = document.createElement('tr');
    const a = document.createElement('td');
    const trophy = trophies.flatMap((t) => t.sources ?? []).find((s) => s.name === name);
    if (trophy?.url) {
      const link = document.createElement('a');
      link.href = trophy.url;
      link.rel = 'noopener';
      link.textContent = name;
      a.append(link);
    } else {
      a.textContent = name;
    }
    const b = document.createElement('td');
    b.textContent = role;
    const c = document.createElement('td');
    c.className = 'num';
    c.textContent = String(counts[name] ?? 0);
    tr.append(a, b, c);
    table.append(tr);
  }
  wrap.append(table);
}

function renderAll() {
  renderAudit();
  renderProgress();
  renderPlanner();
  renderRoadmap();
  renderTrophyList();
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    guide: 'Leonida Legend',
    exportedAt: new Date().toISOString(),
    earned: [...earned].map((id) => trophies.find((t) => String(t.id) === id)?.name ?? id),
    earnedIds: [...earned],
    notes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const items = Array.isArray(data) ? data : (data.earned ?? data.earnedIds ?? []);
    const next = new Set();
    for (const item of items) {
      const hit = trophies.find((t) => t.name === item || String(t.id) === String(item));
      if (hit) next.add(String(hit.id));
    }
    earned = next;
    if (data.notes && typeof data.notes === 'object') {
      notes = data.notes;
      saveNotes();
    }
    saveEarned();
    renderAll();
  } catch {
    alert('That file is not a trophy-progress export from this guide.');
  }
}

function applyDeepLinks() {
  spoilerEl.checked = spoilerOn();
  const open = params.get('open');
  if (open && trophies.some((t) => String(t.id) === open)) openId = Number(open);
  const view = params.get('view');
  if (view) {
    const target = { roadmap: 'roadmap', planner: 'planner', sources: 'sources', missables: 'missables' }[view];
    if (target) setTimeout(() => document.getElementById(target)?.scrollIntoView(), 60);
  }
  if (open) setTimeout(() => document.getElementById(`trophy-${open}`)?.scrollIntoView({ block: 'start' }), 80);
}

async function loadTrophyData() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error(`trophies.json: HTTP ${res.status}`);
  trophies = (await res.json()).trophies;
}

document.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-open]');
  if (!opener) return;
  event.preventDefault();
  openId = Number(opener.getAttribute('data-open'));
  kindFilter = 'all';
  searchEl.value = '';
  buildKindChips();
  renderTrophyList();
  document.getElementById(`trophy-${openId}`)?.scrollIntoView({ block: 'start' });
});
searchEl.addEventListener('input', renderTrophyList);
gradeEl.addEventListener('change', renderTrophyList);
hideEarnedEl.addEventListener('change', renderTrophyList);
spoilerEl.addEventListener('change', () => {
  localStorage.setItem(SPOILER_KEY, spoilerEl.checked ? '1' : '0');
  renderAll();
});
document.getElementById('export').addEventListener('click', exportProgress);
document.getElementById('import').addEventListener('change', (e) => importProgress(e.target.files[0]));
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned ticks and notes?')) return;
  earned = new Set();
  notes = {};
  saveEarned();
  saveNotes();
  renderAll();
});

await loadTrophyData();
buildKindChips();
applyDeepLinks();
renderAll();
renderMatrix();

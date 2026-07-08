/* ===================== Utils ===================== */
const fmt = (n) => (isFinite(n) ? n : 0).toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const round2 = (n) => Math.round(n * 100) / 100;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const LS_HIST = 'salaires_history_v1';
const LS_CATS = 'budget_categories_v1';
const LS_CUMUL = 'budget_cumul_v1';
const LS_OBJ = 'budget_objectif_v1';
const LS_DARK = 'dark_mode_v1';

function loadHist() { return JSON.parse(localStorage.getItem(LS_HIST) || '[]'); }
function saveHist(h) { localStorage.setItem(LS_HIST, JSON.stringify(h)); }

function loadCats() {
  const raw = localStorage.getItem(LS_CATS);
  if (raw) return JSON.parse(raw);
  return [
    { id: uid(), nom: 'Épargne', pct: 30 },
    { id: uid(), nom: 'Dépenses courantes', pct: 40 },
    { id: uid(), nom: 'Loisirs', pct: 15 },
    { id: uid(), nom: 'Imprévus', pct: 15 },
  ];
}
function saveCats(c) { localStorage.setItem(LS_CATS, JSON.stringify(c)); }

function loadCumul() { return JSON.parse(localStorage.getItem(LS_CUMUL) || '{}'); }
function saveCumul(c) { localStorage.setItem(LS_CUMUL, JSON.stringify(c)); }

function loadObj() { return JSON.parse(localStorage.getItem(LS_OBJ) || '{"montant":0,"categorie":""}'); }
function saveObj(o) { localStorage.setItem(LS_OBJ, JSON.stringify(o)); }

/* ===================== Tabs ===================== */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'hist') renderHist();
    if (btn.dataset.tab === 'totaux') renderTotaux();
    if (btn.dataset.tab === 'budget') renderBudget();
  });
});

/* ===================== Dark mode ===================== */
const darkToggle = document.getElementById('darkToggle');
function applyDark(on) {
  document.body.classList.toggle('dark', on);
  darkToggle.textContent = on ? '☀️' : '🌙';
}
applyDark(localStorage.getItem(LS_DARK) === '1');
darkToggle.addEventListener('click', () => {
  const on = !document.body.classList.contains('dark');
  applyDark(on);
  localStorage.setItem(LS_DARK, on ? '1' : '0');
});

/* ===================== Reminder (fiche de prestations avant lundi soir) ===================== */
(function reminder() {
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche, 1 = lundi
  const banner = document.getElementById('reminderBanner');
  // Rappel affiché du vendredi au lundi
  if (day === 5 || day === 6 || day === 0 || day === 1) {
    let msg = "📋 Rappel : envoie ta fiche de prestations à l'agence avant lundi soir.";
    if (day === 1) msg = "⏰ C'est aujourd'hui ! N'oublie pas d'envoyer ta fiche de prestations avant ce soir.";
    banner.textContent = msg;
    banner.classList.remove('hidden');
  }
})();

/* ===================== Calculatrice ===================== */
const ids = ['dateDebut','dateFin','statut',
  'tauxHoraire','majorationSupp','seuilNormal','tauxONSS','tauxPrecompte','indemniteJour','note'];
const el = {};
ids.forEach(id => el[id] = document.getElementById(id));

const JOURS_NOMS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function buildDayTable() {
  const body = document.getElementById('dayTableBody');
  body.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="day-name">${JOURS_NOMS[i]}</span></td>
      <td><input type="time" class="day-debut" data-i="${i}"></td>
      <td><input type="time" class="day-fin" data-i="${i}"></td>
      <td><input type="number" class="day-pause" data-i="${i}" min="0" step="5" value="0"></td>
      <td class="day-heures" data-i="${i}">0,00</td>
      <td class="day-supp-display" data-i="${i}">0,00</td>
      <td class="day-transport" data-i="${i}">—</td>
    `;
    body.appendChild(tr);
  }
  body.querySelectorAll('input').forEach(inp => inp.addEventListener('input', compute));
  updateDayLabels();
}

function updateDayLabels() {
  const debutVal = el.dateDebut.value;
  const monday = debutVal ? new Date(debutVal + 'T00:00:00') : null;
  document.querySelectorAll('#dayTableBody tr').forEach((tr, i) => {
    const nameCell = tr.querySelector('td');
    let dateSpan = nameCell.querySelector('.day-date');
    if (monday) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const label = d.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit' });
      if (!dateSpan) {
        dateSpan = document.createElement('span');
        dateSpan.className = 'day-date';
        nameCell.appendChild(dateSpan);
      }
      dateSpan.textContent = label;
    } else if (dateSpan) {
      dateSpan.remove();
    }
  });
}

function getDayRows() {
  const seuil = parseFloat(el.seuilNormal.value) || 0;
  const rows = [];
  document.querySelectorAll('#dayTableBody tr').forEach((tr, i) => {
    const debut = tr.querySelector('.day-debut').value;
    const fin = tr.querySelector('.day-fin').value;
    const pause = parseFloat(tr.querySelector('.day-pause').value) || 0;
    let heures = 0;
    if (debut && fin) {
      const dMin = timeToMinutes(debut);
      let fMin = timeToMinutes(fin);
      if (fMin <= dMin) fMin += 24 * 60; // passe minuit
      heures = Math.max(0, (fMin - dMin - pause) / 60);
    }
    const normales = round2(Math.min(heures, seuil));
    const supp = round2(Math.max(0, heures - seuil));
    rows.push({ i, debut, fin, pause, heures: round2(heures), normales, supp });
  });
  return rows;
}

el.dateDebut.addEventListener('input', updateDayLabels);

// Défauts spécifiques travailleur normal (indicatif, à ajuster)
el.statut.addEventListener('change', () => {
  if (el.statut.value === 'normal') {
    el.tauxONSS.value = 13.07;
    el.tauxPrecompte.value = 18;
  } else {
    el.tauxONSS.value = 2.71;
    el.tauxPrecompte.value = 0;
  }
  compute();
});

function compute() {
  const days = getDayRows();
  const taux = parseFloat(el.tauxHoraire.value) || 0;
  const majoration = (parseFloat(el.majorationSupp.value) || 0) / 100;
  const tauxONSS = (parseFloat(el.tauxONSS.value) || 0) / 100;
  const tauxPrecompte = (parseFloat(el.tauxPrecompte.value) || 0) / 100;
  const indemniteJour = parseFloat(el.indemniteJour.value) || 0;

  const heuresNormales = round2(days.reduce((s, d) => s + d.normales, 0));
  const heuresSupp = round2(days.reduce((s, d) => s + d.supp, 0));
  const jours = days.filter(d => (d.normales + d.supp) > 0).length;

  // Calcul jour par jour (comme sur la fiche de paie) : chaque heure travaillée payée au taux de
  // base, + majoration uniquement sur les heures supp de ce jour-là. On additionne ensuite chaque
  // jour pour limiter les erreurs d'arrondi/de saisie sur une semaine entière.
  let brut = 0;
  days.forEach(d => {
    const totalJour = d.normales + d.supp;
    brut += totalJour * taux + d.supp * taux * majoration;
  });
  brut = round2(brut);

  const onss = round2(brut * tauxONSS);
  const imposable = round2(brut - onss);
  const precompte = round2(imposable * tauxPrecompte);
  const net = round2(imposable - precompte);
  const indemnites = round2(jours * indemniteJour);
  const total = round2(net + indemnites);

  document.getElementById('rBrut').textContent = fmt(brut);
  document.getElementById('rOnss').textContent = '- ' + fmt(onss);
  document.getElementById('rImposable').textContent = fmt(imposable);
  document.getElementById('rPrecompte').textContent = '- ' + fmt(precompte);
  document.getElementById('rNet').textContent = fmt(net);
  document.getElementById('rIndemnites').textContent = '+ ' + fmt(indemnites);
  document.getElementById('rTotal').textContent = fmt(total);

  const heuresTotalesJour = round2(days.reduce((s, d) => s + d.heures, 0));
  document.getElementById('dayTotalHeures').textContent = heuresTotalesJour.toFixed(2);
  document.getElementById('dayTotalSupp').textContent = heuresSupp.toFixed(2);
  document.getElementById('dayTotalTransport').textContent = jours;
  document.getElementById('joursTravaillesAuto').value = jours;
  days.forEach(d => {
    const heuresCell = document.querySelector(`.day-heures[data-i="${d.i}"]`);
    if (heuresCell) heuresCell.textContent = d.heures.toFixed(2);
    const suppCell = document.querySelector(`.day-supp-display[data-i="${d.i}"]`);
    if (suppCell) {
      suppCell.textContent = d.supp.toFixed(2);
      suppCell.classList.toggle('has-supp', d.supp > 0);
    }
    const transportCell = document.querySelector(`.day-transport[data-i="${d.i}"]`);
    if (transportCell) transportCell.textContent = d.heures > 0 ? '✓' : '—';
  });

  const heuresTotales = round2(heuresNormales + heuresSupp);
  return { heuresNormales, heuresSupp, heuresTotales, brut, onss, imposable, precompte, net, indemnites, total, days, jours };
}

ids.forEach(id => {
  if (id === 'note' || id === 'dateDebut' || id === 'dateFin') return;
  el[id].addEventListener('input', compute);
});
buildDayTable();
compute();

document.getElementById('saveBtn').addEventListener('click', () => {
  const c = compute();
  if (c.jours === 0) {
    if (!confirm("Aucune heure saisie pour aucun jour. Enregistrer quand même ?")) return;
  }
  const hist = loadHist();
  hist.push({
    id: uid(),
    dateDebut: el.dateDebut.value,
    dateFin: el.dateFin.value,
    statut: el.statut.value,
    note: el.note.value,
    ...c,
    reparti: false,
    createdAt: new Date().toISOString(),
  });
  saveHist(hist);
  alert('Semaine enregistrée ✅');
  // Réinitialise les heures du jour pour la prochaine saisie, garde les paramètres/taux.
  document.querySelectorAll('#dayTableBody input[type="time"]').forEach(inp => inp.value = '');
  document.querySelectorAll('#dayTableBody input[type="number"]').forEach(inp => inp.value = 0);
  compute();
});

/* ===================== Historique ===================== */
function renderHist() {
  const hist = loadHist().slice().sort((a, b) => (a.dateDebut || '').localeCompare(b.dateDebut || ''));
  const body = document.getElementById('histBody');
  const empty = document.getElementById('histEmpty');
  body.innerHTML = '';
  empty.style.display = hist.length ? 'none' : 'block';

  hist.forEach(item => {
    const tr = document.createElement('tr');
    const periode = item.dateDebut ? `${item.dateDebut} → ${item.dateFin || ''}` : '(sans date)';
    tr.innerHTML = `
      <td>${periode}</td>
      <td>${item.jours}</td>
      <td>${item.heuresTotales?.toFixed(2) ?? ''}</td>
      <td>${fmt(item.brut)}</td>
      <td>${fmt(item.net)}</td>
      <td>${fmt(item.indemnites)}</td>
      <td><b>${fmt(item.total)}</b></td>
      <td>${item.reparti ? '✅' : '—'}</td>
      <td class="action-cell"><button title="Supprimer" data-id="${item.id}">🗑️</button></td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Supprimer cette semaine ?')) return;
      const h = loadHist().filter(x => x.id !== btn.dataset.id);
      saveHist(h);
      renderHist();
    });
  });
}

document.getElementById('exportJson').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(loadHist(), null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'salaires_export.json');
});

document.getElementById('exportCsv').addEventListener('click', () => {
  const hist = loadHist();
  const headers = ['dateDebut','dateFin','jours','heuresNormales','heuresSupp','brut','onss','imposable','precompte','net','indemnites','total','reparti','note'];
  const rows = hist.map(h => headers.map(k => h[k]).join(';'));
  const csv = [headers.join(';'), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, 'salaires_export.csv');
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

document.getElementById('importJson').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error('format invalide');
      const existing = loadHist();
      const merged = existing.concat(imported.filter(i => !existing.some(e => e.id === i.id)));
      saveHist(merged);
      renderHist();
      alert(`Import réussi : ${imported.length} entrée(s) traitée(s).`);
    } catch (err) {
      alert("Erreur d'import : fichier invalide.");
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

/* ===================== Totaux ===================== */
function renderTotaux() {
  const hist = loadHist().slice().sort((a, b) => (a.dateDebut || '').localeCompare(b.dateDebut || ''));
  const totalNet = hist.reduce((s, h) => s + (h.net || 0), 0);
  const totalBrut = hist.reduce((s, h) => s + (h.brut || 0), 0);
  const totalTout = hist.reduce((s, h) => s + (h.total || 0), 0);
  const moyenne = hist.length ? totalTout / hist.length : 0;

  document.getElementById('statTotalNet').textContent = fmt(totalNet);
  document.getElementById('statTotalBrut').textContent = fmt(totalBrut);
  document.getElementById('statMoyenne').textContent = fmt(moyenne);
  document.getElementById('statNbSemaines').textContent = hist.length;

  const now = new Date();
  const moisCourant = now.toISOString().slice(0, 7);
  const moisItems = hist.filter(h => (h.dateDebut || '').slice(0, 7) === moisCourant);
  const totalMois = moisItems.reduce((s, h) => s + (h.total || 0), 0);
  const heuresMois = moisItems.reduce((s, h) => s + (h.heuresTotales || 0), 0);
  document.getElementById('statMois').textContent = fmt(totalMois);
  document.getElementById('statHeuresMois').textContent = heuresMois.toFixed(2);

  drawChart(hist.slice(-12));
}

function drawChart(data) {
  const canvas = document.getElementById('chart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 600;
  const height = 180;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (!data.length) {
    ctx.fillStyle = '#999';
    ctx.fillText('Pas encore de données', 10, 20);
    return;
  }

  const max = Math.max(...data.map(d => d.total || 0), 1);
  const barW = width / data.length;
  const isDark = document.body.classList.contains('dark');

  data.forEach((d, i) => {
    const h = (d.total / max) * (height - 30);
    const x = i * barW + barW * 0.15;
    const y = height - h - 20;
    ctx.fillStyle = '#2f6fed';
    ctx.fillRect(x, y, barW * 0.7, h);
    ctx.fillStyle = isDark ? '#ccc' : '#555';
    ctx.font = '10px sans-serif';
    ctx.fillText((d.total || 0).toFixed(0) + '€', x, y - 4);
    const label = d.dateDebut ? d.dateDebut.slice(5) : '';
    ctx.fillText(label, x, height - 5);
  });
}

/* ===================== Budget & Épargne ===================== */
let categories = loadCats();

function renderCategories() {
  const box = document.getElementById('categoriesBox');
  box.innerHTML = '';
  categories.forEach(cat => {
    const row = document.createElement('div');
    row.className = 'cat-row';
    row.innerHTML = `
      <input type="text" value="${cat.nom}" data-id="${cat.id}" data-field="nom">
      <input type="number" value="${cat.pct}" min="0" max="100" data-id="${cat.id}" data-field="pct">
      <span>%</span>
      <button data-del="${cat.id}">🗑️</button>
    `;
    box.appendChild(row);
  });

  box.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => {
      const cat = categories.find(c => c.id === inp.dataset.id);
      if (!cat) return;
      if (inp.dataset.field === 'nom') cat.nom = inp.value;
      else cat.pct = parseFloat(inp.value) || 0;
      saveCats(categories);
      updateTotalPct();
      renderObjCategorieOptions();
    });
  });
  box.querySelectorAll('button[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      categories = categories.filter(c => c.id !== btn.dataset.del);
      saveCats(categories);
      renderCategories();
      updateTotalPct();
      renderObjCategorieOptions();
    });
  });
  updateTotalPct();
}

function updateTotalPct() {
  const total = categories.reduce((s, c) => s + (c.pct || 0), 0);
  const span = document.getElementById('totalPct');
  span.textContent = `Total: ${total}%`;
  span.style.color = total === 100 ? 'var(--green)' : 'var(--red)';
}

document.getElementById('addCatBtn').addEventListener('click', () => {
  categories.push({ id: uid(), nom: 'Nouvelle catégorie', pct: 0 });
  saveCats(categories);
  renderCategories();
  renderObjCategorieOptions();
});

function renderObjCategorieOptions() {
  const sel = document.getElementById('objCategorie');
  const current = sel.value;
  sel.innerHTML = categories.map(c => `<option value="${c.id}">${c.nom}</option>`).join('');
  if (categories.some(c => c.id === current)) sel.value = current;
}

function getDisponible() {
  return loadHist().filter(h => !h.reparti).reduce((s, h) => s + (h.total || 0), 0);
}

function renderBudget() {
  renderCategories();
  renderObjCategorieOptions();
  document.getElementById('dispoAmount').textContent = fmt(getDisponible());
  renderCumul();
  renderObjectif();
}

document.getElementById('repartirBtn').addEventListener('click', () => {
  const totalPct = categories.reduce((s, c) => s + (c.pct || 0), 0);
  if (totalPct !== 100) {
    if (!confirm(`Le total des pourcentages fait ${totalPct}% (pas 100%). Continuer quand même ?`)) return;
  }
  const dispo = getDisponible();
  if (dispo <= 0) { alert('Rien à répartir pour le moment.'); return; }

  const cumul = loadCumul();
  categories.forEach(cat => {
    const montant = round2(dispo * (cat.pct / 100));
    cumul[cat.id] = round2((cumul[cat.id] || 0) + montant);
  });
  saveCumul(cumul);

  const hist = loadHist().map(h => h.reparti ? h : { ...h, reparti: true });
  saveHist(hist);

  renderBudget();
  alert('Montant réparti dans les catégories ✅');
});

function renderCumul() {
  const cumul = loadCumul();
  const box = document.getElementById('cumulBox');
  box.innerHTML = categories.map(c => `
    <div class="stat">
      <span>${c.nom}</span>
      <b>${fmt(cumul[c.id] || 0)}</b>
    </div>
  `).join('') || '<p class="hint">Pas encore de catégories.</p>';
}

function renderObjectif() {
  const obj = loadObj();
  document.getElementById('objMontant').value = obj.montant || 0;
  if (obj.categorie) document.getElementById('objCategorie').value = obj.categorie;

  const cumul = loadCumul();
  const catId = document.getElementById('objCategorie').value;
  const actuel = cumul[catId] || 0;
  const montant = obj.montant || 0;
  const pct = montant > 0 ? Math.min(100, (actuel / montant) * 100) : 0;

  document.getElementById('objProgressFill').style.width = pct + '%';
  document.getElementById('objProgressText').textContent = `${fmt(actuel)} / ${fmt(montant)}`;

  const hist = loadHist();
  const nbSemaines = hist.length || 1;
  const moyenneParSemaine = (loadCumul()[catId] || 0) / nbSemaines;
  const estim = document.getElementById('objEstimation');
  if (montant > 0 && actuel < montant && moyenneParSemaine > 0) {
    const restant = montant - actuel;
    const semainesRestantes = Math.ceil(restant / moyenneParSemaine);
    estim.textContent = `À ce rythme (${fmt(moyenneParSemaine)}/semaine en moyenne), objectif atteint dans environ ${semainesRestantes} semaine(s).`;
  } else if (montant > 0 && actuel >= montant) {
    estim.textContent = '🎉 Objectif atteint !';
  } else {
    estim.textContent = '';
  }
}

document.getElementById('objMontant').addEventListener('input', () => {
  const obj = loadObj();
  obj.montant = parseFloat(document.getElementById('objMontant').value) || 0;
  saveObj(obj);
  renderObjectif();
});
document.getElementById('objCategorie').addEventListener('change', () => {
  const obj = loadObj();
  obj.categorie = document.getElementById('objCategorie').value;
  saveObj(obj);
  renderObjectif();
});

/* Init par défaut : dates de la semaine en cours */
(function initDates() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const toISO = (d) => d.toISOString().slice(0, 10);
  el.dateDebut.value = toISO(monday);
  el.dateFin.value = toISO(sunday);
  updateDayLabels();
})();

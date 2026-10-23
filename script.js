// কি পরবো – Ki Porbo | Vanilla JS wardrobe app
const CATS = {top:'Tops / Shirts / Kurtis',bottom:'Pants / Trousers / Skirts',orna:'Orna / Hijab',shoes:'Shoes',bags:'Bags',acc:'Accessories',other:'Other'};
const SLOTS = [['top','Top'],['bottom','Bottom'],['orna','Orna / Hijab']];
const NAV = [['home','🏠','Main Menu'],['closet','👗','My Closet'],['builder','✨','Outfit Builder'],['saved','💚','Saved Outfits']];
const SUBS = {home:'Welcome back! What would you like to do?',closet:'Everything you own, in one place.',builder:'Mix and match without opening the wardrobe.',saved:'Your favorite looks.'};
const PH = 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="#efe6d3"/><text x="150" y="205" font-size="14" fill="#8a8a7a" text-anchor="middle">No image</text></svg>');

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };

let items = read('kp_items'), outfits = read('kp_outfits');
let sel = {top:null,bottom:null,orna:null}, filter = 'all', query = '', view = 'home', photoData = null;
const byId = id => items.find(i => i.id === id);

function persist() {
  try {
    localStorage.setItem('kp_items', JSON.stringify(items));
    localStorage.setItem('kp_outfits', JSON.stringify(outfits));
    return true;
  } catch (e) {
    toast('Storage is full. Delete some items or use smaller photos.', true);
    return false;
  }
}
function toast(msg, err) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2600);
}
const img = (it, cls = 'thumb') => `<img class="${cls}" src="${it ? it.img : PH}" alt="${esc(it?.name)}" onerror="this.src='${PH}'">`;

// ---------- Navigation ----------
function go(v) { view = v; render(); window.scrollTo(0, 0); }
function renderNav() {
  const html = NAV.map(([k,i,l]) => `<button class="nav-btn ${view===k?'active':''}" data-go="${k}"><span>${i}</span>${l}</button>`).join('');
  $('#sideNav').innerHTML = html; $('#bottomNav').innerHTML = html;
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go);
});

// ---------- Views ----------
function renderHome() {
  const tiles = [['closet','My Closet',items.length+' pieces'],['builder','Outfit Builder','Mix & match'],['saved','Saved Outfits',outfits.length+' looks']];
  $('#view-home').innerHTML = `<div class="grid md:grid-cols-3 gap-5 max-w-4xl">` + tiles.map(([k,t,s],n) => {
    const pics = items.slice(n*2, n*2+2);
    return `<button class="tile" data-go="${k}">
      <h3 class="font-semibold text-2xl" style="text-shadow:0 3px 4px rgba(0,0,0,.2)">${t}</h3>
      <p class="text-sm mt-1 text-stone-700">${s}</p>
      ${pics.map((p,i)=>`<img class="tilt" style="right:${12+i*40}px;bottom:${-20+i*14}px;transform:rotate(${i?8:-8}deg)" src="${p.img}" alt="">`).join('')}
    </button>`;}).join('') + `</div>`;
}

function renderCloset() {
  const n = c => items.filter(i => i.cat === c).length;
  $('#stats').innerHTML = [['Total pieces',items.length],['Tops',n('top')],['Pants / bottoms',n('bottom')],['Orna / hijab',n('orna')]]
    .map(([l,v]) => `<div class="card p-4"><p class="font-serif text-3xl">${v}</p><p class="text-sm text-stone-600">${l}</p></div>`).join('');
  $('#chips').innerHTML = [['all','All items',items.length],...Object.entries(CATS).map(([k,l])=>[k,l,n(k)])]
    .map(([k,l,c]) => `<button class="chip ${filter===k?'active':''}" data-f="${k}">${l} (${c})</button>`).join('');
  const q = query.trim().toLowerCase();
  const list = items.filter(i => (filter==='all'||i.cat===filter) && (!q || [i.name,i.color,i.notes].join(' ').toLowerCase().includes(q)));
  if (!items.length) {
    $('#gallery').innerHTML = `<div class="col-span-full card p-10 text-center"><p class="font-serif text-2xl mb-2">Your closet is empty</p><p class="text-stone-600 mb-4">Add your first piece to get started.</p><button class="btn" data-add>+ Add first item</button></div>`;
  } else if (!list.length) {
    $('#gallery').innerHTML = `<p class="col-span-full text-stone-600">No items match. Try another search or filter.</p>`;
  } else {
    $('#gallery').innerHTML = list.map(i => `<article class="card p-3">${img(i)}
      <h4 class="font-medium mt-3 truncate">${esc(i.name)}</h4>
      <p class="text-xs text-stone-600">${CATS[i.cat]}${i.color?' · '+esc(i.color):''}</p>
      ${i.notes?`<p class="text-xs text-stone-500 mt-1 line-clamp-2">${esc(i.notes)}</p>`:''}
      <button class="text-xs text-red-700 mt-2" data-del="${i.id}">Delete</button></article>`).join('');
  }
}

function renderBuilder() {
  $('#preview').innerHTML = SLOTS.map(([k,l]) => {
    const it = byId(sel[k]);
    return `<div><div class="slot">${it?img(it,''):l}</div>
      <p class="text-xs mt-1 truncate text-center">${it?esc(it.name):'—'}</p>
      ${it?`<button class="text-xs text-red-700 block mx-auto" data-rm="${k}">Remove</button>`:''}</div>`;
  }).join('');
  $('#pickers').innerHTML = SLOTS.map(([k,l]) => {
    const list = items.filter(i => i.cat === k);
    return `<div><h3 class="font-serif text-xl mb-2">${l}</h3>` + (list.length
      ? `<div class="flex gap-3 overflow-x-auto pb-2">${list.map(i=>`<div class="pick ${sel[k]===i.id?'on':''}" data-pick="${k}:${i.id}">${img(i)}<p class="text-xs truncate text-center">${esc(i.name)}</p></div>`).join('')}</div>`
      : `<p class="text-sm text-stone-500">No items yet. <button class="underline" data-add>Add one</button></p>`) + `</div>`;
  }).join('');
}

function renderSaved() {
  if (!outfits.length) { $('#savedGrid').innerHTML = `<div class="col-span-full card p-10 text-center"><p class="font-serif text-2xl mb-2">No saved outfits</p><p class="text-stone-600 mb-4">Build a look and save it here.</p><button class="btn" data-go="builder">Open Outfit Builder</button></div>`; return; }
  $('#savedGrid').innerHTML = outfits.map(o => `<article class="card p-4">
    <h4 class="font-serif text-xl mb-3">${esc(o.name)}</h4>
    <div class="grid grid-cols-3 gap-2">${SLOTS.map(([k])=>{const it=byId(o.ids[k]);return `<div>${img(it)}<p class="text-xs mt-1 truncate text-center ${it?'':'text-stone-400'}">${it?esc(it.name):'Removed item'}</p></div>`}).join('')}</div>
    <div class="flex gap-2 mt-4"><button class="btn flex-1" data-load="${o.id}">Load</button><button class="btn btn-soft" data-delo="${o.id}">Delete</button></div></article>`).join('');
}

function render() {
  ['home','closet','builder','saved'].forEach(v => $('#view-'+v).hidden = v !== view);
  $('#pageTitle').textContent = NAV.find(n => n[0]===view)[2];
  $('#pageSub').textContent = SUBS[view];
  $('#addBtn').hidden = view==='builder'||view==='saved';
  renderNav();
  ({home:renderHome,closet:renderCloset,builder:renderBuilder,saved:renderSaved})[view]();
}

// ---------- Actions (event delegation) ----------
document.addEventListener('click', e => {
  const t = e.target.closest('[data-f],[data-del],[data-rm],[data-pick],[data-load],[data-delo],[data-add]'); if (!t) return;
  const d = t.dataset;
  if (d.f) { filter = d.f; render(); }
  else if ('add' in d) openModal();
  else if (d.del) {
    if (confirm('Delete this item permanently?')) { items = items.filter(i => i.id !== d.del); Object.keys(sel).forEach(k => sel[k]===d.del && (sel[k]=null)); persist(); render(); toast('Item deleted'); }
  } else if (d.rm) { sel[d.rm] = null; render(); }
  else if (d.pick) { const [k,id] = d.pick.split(':'); sel[k] = sel[k]===id ? null : id; render(); }
  else if (d.load) {
    const o = outfits.find(x => x.id === d.load);
    SLOTS.forEach(([k]) => sel[k] = byId(o.ids[k]) ? o.ids[k] : null);
    $('#outfitName').value = o.name; go('builder');
    if (SLOTS.some(([k]) => !sel[k])) toast('Some items in this outfit were deleted', true);
  } else if (d.delo) {
    if (confirm('Delete this saved outfit?')) { outfits = outfits.filter(o => o.id !== d.delo); persist(); render(); toast('Outfit deleted'); }
  }
});
$('#search').addEventListener('input', e => { query = e.target.value; renderCloset(); });
$('#clearOutfit').onclick = () => { sel = {top:null,bottom:null,orna:null}; $('#outfitName').value = ''; render(); };
$('#saveOutfit').onclick = () => {
  const name = $('#outfitName').value.trim();
  if (SLOTS.some(([k]) => !sel[k])) return toast('Pick a top, a bottom and an orna/hijab first', true);
  if (!name) return toast('Give your outfit a name', true);
  outfits.unshift({id:'o'+Date.now(), name, ids:{...sel}});
  if (!persist()) outfits.shift(); else toast('Outfit saved!');
};

// ---------- Add clothing modal ----------
$('#category').innerHTML = Object.entries(CATS).map(([k,l]) => `<option value="${k}">${l}</option>`).join('');
function openModal() { $('#addForm').reset(); photoData = null; $('#photoPreview').classList.add('hidden'); $('#dropText').hidden = false; $('#formErr').textContent = ''; $('#modal').hidden = false; }
function closeModal() { $('#modal').hidden = true; }
$('#addBtn').onclick = openModal;
$('#cancelAdd').onclick = closeModal;
$('#modal').addEventListener('click', e => e.target.id === 'modal' && closeModal());
document.addEventListener('keydown', e => e.key === 'Escape' && closeModal());

// Resize photo first so localStorage doesn't fill up quickly
function compress(file) {
  return new Promise((ok, no) => {
    const r = new FileReader(); r.onerror = no;
    r.onload = () => {
      const im = new Image(); im.onerror = no;
      im.onload = () => {
        const s = Math.min(1, 600 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = im.width * s; c.height = im.height * s;
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/jpeg', .75));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
$('#photo').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    photoData = await compress(f);
    $('#photoPreview').src = photoData; $('#photoPreview').classList.remove('hidden'); $('#dropText').hidden = true;
  } catch { $('#formErr').textContent = 'That file could not be read as an image.'; }
});
$('#addForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#name').value.trim();
  if (!photoData) return $('#formErr').textContent = 'Please choose a photo.';
  if (!name) return $('#formErr').textContent = 'Please enter an item name.';
  items.unshift({id:'i'+Date.now(), name, cat:$('#category').value, color:$('#color').value.trim(), notes:$('#notes').value.trim(), img:photoData});
  if (!persist()) { items.shift(); return; }
  closeModal(); toast('Item added to your closet'); view = 'closet'; filter = 'all'; render();
});

render();

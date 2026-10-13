// Biri Platformu - İstemci Mantığı

let allDistricts = [];
let allServices = [];
let allProviders = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialData();
  lucide.createIcons();
});

async function loadInitialData() {
  try {
    const [districtsRes, servicesRes, providersRes] = await Promise.all([
      fetch('/api/districts'),
      fetch('/api/services'),
      fetch('/api/providers')
    ]);

    allDistricts = await districtsRes.json();
    allServices = await servicesRes.json();
    allProviders = await providersRes.json();

    populateDistricts();
    populateServicesInModal();
    renderPriceTable('all');
    renderProviders(allProviders);
  } catch (err) {
    console.error('Veriler yüklenirken hata:', err);
  }
}

function populateDistricts() {
  const heroSelect = document.getElementById('heroDistrictSelect');
  const modalSelect = document.getElementById('modalDistrictSelect');

  heroSelect.innerHTML = '<option value="">Tüm İzmir & Çevresi</option>';
  modalSelect.innerHTML = '<option value="">İlçe Seçiniz...</option>';

  allDistricts.forEach(d => {
    const optHero = document.createElement('option');
    optHero.value = d.id;
    optHero.textContent = `${d.name} (${d.zone})`;
    heroSelect.appendChild(optHero);

    const optModal = document.createElement('option');
    optModal.value = d.id;
    optModal.textContent = `${d.name} (${d.zone})`;
    modalSelect.appendChild(optModal);
  });
}

function populateServicesInModal(selectedCategory = null) {
  const modalServiceSelect = document.getElementById('modalServiceSelect');
  modalServiceSelect.innerHTML = '<option value="">Hizmet Seçiniz...</option>';

  const filtered = selectedCategory 
    ? allServices.filter(s => s.category_id === selectedCategory) 
    : allServices;

  filtered.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `[${s.category_name}] ${s.name} (~${s.avg_price_min}₺ - ${s.avg_price_max}₺)`;
    modalServiceSelect.appendChild(opt);
  });
}

function renderPriceTable(categoryFilter = 'all') {
  const tbody = document.getElementById('priceTableBody');
  tbody.innerHTML = '';

  const filtered = categoryFilter === 'all' 
    ? allServices 
    : allServices.filter(s => s.category_id === categoryFilter);

  filtered.forEach(s => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';

    let catBadgeClass = 'bg-slate-100 text-slate-700';
    if (s.category_id === 'temizlik') catBadgeClass = 'bg-rolex-surface text-rolex border-rolex-border';
    if (s.category_id === 'tadilat') catBadgeClass = 'bg-orange-surface text-orange border-orange-border';
    if (s.category_id === 'nakliyat') catBadgeClass = 'bg-navy-50 text-navy-800 border-navy-100';
    if (s.category_id === 'tamir') catBadgeClass = 'bg-rolex-surface text-rolex border-rolex-border';

    tr.innerHTML = `
      <td class="py-4 px-6 font-semibold text-navy-950">${s.name}</td>
      <td class="py-4 px-6">
        <span class="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${catBadgeClass}">
          ${s.category_name}
        </span>
      </td>
      <td class="py-4 px-6 font-extrabold text-navy-900">
        ${s.avg_price_min.toLocaleString('tr-TR')} ₺ - ${s.avg_price_max.toLocaleString('tr-TR')} ₺
      </td>
      <td class="py-4 px-6 text-slate-500 font-medium">${s.price_unit}</td>
      <td class="py-4 px-6 text-right">
        <button onclick="openRequestModalForService(${s.id})" class="text-xs font-bold text-orange hover:text-white bg-orange-surface hover:bg-orange border border-orange-border px-3.5 py-1.5 rounded-xl transition shadow-sm">
          Biri'ni Çağır →
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterPriceTable(cat) {
  document.querySelectorAll('.price-tab-btn').forEach(b => {
    b.classList.remove('active', 'bg-rolex', 'text-white');
    b.classList.add('bg-white', 'text-slate-700');
  });
  event.target.classList.add('active', 'bg-rolex', 'text-white');
  event.target.classList.remove('bg-white', 'text-slate-700');
  renderPriceTable(cat);
}

function renderProviders(providers) {
  const grid = document.getElementById('providersGrid');
  grid.innerHTML = '';

  if (providers.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        Bu filtreye uygun onaylı usta bulunamadı.
      </div>
    `;
    return;
  }

  providers.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl border border-slate-200 p-5 shadow-sm card-hover flex flex-col justify-between';

    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4 class="font-bold text-navy-950 text-base">${p.name}</h4>
            <span class="text-xs text-slate-500 font-medium">${p.company_title || 'Bağımsız Usta'}</span>
          </div>
          <span class="inline-flex items-center gap-1 bg-rolex-surface text-rolex text-xs font-bold px-2 py-0.5 rounded-lg border border-rolex-border">
            ⭐ ${p.rating}
          </span>
        </div>

        <div class="space-y-1.5 mb-5 text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <span class="text-slate-400">📍 Bölge:</span>
            <span class="font-semibold text-navy-900">${p.district_name}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-400">💼 Kategori:</span>
            <span class="font-semibold text-navy-900">${p.category_name}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-400">✅ Başarılı İş:</span>
            <span class="font-semibold text-rolex">${p.completed_jobs}+ Tamamlandı</span>
          </div>
        </div>
      </div>

      <button onclick="openRequestModalForDistrictAndCategory(${p.district_id}, '${p.category_id}')" class="w-full bg-orange-surface hover:bg-orange hover:text-white text-orange font-bold border border-orange-border py-2.5 rounded-xl text-xs transition shadow-sm">
        Bu Ustadan Teklif İste →
      </button>
    `;
    grid.appendChild(card);
  });
}

function handleHeroSearch() {
  const districtId = document.getElementById('heroDistrictSelect').value;
  const category = document.getElementById('heroCategorySelect').value;

  let url = '/api/providers?';
  if (districtId) url += `district=${districtId}&`;
  if (category) url += `category=${category}&`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      renderProviders(data);
      const label = document.getElementById('activeFilterLabel');
      const dist = allDistricts.find(d => d.id == districtId);
      label.textContent = dist ? `${dist.name} (${category || 'Tümü'})` : `Tüm İzmir (${category || 'Tümü'})`;

      document.getElementById('ustalar').scrollIntoView({ behavior: 'smooth' });
    });
}

function selectQuickDistrict(districtName) {
  const dist = allDistricts.find(d => d.name === districtName || d.name.includes(districtName));
  if (dist) {
    document.getElementById('heroDistrictSelect').value = dist.id;
    handleHeroSearch();
  }
}

// Modal Yönetimi
function openRequestModal(category = null) {
  document.getElementById('serviceRequestForm').classList.remove('hidden');
  document.getElementById('modalSuccessBox').classList.add('hidden');
  populateServicesInModal(category);

  const modal = document.getElementById('requestModal');
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function openRequestModalForService(serviceId) {
  openRequestModal();
  setTimeout(() => {
    document.getElementById('modalServiceSelect').value = serviceId;
  }, 50);
}

function openRequestModalForDistrictAndCategory(districtId, category) {
  openRequestModal(category);
  setTimeout(() => {
    document.getElementById('modalDistrictSelect').value = districtId;
  }, 50);
}

function closeRequestModal() {
  document.getElementById('requestModal').classList.add('hidden');
}

async function handleRequestSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('submitRequestBtn');
  btn.disabled = true;
  btn.textContent = 'İletiliyor...';

  const payload = {
    district_id: parseInt(document.getElementById('modalDistrictSelect').value, 10),
    service_id: parseInt(document.getElementById('modalServiceSelect').value, 10),
    urgency: document.querySelector('input[name="urgency"]:checked')?.value || 'bu_hafta',
    customer_name: document.getElementById('modalCustomerName').value,
    customer_phone: document.getElementById('modalCustomerPhone').value,
    notes: document.getElementById('modalNotes').value
  };

  try {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      document.getElementById('serviceRequestForm').classList.add('hidden');
      document.getElementById('modalSuccessBox').classList.remove('hidden');
      document.getElementById('modalSuccessMessage').textContent = result.message;
      document.getElementById('serviceRequestForm').reset();
    } else {
      alert(result.error || 'Talep iletilemedi.');
    }
  } catch (err) {
    alert('Sunucu bağlantı hatası: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i><span>Talebimi Biri\'ne İlet</span>';
    lucide.createIcons();
  }
}

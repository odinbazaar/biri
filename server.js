import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'biri.sqlite');

// 1. Veritabanı Başlatma (node:sqlite)
const db = new DatabaseSync(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS districts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    zone TEXT NOT NULL,
    is_popular INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    avg_price_min INTEGER NOT NULL,
    avg_price_max INTEGER NOT NULL,
    price_unit TEXT NOT NULL,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company_title TEXT,
    category_id TEXT NOT NULL,
    district_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    rating REAL NOT NULL,
    review_count INTEGER NOT NULL,
    completed_jobs INTEGER NOT NULL,
    verified INTEGER DEFAULT 1,
    FOREIGN KEY(category_id) REFERENCES categories(id),
    FOREIGN KEY(district_id) REFERENCES districts(id)
  );

  CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    district_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    urgency TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'beklemede',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(service_id) REFERENCES services(id),
    FOREIGN KEY(district_id) REFERENCES districts(id)
  );
`);

// 2. Başlangıç Verilerini Ekle (Seed Data)
const districtCount = db.prepare('SELECT COUNT(*) as count FROM districts').get().count;
if (districtCount === 0) {
  const insertDistrict = db.prepare('INSERT INTO districts (name, zone, is_popular) VALUES (?, ?, ?)');
  const districts = [
    // Metropol
    ['Karşıyaka', 'Metropol', 1],
    ['Bornova', 'Metropol', 1],
    ['Konak (Alsancak / Göztepe)', 'Metropol', 1],
    ['Buca', 'Metropol', 1],
    ['Çiğli (Mavişehir)', 'Metropol', 1],
    ['Bayraklı', 'Metropol', 1],
    ['Balçova', 'Metropol', 0],
    ['Narlıdere', 'Metropol', 0],
    ['Güzelbahçe', 'Metropol', 0],
    ['Gaziemir', 'Metropol', 0],
    ['Karabağlar', 'Metropol', 0],
    // Sayfiye & Kıyı
    ['Çeşme & Alaçatı', 'Sayfiye', 1],
    ['Urla', 'Sayfiye', 1],
    ['Seferihisar & Sığacık', 'Sayfiye', 1],
    ['Foça', 'Sayfiye', 0],
    ['Karaburun', 'Sayfiye', 0],
    ['Dikili', 'Sayfiye', 0],
    // Gelişen Çevre
    ['Torbalı', 'Çevre', 0],
    ['Menemen', 'Çevre', 0],
    ['Kemalpaşa', 'Çevre', 0],
    ['Menderes', 'Çevre', 0],
    ['Aliağa', 'Çevre', 0],
    ['Ödemiş', 'Çevre', 0],
    ['Tire', 'Çevre', 0],
    // Yakın Çevre İller
    ['Manisa (Merkez)', 'Çevre İl', 0],
    ['Kuşadası (Aydın)', 'Çevre İl', 0]
  ];
  for (const d of districts) insertDistrict.run(...d);

  // Kategoriler: SADECE 4 TEMEL SEKTÖR (Özel ders ve organizasyon YOK)
  const insertCategory = db.prepare('INSERT INTO categories (id, name, icon, description, color) VALUES (?, ?, ?, ?, ?)');
  const categories = [
    ['temizlik', 'Temizlik', 'sparkles', 'Ev, ofis, boş ev taşınma, koltuk ve villa temizliği', 'emerald'],
    ['tadilat', 'Tadilat & Dekorasyon', 'hammer', 'Boya badana, banyo-mutfak yenileme, parke ve alçıpan', 'amber'],
    ['nakliyat', 'Nakliyat & Taşıma', 'truck', 'Evden eve nakliye, parça eşya, asansörlü taşıma', 'blue'],
    ['tamir', 'Tamir & Usta', 'wrench', 'Klima montaj & bakım, sıhhi tesisat, elektrik ve beyaz eşya', 'rose']
  ];
  for (const c of categories) insertCategory.run(...c);

  // Alt Hizmetler ve İzmir Ortalama Fiyat Aralıkları
  const insertService = db.prepare('INSERT INTO services (category_id, name, slug, avg_price_min, avg_price_max, price_unit) VALUES (?, ?, ?, ?, ?, ?)');
  const services = [
    // Temizlik
    ['temizlik', 'Standart Ev Temizliği (Günlük)', 'ev-temizligi', 1200, 2200, 'günlük'],
    ['temizlik', 'Boş Ev / Taşınma Öncesi Temizlik', 'bos-ev-temizligi', 2500, 4500, 'hizmet'],
    ['temizlik', 'Koltuk & Yatak Yıkama', 'koltuk-yikama', 800, 1800, 'adet'],
    ['temizlik', 'İnşaat / Tadilat Sonrası Temizlik', 'insaat-sonrasi-temizlik', 3000, 6000, 'hizmet'],
    ['temizlik', 'Villa / Yazlık Temizliği (Urla / Çeşme)', 'villa-temizligi', 3500, 7500, 'hizmet'],
    // Tadilat
    ['tadilat', 'Boya & Badana (3+1 Daire)', 'boya-badana', 9000, 18000, 'daire'],
    ['tadilat', 'Banyo Komple Yenileme & Fayans', 'banyo-tadilati', 25000, 65000, 'komple'],
    ['tadilat', 'Mutfak Dolabı & Tezgah Yenileme', 'mutfak-tadilati', 35000, 95000, 'komple'],
    ['tadilat', 'Laminat Parke Döşeme', 'parke-doseme', 120, 250, 'm²'],
    ['tadilat', 'Alçıpan & Asma Tavan', 'alcipan', 350, 750, 'm²'],
    // Nakliyat
    ['nakliyat', 'İzmir İçi Evden Eve Nakliyat', 'evden-eve-izmir', 7500, 16000, 'sefer'],
    ['nakliyat', 'Asansörlü Eşya Taşıma', 'asansorlu-nakliyat', 2500, 4500, 'sefer'],
    ['nakliyat', 'Şehirler Arası Nakliyat (İzmir Çıkışlı)', 'sehirler-arasi-nakliyat', 18000, 45000, 'sefer'],
    ['nakliyat', 'Parça Eşya & Küçük Kamyonet', 'parca-esya', 1500, 3500, 'sefer'],
    // Tamir
    ['tamir', 'Klima Montaj & Gaz Dolumu (İzmir Özel)', 'klima-servisi', 1200, 2800, 'cihaz'],
    ['tamir', 'Sıhhi Tesisat & Su Kaçağı Tespiti', 'su-tesisati', 800, 2200, 'işlem'],
    ['tamir', 'Elektrik Tesisatı & Pano Arıza', 'elektrik-tesisati', 600, 1800, 'işlem'],
    ['tamir', 'Beyaz Eşya Servisi & Kart Tamiri', 'beyaz-esya-tamir', 750, 2500, 'cihaz'],
    ['tamir', '7/24 Acil Çilingir & Kilit Değişimi', 'cilingir', 500, 1400, 'kilit']
  ];
  for (const s of services) insertService.run(...s);

  // İzmir Bölgesi Onaylı Ustalar (Örnek Sağlayıcılar)
  const insertProvider = db.prepare('INSERT INTO providers (name, company_title, category_id, district_id, phone, rating, review_count, completed_jobs, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const providers = [
    ['Mehmet Usta', 'Ege Boya & Dekorasyon', 'tadilat', 1, '0532 555 10 20', 4.95, 142, 280, 1], // Karşıyaka
    ['Ayşe Hanım ve Ekibi', 'İzmir Pırıl Temizlik', 'temizlik', 2, '0544 321 40 50', 4.92, 189, 410, 1], // Bornova
    ['Kemal Taşımacılık', 'Kordon Evden Eve Nakliyat', 'nakliyat', 3, '0505 888 77 66', 4.88, 98, 315, 1], // Konak
    ['Volkan Teknik', 'İzmir Soğutma & Klima', 'tamir', 5, '0530 111 22 33', 4.97, 215, 540, 1], // Çiğli
    ['Cem Usta', 'Çeşme & Urla Villa Tadilat', 'tadilat', 12, '0533 999 88 77', 4.94, 76, 160, 1], // Çeşme
    ['Hüseyin Usta', 'Buca Tesisat & Su Kaçağı', 'tamir', 4, '0542 444 33 22', 4.89, 112, 290, 1], // Buca
    ['Gözde Temizlik', 'Urla & Güzelbahçe Hizmet', 'temizlik', 13, '0535 777 66 55', 4.96, 88, 195, 1], // Urla
    ['Egejet Nakliyat', 'Asansörlü Ege Taşımacılık', 'nakliyat', 6, '0555 222 33 44', 4.90, 134, 340, 1]  // Bayraklı
  ];
  for (const p of providers) insertProvider.run(...p);
}

// 3. HTTP Sunucusu & API Yönlendirmeleri
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS başlıkları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: İlçeler
  if (pathname === '/api/districts' && req.method === 'GET') {
    const rows = db.prepare('SELECT * FROM districts ORDER BY is_popular DESC, name ASC').all();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(rows));
    return;
  }

  // API: Kategoriler
  if (pathname === '/api/categories' && req.method === 'GET') {
    const rows = db.prepare('SELECT * FROM categories').all();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(rows));
    return;
  }

  // API: Alt Hizmetler
  if (pathname === '/api/services' && req.method === 'GET') {
    const category = parsedUrl.searchParams.get('category');
    let query = 'SELECT s.*, c.name as category_name FROM services s JOIN categories c ON s.category_id = c.id';
    let params = [];
    if (category) {
      query += ' WHERE s.category_id = ?';
      params.push(category);
    }
    query += ' ORDER BY s.name ASC';
    const rows = db.prepare(query).all(...params);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(rows));
    return;
  }

  // API: Ustalar / Hizmet Verenler
  if (pathname === '/api/providers' && req.method === 'GET') {
    const category = parsedUrl.searchParams.get('category');
    const districtId = parsedUrl.searchParams.get('district');
    let query = `
      SELECT p.*, d.name as district_name, c.name as category_name 
      FROM providers p 
      JOIN districts d ON p.district_id = d.id 
      JOIN categories c ON p.category_id = c.id
    `;
    let conditions = [];
    let params = [];
    if (category) {
      conditions.push('p.category_id = ?');
      params.push(category);
    }
    if (districtId) {
      conditions.push('p.district_id = ?');
      params.push(districtId);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY p.rating DESC, p.completed_jobs DESC';
    const rows = db.prepare(query).all(...params);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(rows));
    return;
  }

  // API: Yeni Talep Oluştur (POST /api/requests)
  if (pathname === '/api/requests' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.service_id || !data.district_id || !data.customer_name || !data.customer_phone) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Eksik alanlar var. İsim, telefon, ilçe ve hizmet zorunludur.' }));
          return;
        }

        const stmt = db.prepare(`
          INSERT INTO service_requests (service_id, district_id, customer_name, customer_phone, urgency, notes) 
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          data.service_id,
          data.district_id,
          data.customer_name,
          data.customer_phone,
          data.urgency || 'normal',
          data.notes || ''
        );

        // İlgili bölgedeki eşleşen usta sayısını bul
        const service = db.prepare('SELECT category_id, name FROM services WHERE id = ?').get(data.service_id);
        const district = db.prepare('SELECT name FROM districts WHERE id = ?').get(data.district_id);
        const matchedUstalar = db.prepare('SELECT COUNT(*) as count FROM providers WHERE category_id = ?').get(service.category_id).count;

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          request_id: Number(result.lastInsertRowid),
          service_name: service.name,
          district_name: district.name,
          matched_providers_count: matchedUstalar,
          message: `Talebiniz alındı! ${district.name} bölgesindeki ${matchedUstalar} onaylı 'Biri' ustasına iletildi.`
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Talep kaydedilirken hata oluştu: ' + err.message }));
      }
    });
    return;
  }

  // API: İstatistikler
  if (pathname === '/api/stats' && req.method === 'GET') {
    const stats = {
      city: 'İzmir ve Çevresi',
      districts_covered: db.prepare('SELECT COUNT(*) as count FROM districts').get().count,
      active_providers: db.prepare('SELECT COUNT(*) as count FROM providers').get().count,
      total_completed_jobs: db.prepare('SELECT SUM(completed_jobs) as total FROM providers').get().total || 2500,
      avg_rating: 4.93,
      avg_response_time_minutes: 12
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
    return;
  }

  // Statik Dosyalar (public/)
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Sayfa Bulunamadı - Biri Platformu');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Sunucu Hatası: ' + err.message);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 BİRİ Platformu Yayında!`);
  console.log(`📍 Kapsam: İzmir ve Çevresi (Özel Ders & Org. Harici)`);
  console.log(`🌐 Adres: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

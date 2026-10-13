# Biri — İzmir ve Çevresi Hizmet Platformu

> **"İzmir'de aradığın hizmeti Biri yapar."**

**Biri**, İzmir ve çevre ilçelerine (Karşıyaka, Bornova, Konak, Alsancak, Çeşme, Urla, Seferihisar, Torbalı vb.) özel olarak tasarlanmış yeni nesil usta ve hizmet platformudur.

---

## 🎯 Temel İlkeler ve Tasarım Kararları

1. **Özel Ders ve Organizasyon Çıkarıldı:**
   * Platform sadece ev, iş yeri ve mekan ihtiyaçlarına (fiziki usta ve hizmet işlerine) odaklanmıştır.
   * Eğitim veya etkinlik gibi alakasız kategorilerle karmaşa yaratılmaz.

2. **4 Temel Hizmet Sektörü:**
   * 🧼 **Temizlik:** Ev, ofis, boş ev/taşınma, koltuk yıkama, Urla/Çeşme yazlık ve villa temizliği.
   * 🔨 **Tadilat & Dekorasyon:** Boya badana, banyo & mutfak yenileme, parke döşeme, alçıpan.
   * 🚚 **Nakliyat & Taşıma:** İzmir içi evden eve, modüler asansörlü taşıma, şehirler arası.
   * 🔧 **Tamir & Usta:** İzmir klima montaj & gaz dolumu, kameralı su kaçağı tespiti, elektrik arıza, 7/24 çilingir.

3. **Bölgesel Odak (İzmir & Çevresi):**
   * Metropol ilçeler: Karşıyaka, Bornova, Konak (Alsancak/Göztepe), Buca, Çiğli (Mavişehir), Bayraklı vb.
   * Sayfiye ve Kıyı: Çeşme, Alaçatı, Urla, Seferihisar, Sığacık, Foça, Dikili.
   * Sanayi ve Çevre: Torbalı, Menemen, Kemalpaşa, Aliağa.
   * Komşu Bölgeler: Manisa Merkez, Kuşadası (Aydın).

4. **Şeffaf İzmir Fiyat Rehberi:**
   * İzmir piyasasındaki gerçekçi usta ve malzeme maliyet aralıkları şeffaf bir şekilde listelenir.

---

## 🚀 Çalıştırma

Uygulama hiçbir dış derleme bağımlılığı olmadan, Node.js 24'ün yerleşik `node:sqlite` ve `node:http` motorları üzerinde çalışır.

```bash
cd C:\projeler\biri
node server.js
```

Tarayıcınızda açın:
👉 **http://localhost:3000**

---

## 📡 REST API Uç Noktaları

* `GET /api/districts` - İzmir ve çevre ilçe listesi (Bölge ve popülerlik bilgisiyle)
* `GET /api/categories` - 4 temel hizmet kategorisi
* `GET /api/services?category=<slug>` - Ortalama fiyat aralıklarıyla alt hizmetler
* `GET /api/providers?district=<id>&category=<slug>` - Onaylı usta ve firmalar
* `POST /api/requests` - Yeni müşteri talep oluşturma
* `GET /api/stats` - İzmir geneli platform metrikleri

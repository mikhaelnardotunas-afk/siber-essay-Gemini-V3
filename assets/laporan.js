/* =========================================================
   Pembuat laporan PDF (dicetak lewat browser → Simpan sebagai PDF)
   ========================================================= */
(function () {
  'use strict';
  var esc = function (s) { return window.UE.esc(s); };
  var rich = function (s) { return window.UE.rich(s); };
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function tglIndo(iso) {
    var d = iso ? new Date(iso + 'T00:00:00') : new Date();
    return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }
  function waktu(ms) {
    if (!ms) return '-';
    var d = new Date(ms);
    return d.getDate() + ' ' + BULAN[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear() + ', ' +
      ('0' + d.getHours()).slice(-2) + '.' + ('0' + d.getMinutes()).slice(-2);
  }
  function angka(v) { return v == null || v === '' ? '-' : String(Math.round(v * 10) / 10).replace('.', ','); }
  function rata(arr) { return arr.length ? arr.reduce(function (a, b) { return a + b; }, 0) / arr.length : null; }
  function ket(nilai, kkm) { return nilai == null ? '' : (nilai >= kkm ? 'Tuntas' : 'Belum tuntas'); }

  var CSS = [
    '@page{size:A4 portrait;margin:14mm 14mm 16mm}',
    '*{box-sizing:border-box}',
    'body{font-family:"Times New Roman",Georgia,serif;font-size:11.5pt;color:#000;margin:0;line-height:1.4;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    '.wrap{max-width:190mm;margin:0 auto;padding:10mm 0}',
    '.kop{display:flex;align-items:center;gap:14px;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:14px}',
    '.kop img{width:58px;height:58px}',
    '.kop .t{flex:1;text-align:center}',
    '.kop .s{font-size:15pt;font-weight:bold;letter-spacing:.5px}',
    '.kop .j{font-size:13pt;font-weight:bold;margin-top:2px}',
    '.kop .x{font-size:10.5pt}',
    'table{width:100%;border-collapse:collapse;margin:8px 0 12px}',
    'th,td{border:1px solid #000;padding:4px 6px;vertical-align:top;text-align:left}',
    'th{background:#e9e9e9;text-align:center;font-weight:bold}',
    'td.c{text-align:center}td.r{text-align:right}',
    'table.info td{border:none;padding:2px 6px}table.info td:first-child{width:150px}',
    'tr{break-inside:avoid}',
    '.ringkas{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 12px}',
    '.ringkas div{border:1px solid #000;padding:6px;text-align:center}',
    '.ringkas b{display:block;font-size:15pt}',
    '.bar{display:inline-block;height:10px;background:#555;vertical-align:middle}',
    '.belum{color:#b00000;font-weight:bold}.tuntas{color:#006400;font-weight:bold}',
    '.soal{margin:4px 0}.box{border:1px solid #999;padding:6px 8px;margin:3px 0 8px;min-height:24px}',
    '.lbl{font-size:9.5pt;font-weight:bold;text-transform:none;color:#333}',
    '.essay{border:1px solid #000;padding:8px;margin:8px 0;break-inside:avoid}',
    '.ttd{display:flex;justify-content:space-between;margin-top:24px;break-inside:avoid}',
    '.ttd div{width:45%;text-align:center}.ttd .nm{margin-top:62px;font-weight:bold;text-decoration:underline}',
    '.halaman{break-before:page}',
    '.kecil{font-size:9.5pt;color:#333}',
    '.legend td{border:none;padding:1px 6px;font-size:10pt}',
    'mjx-container{font-size:100%!important}',
    '.alat{position:sticky;top:0;background:#2e8fd8;color:#fff;padding:10px 14px;display:flex;gap:10px;align-items:center;font-family:sans-serif;z-index:5}',
    '.alat button{font:bold 15px sans-serif;padding:10px 18px;border-radius:10px;border:0;cursor:pointer;background:#ffcb2b;color:#3a2310}',
    '.alat span{flex:1;font-size:13px}',
    '@media print{.alat{display:none}.wrap{padding:0;max-width:none}}',
    '@media screen{body{background:#ddd}.wrap{background:#fff;padding:12mm;margin:12px auto;box-shadow:0 2px 10px rgba(0,0,0,.2)}}'
  ].join('\n');

  function kop(o, data, judul, sub) {
    var s = data.setting || {};
    var logo = s.LOGO_URL || new URL('assets/icon-192.png', location.href).href;
    return '<div class="kop"><img src="' + logo + '" alt=""><div class="t"><div class="s">' + esc(s.NAMA_SEKOLAH || '') + '</div>' +
      '<div class="j">' + esc(judul) + '</div><div class="x">' + esc(sub || '') + (o.tp ? ' · Tahun Pelajaran ' + esc(o.tp) : '') + '</div></div>' +
      '<img src="' + logo + '" alt="" style="visibility:hidden"></div>';
  }
  function ttd(o, hanyaGuru) {
    if (!o.ttd) return '';
    var guru = '<div>' + (hanyaGuru ? esc(o.kota || '') + ', ' + tglIndo(o.tanggal) + '<br>' : '<br>') + 'Guru Mata Pelajaran<div class="nm">' + esc(o.guru || '') + '</div>NIP. ' + esc(o.nipGuru || '-') + '</div>';
    var kepsek = '<div>Mengetahui,<br>Kepala Sekolah<div class="nm">' + esc(o.kepsek || '') + '</div>NIP. ' + esc(o.nipKepsek || '-') + '</div>';
    if (hanyaGuru) return '<div class="ttd"><div></div>' + guru + '</div>';
    return '<p style="text-align:right;margin:18px 0 0">' + esc(o.kota || '') + ', ' + tglIndo(o.tanggal) + '</p><div class="ttd">' + kepsek + guru + '</div>';
  }
  function urutkan(rows, cara) {
    return rows.sort(function (a, b) {
      if (cara === 'nilai') return (b.nilai == null ? -1 : b.nilai) - (a.nilai == null ? -1 : a.nilai) || a.n.localeCompare(b.n);
      if (cara === 'nama') return a.n.localeCompare(b.n);
      return a.k.localeCompare(b.k) || a.n.localeCompare(b.n);
    });
  }

  /* ---------- 1. Rekap satu ujian ---------- */
  function rekap(o, d) {
    var p = d.paket, hmap = {};
    d.hasil.forEach(function (h) { hmap[h.u] = h; });
    var rows = d.users.map(function (u) { var h = hmap[u.u]; return { n: u.n, u: u.u, k: u.k, h: h, nilai: h ? h.nilai : null }; });
    if (!o.belum) rows = rows.filter(function (r) { return r.h; });
    urutkan(rows, o.urut);
    var nilai = rows.filter(function (r) { return r.nilai != null; }).map(function (r) { return r.nilai; });
    var tuntas = nilai.filter(function (v) { return v >= o.kkm; }).length;
    var peserta = rows.filter(function (r) { return r.h; }).length;
    var kelasTeks = o.kelas || p.kelas.join(', ');

    var html = kop(o, d, 'REKAP NILAI ' + p.nama.toUpperCase(), p.mapel + ' · Kelas ' + kelasTeks) +
      '<table class="info"><tr><td>Mata pelajaran</td><td>: ' + esc(p.mapel) + '</td><td>Jumlah soal</td><td>: ' +
      [d.jumlahPG ? d.jumlahPG + ' PG' : '', d.jumlahES ? d.jumlahES + ' essay' : ''].filter(String).join(' + ') + '</td></tr>' +
      '<tr><td>Kelas</td><td>: ' + esc(kelasTeks) + '</td><td>KKM</td><td>: ' + o.kkm + '</td></tr></table>' +
      '<div class="ringkas"><div>Peserta<b>' + peserta + ' / ' + d.users.length + '</b></div><div>Rata-rata<b>' + angka(rata(nilai)) + '</b></div>' +
      '<div>Tertinggi / Terendah<b>' + (nilai.length ? angka(Math.max.apply(null, nilai)) + ' / ' + angka(Math.min.apply(null, nilai)) : '-') + '</b></div>' +
      '<div>Tuntas<b>' + tuntas + (nilai.length ? ' (' + Math.round(tuntas / nilai.length * 100) + '%)' : '') + '</b></div></div>';

    html += '<table><thead><tr><th style="width:34px">No</th>' + (o.urut === 'nilai' ? '<th style="width:44px">Rank</th>' : '') +
      '<th>Nama siswa</th><th style="width:70px">Kelas</th>' + (d.jumlahPG ? '<th style="width:56px">PG</th>' : '') + (d.jumlahES ? '<th style="width:56px">Essay</th>' : '') +
      '<th style="width:60px">Nilai</th><th style="width:105px">Keterangan</th><th style="width:60px">Keluar app</th></tr></thead><tbody>';
    var rank = 0;
    rows.forEach(function (r, i) {
      var h = r.h, k;
      if (!h) k = '<span class="belum">Tidak ikut</span>';
      else if (r.nilai == null) k = 'Menunggu nilai';
      else k = r.nilai >= o.kkm ? '<span class="tuntas">Tuntas</span>' : '<span class="belum">Belum tuntas</span>';
      if (r.nilai != null) rank++;
      html += '<tr><td class="c">' + (i + 1) + '</td>' + (o.urut === 'nilai' ? '<td class="c">' + (r.nilai != null ? rank : '-') + '</td>' : '') +
        '<td>' + esc(r.n) + '</td><td class="c">' + esc(r.k) + '</td>' +
        (d.jumlahPG ? '<td class="c">' + (h ? angka(h.pg) : '-') + '</td>' : '') + (d.jumlahES ? '<td class="c">' + (h ? angka(h.es) : '-') + '</td>' : '') +
        '<td class="c"><b>' + angka(r.nilai) + '</b></td><td class="c">' + k + '</td><td class="c">' + (h ? h.pel : '-') + '</td></tr>';
    });
    html += '</tbody></table>';

    if (nilai.length) {
      var rentang = [[85, 100, 'Sangat baik (85–100)'], [70, 84.99, 'Baik (70–84)'], [50, 69.99, 'Cukup (50–69)'], [0, 49.99, 'Perlu bimbingan (0–49)']];
      html += '<table style="width:70%"><thead><tr><th>Rentang nilai</th><th style="width:60px">Jumlah</th><th>Grafik</th></tr></thead><tbody>' +
        rentang.map(function (r) {
          var n = nilai.filter(function (v) { return v >= r[0] && v <= r[1]; }).length;
          return '<tr><td>' + r[2] + '</td><td class="c">' + n + '</td><td><span class="bar" style="width:' + Math.round(n / nilai.length * 100) + '%"></span></td></tr>';
        }).join('') + '</tbody></table>';
    }
    return html + ttd(o, false);
  }

  /* ---------- 2. Lembar jawaban per siswa ---------- */
  function detail(o, d) {
    var p = d.paket, umap = {};
    d.users.forEach(function (u) { umap[u.u] = u; });
    var list = d.hasil.slice().sort(function (a, b) { return a.k.localeCompare(b.k) || a.n.localeCompare(b.n); });
    if (!list.length) return kop(o, d, 'LEMBAR JAWABAN', p.nama) + '<p>Belum ada jawaban terkirim untuk pilihan ini.</p>';
    return list.map(function (h, idx) {
      var items = d.detail[h.id] || [];
      var pg = items.filter(function (i) { return i.tipe === 'PG'; }), es = items.filter(function (i) { return i.tipe !== 'PG'; });
      var dur = h.selesai && h.mulai ? Math.round((h.selesai - h.mulai) / 60000) + ' menit' : '-';
      var s = '<div class="' + (idx ? 'halaman' : '') + '">' + kop(o, d, 'LEMBAR JAWABAN DAN NILAI', p.nama + ' · ' + p.mapel) +
        '<table class="info"><tr><td>Nama</td><td>: <b>' + esc(h.n) + '</b></td><td>Kelas</td><td>: ' + esc(h.k) + '</td></tr>' +
        '<tr><td>Username</td><td>: ' + esc(h.u) + '</td><td>Dikirim</td><td>: ' + waktu(h.t) + '</td></tr>' +
        '<tr><td>Lama mengerjakan</td><td>: ' + dur + '</td><td>Keluar aplikasi</td><td>: ' + h.pel + ' kali</td></tr></table>' +
        '<div class="ringkas">' + (pg.length ? '<div>Skor PG<b>' + angka(h.pg) + '</b></div>' : '') + (es.length ? '<div>Skor essay<b>' + angka(h.es) + '</b></div>' : '') +
        '<div>Nilai<b>' + angka(h.nilai) + '</b></div><div>Keterangan<b style="font-size:12pt">' + (h.nilai == null ? 'Menunggu' : ket(h.nilai, o.kkm)) + '</b></div></div>';
      if (pg.length) {
        var benar = pg.filter(function (i) { return i.akhir > 0; }).length;
        s += '<p><b>A. Pilihan ganda</b> — ' + benar + ' benar dari ' + pg.length + ' soal</p><table><thead><tr><th style="width:34px">No</th>' +
          (o.teksSoal ? '<th>Soal</th>' : '') + '<th style="width:' + (o.teksSoal ? '120' : '200') + 'px">Jawaban</th>' + (o.kunci ? '<th style="width:54px">Kunci</th>' : '') +
          '<th style="width:54px">Hasil</th><th style="width:50px">Skor</th></tr></thead><tbody>' +
          pg.map(function (i) {
            var op = (i.opsi || []).filter(function (x) { return x.k === i.jawaban; })[0];
            return '<tr><td class="c">' + i.no + '</td>' + (o.teksSoal ? '<td>' + rich(i.soal) + '</td>' : '') +
              '<td>' + (i.jawaban ? '<b>' + esc(i.jawaban) + '.</b> ' + (op ? rich(op.t) : '') : '<i>Tidak dijawab</i>') + '</td>' +
              (o.kunci ? '<td class="c">' + esc(i.kunci) + '</td>' : '') + '<td class="c">' + (i.akhir > 0 ? '✔' : '✘') + '</td><td class="c">' + angka(i.akhir) + '</td></tr>';
          }).join('') + '</tbody></table>';
      }
      if (es.length) {
        s += '<p><b>' + (pg.length ? 'B. ' : '') + 'Essay</b></p>' + es.map(function (i) {
          return '<div class="essay"><b>Soal ' + i.no + '</b> <span class="kecil">(skor ' + angka(i.akhir) + ' / ' + i.maks + (i.guru != null ? ', dikoreksi guru' : '') + ')</span>' +
            (o.teksSoal ? '<div class="soal">' + rich(i.soal) + '</div>' : '') +
            '<div class="lbl">Jawaban siswa</div><div class="box">' + (i.jawaban ? rich(i.jawaban) : '<i>Tidak dijawab</i>') + '</div>' +
            (o.kunci && i.pedoman ? '<div class="lbl">Pedoman jawaban</div><div class="box">' + rich(i.pedoman) + '</div>' : '') +
            (i.feedback ? '<div class="lbl">Umpan balik</div><div class="box">' + esc(i.feedback) + '</div>' : '') + '</div>';
        }).join('');
      }
      return s + ttd(o, true) + '</div>';
    }).join('');
  }

  /* ---------- 3/4. Matriks nilai (per kelas / per mapel) ---------- */
  function matriks(o, d, judul, sub) {
    var hmap = {};
    d.hasil.forEach(function (h) { hmap[h.paket + '|' + h.u] = h; });
    var pk = d.pakets;
    if (!pk.length) return kop(o, d, judul, sub) + '<p>Tidak ada ujian untuk pilihan ini.</p>';
    var rows = d.users.map(function (u) {
      var vals = pk.map(function (p) { var h = hmap[p.id + '|' + u.u]; return h ? h.nilai : undefined; });
      var ada = vals.filter(function (v) { return v != null; });
      return { n: u.n, u: u.u, k: u.k, vals: vals, nilai: ada.length ? rata(ada) : null };
    });
    urutkan(rows, o.urut);
    var html = kop(o, d, judul, sub) + '<table class="legend">' + pk.map(function (p, i) {
      return '<tr><td><b>U' + (i + 1) + '</b></td><td>' + esc(p.nama) + '</td><td>' + esc(p.mapel) + '</td></tr>';
    }).join('') + '</table>' +
      '<table><thead><tr><th style="width:30px">No</th><th>Nama siswa</th><th style="width:62px">Kelas</th>' +
      pk.map(function (p, i) { return '<th>U' + (i + 1) + '</th>'; }).join('') + '<th>Rata-rata</th><th>Ket.</th></tr></thead><tbody>' +
      rows.map(function (r, i) {
        return '<tr><td class="c">' + (i + 1) + '</td><td>' + esc(r.n) + '</td><td class="c">' + esc(r.k) + '</td>' +
          r.vals.map(function (v) { return '<td class="c' + (v != null && v < o.kkm ? ' belum' : '') + '">' + (v === undefined ? '-' : v == null ? '…' : angka(v)) + '</td>'; }).join('') +
          '<td class="c"><b>' + angka(r.nilai) + '</b></td><td class="c">' + (r.nilai == null ? '-' : ket(r.nilai, o.kkm)) + '</td></tr>';
      }).join('') +
      '<tr><th colspan="3" style="text-align:right">Rata-rata ujian</th>' + pk.map(function (p, j) {
        return '<th>' + angka(rata(rows.map(function (r) { return r.vals[j]; }).filter(function (v) { return v != null; }))) + '</th>';
      }).join('') + '<th>' + angka(rata(rows.map(function (r) { return r.nilai; }).filter(function (v) { return v != null; }))) + '</th><th></th></tr>' +
      '</tbody></table><p class="kecil">Keterangan: "-" tidak ikut / belum mengirim · "…" menunggu penilaian · angka merah di bawah KKM (' + o.kkm + ').</p>';
    return html + ttd(o, false);
  }

  /* ---------- 5. Riwayat satu siswa ---------- */
  function riwayat(o, d) {
    var u = d.users[0];
    if (!u) return '<p>Siswa tidak ditemukan.</p>';
    var hmap = {};
    d.hasil.forEach(function (h) { hmap[h.paket] = h; });
    var nilai = [];
    var html = kop(o, d, 'RIWAYAT NILAI SISWA', u.n + ' · Kelas ' + u.k) +
      '<table class="info"><tr><td>Nama</td><td>: <b>' + esc(u.n) + '</b></td></tr><tr><td>Kelas</td><td>: ' + esc(u.k) + '</td></tr>' +
      '<tr><td>Username</td><td>: ' + esc(u.u) + '</td></tr></table>' +
      '<table><thead><tr><th style="width:34px">No</th><th>Ujian</th><th>Mata pelajaran</th><th>Dikirim</th><th style="width:60px">Nilai</th><th style="width:105px">Keterangan</th></tr></thead><tbody>' +
      d.pakets.map(function (p, i) {
        var h = hmap[p.id];
        if (h && h.nilai != null) nilai.push(h.nilai);
        return '<tr><td class="c">' + (i + 1) + '</td><td>' + esc(p.nama) + '</td><td>' + esc(p.mapel) + '</td><td>' + (h ? waktu(h.t) : '-') + '</td>' +
          '<td class="c"><b>' + (h ? angka(h.nilai) : '-') + '</b></td><td class="c">' + (!h ? '<span class="belum">Tidak ikut</span>' : h.nilai == null ? 'Menunggu' : ket(h.nilai, o.kkm)) + '</td></tr>';
      }).join('') + '<tr><th colspan="4" style="text-align:right">Rata-rata</th><th>' + angka(rata(nilai)) + '</th><th></th></tr></tbody></table>';
    return html + ttd(o, false);
  }

  function tulis(w, o, d) {
    var isi, judulTab, landscape = false;
    if (o.jenis === 'rekap') { isi = rekap(o, d); judulTab = 'Rekap ' + d.paket.nama; }
    else if (o.jenis === 'detail') { isi = detail(o, d); judulTab = 'Lembar jawaban ' + d.paket.nama; }
    else if (o.jenis === 'kelas') { isi = matriks(o, d, 'REKAP NILAI KELAS ' + o.kelas, (o.mapel ? o.mapel + ' · ' : 'Semua mata pelajaran · ') + 'Kelas ' + o.kelas); judulTab = 'Rekap kelas ' + o.kelas; landscape = d.pakets.length > 6; }
    else if (o.jenis === 'mapel') { isi = matriks(o, d, 'REKAP NILAI ' + (o.mapel || 'SEMUA MAPEL').toUpperCase(), (o.kelas ? 'Kelas ' + o.kelas : 'Semua kelas')); judulTab = 'Rekap ' + (o.mapel || 'mapel'); landscape = d.pakets.length > 6; }
    else { isi = riwayat(o, d); judulTab = 'Riwayat ' + (d.users[0] ? d.users[0].n : ''); }

    var css = CSS + (landscape ? '\n@page{size:A4 landscape}.wrap{max-width:277mm}' : '');
    var mathjax = o.jenis === 'detail' ?
      '<script>window.MathJax={tex:{inlineMath:[["$","$"],["\\\\(","\\\\)"]]},svg:{fontCache:"global"},startup:{pageReady:function(){return MathJax.startup.defaultPageReady().then(function(){document.getElementById("st").textContent="Siap dicetak."})}}};<\/script>' +
      '<script async src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js"><\/script>' : '';
    var doc = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + esc(judulTab) + '</title><style>' + css + '</style>' + mathjax + '</head><body>' +
      '<div class="alat"><button onclick="window.print()">🖨️ Cetak / Simpan PDF</button><span id="st">' + (o.jenis === 'detail' ? 'Merapikan rumus…' : 'Siap dicetak.') +
      ' Di jendela cetak pilih tujuan "Simpan sebagai PDF".</span></div><div class="wrap">' + isi +
      '<p class="kecil" style="margin-top:18px;text-align:right">Dicetak ' + waktu(Date.now()) + ' · Petualangan Ujian</p></div></body></html>';
    w.document.open();
    w.document.write(doc);
    w.document.close();
  }

  window.Laporan = { tulis: tulis };
})();

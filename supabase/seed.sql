-- Dummy data for local/dev testing. Run after 0001_init.sql.
-- Replace with real peserta + soal before the actual event.

insert into peserta (nrp, nama, departemen) values
  ('5025231001', 'Ahmad Fajar Ramadhan', 'Informatika'),
  ('5025231002', 'Siti Nur Aisyah', 'Sistem Informasi'),
  ('5025231003', 'Bagus Setiawan', 'Teknik Elektro'),
  ('5025231004', 'Dewi Puspita Sari', 'Teknik Komputer'),
  ('5025231005', 'Muhammad Rizky Pratama', 'Teknik Biomedik'),
  ('5025231006', 'Nadia Putri Anjani', 'Teknologi Informasi'),
  ('5025231007', 'Rafi Aditya Nugroho', 'Informatika'),
  ('5025231008', 'Salsabila Zahra', 'Sistem Informasi'),
  ('5025231009', 'Yusuf Maulana', 'Teknik Elektro'),
  ('5025231010', 'Cindy Amelia', 'Teknik Komputer');

insert into soal (id, topik, teks, opsi, kunci) values
  (1, 'Umum', 'Apa kepanjangan dari FTEIC?', '[{"key":"a","teks":"Fakultas Teknologi Elektro dan Informatika Cerdas"},{"key":"b","teks":"Fakultas Teknik Elektro Industri dan Komputer"},{"key":"c","teks":"Fakultas Teknologi Energi dan Informasi Cerdas"},{"key":"d","teks":"Fakultas Teknik Elektronika dan Ilmu Komputer"}]', 'a'),
  (2, 'Umum', 'FTEIC adalah fakultas di perguruan tinggi mana?', '[{"key":"a","teks":"Universitas Indonesia"},{"key":"b","teks":"Institut Teknologi Sepuluh Nopember"},{"key":"c","teks":"Institut Teknologi Bandung"},{"key":"d","teks":"Universitas Gadjah Mada"}]', 'b'),
  (3, 'Umum', 'Kegiatan "Temu FTEIC" ditujukan untuk siapa?', '[{"key":"a","teks":"Mahasiswa baru"},{"key":"b","teks":"Dosen"},{"key":"c","teks":"Alumni"},{"key":"d","teks":"Tenaga kependidikan"}]', 'a'),
  (4, 'Umum', 'Apa fungsi utama kuis ini dalam rangkaian Temu FTEIC?', '[{"key":"a","teks":"Nilai akhir mata kuliah"},{"key":"b","teks":"Gate kelulusan penugasan"},{"key":"c","teks":"Seleksi masuk fakultas"},{"key":"d","teks":"Pendaftaran organisasi"}]', 'b'),
  (5, 'Matematika', 'Berapa hasil dari 12 x 8?', '[{"key":"a","teks":"96"},{"key":"b","teks":"86"},{"key":"c","teks":"106"},{"key":"d","teks":"112"}]', 'a'),
  (6, 'Matematika', 'Berapa akar kuadrat dari 144?', '[{"key":"a","teks":"11"},{"key":"b","teks":"12"},{"key":"c","teks":"13"},{"key":"d","teks":"14"}]', 'b'),
  (7, 'Matematika', 'Jika x + 5 = 20, berapa nilai x?', '[{"key":"a","teks":"10"},{"key":"b","teks":"12"},{"key":"c","teks":"15"},{"key":"d","teks":"25"}]', 'c'),
  (8, 'Matematika', 'Berapa hasil dari 2 pangkat 5?', '[{"key":"a","teks":"16"},{"key":"b","teks":"32"},{"key":"c","teks":"64"},{"key":"d","teks":"10"}]', 'b'),
  (9, 'Logika', 'Jika semua A adalah B, dan semua B adalah C, maka...', '[{"key":"a","teks":"Semua C adalah A"},{"key":"b","teks":"Semua A adalah C"},{"key":"c","teks":"Tidak ada A yang C"},{"key":"d","teks":"Sebagian B bukan C"}]', 'b'),
  (10, 'Logika', 'Melanjutkan pola: 2, 4, 8, 16, ...', '[{"key":"a","teks":"20"},{"key":"b","teks":"24"},{"key":"c","teks":"32"},{"key":"d","teks":"30"}]', 'c'),
  (11, 'Logika', 'Manakah yang tidak termasuk kelompok: Elektro, Informatika, Biomedik, Kedokteran?', '[{"key":"a","teks":"Elektro"},{"key":"b","teks":"Informatika"},{"key":"c","teks":"Biomedik"},{"key":"d","teks":"Kedokteran"}]', 'd'),
  (12, 'Bahasa', 'Sinonim dari kata "cerdas" adalah...', '[{"key":"a","teks":"Lambat"},{"key":"b","teks":"Pintar"},{"key":"c","teks":"Malas"},{"key":"d","teks":"Ragu"}]', 'b'),
  (13, 'Bahasa', 'Antonim dari kata "maju" adalah...', '[{"key":"a","teks":"Mundur"},{"key":"b","teks":"Cepat"},{"key":"c","teks":"Naik"},{"key":"d","teks":"Besar"}]', 'a'),
  (14, 'Bahasa', 'Kata baku yang tepat untuk "jaman" adalah...', '[{"key":"a","teks":"Zaman"},{"key":"b","teks":"Djaman"},{"key":"c","teks":"Jaman"},{"key":"d","teks":"Zjaman"}]', 'a'),
  (15, 'Bahasa', 'Manakah penulisan yang tepat sesuai EYD?', '[{"key":"a","teks":"di kerjakan"},{"key":"b","teks":"dikerjakan"},{"key":"c","teks":"di-kerjakan"},{"key":"d","teks":"dі kerjakan"}]', 'b');

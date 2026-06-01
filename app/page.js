"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase (Vercel otomatis membaca ENV ini nanti)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function KeuanganApp() {
  const [transaksi, setTransaksi] = useState([]);
  const [tabungan, setTabungan] = useState([]);
  const [utang, setUtang] = useState([]);

  const [formTx, setFormTx] = useState({ tipe: "pengeluaran", kategori: "", jumlah: "", catatan: "" });
  const [formTabungan, setFormTabungan] = useState({ nama: "", target: "", terkumpul: "", tenggat: "" });
  const [formUtang, setFormUtang] = useState({ jenis: "GoPayLater", jenisCustom: "", jumlah: "", tenggat: "", catatan: "" });

  useEffect(() => {
    if (supabaseUrl && supabaseAnonKey) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    const { data: tx } = await supabase.from("transaksi").select("*").order("id", { ascending: false });
    const { data: tab } = await supabase.from("tabungan").select("*");
    const { data: ut } = await supabase.from("utang_paylater").select("*").order("tenggat_waktu", { ascending: true });
    if (tx) setTransaksi(tx);
    if (tab) setTabungan(tab);
    if (ut) setUtang(ut);
  };

  const handleAddTransaksi = async (e) => {
    e.preventDefault();
    await supabase.from("transaksi").insert([
      { tipe: formTx.tipe, kategori: formTx.kategori, jumlah: parseFloat(formTx.jumlah), catatan: formTx.catatan }
    ]);
    setFormTx({ tipe: "pengeluaran", kategori: "", jumlah: "", catatan: "" });
    fetchData();
  };

  const handleAddTabungan = async (e) => {
    e.preventDefault();
    await supabase.from("tabungan").insert([
      { nama_tabungan: formTabungan.nama, target_dana: parseFloat(formTabungan.target), dana_terkumpul: parseFloat(formTabungan.terkumpul || 0), tenggat_waktu: formTabungan.tenggat }
    ]);
    setFormTabungan({ nama: "", target: "", terkumpul: "", tenggat: "" });
    fetchData();
  };

  const handleAddUtang = async (e) => {
    e.preventDefault();
    const jenisFinal = formUtang.jenis === "Custom" ? formUtang.jenisCustom : formUtang.jenis;
    await supabase.from("utang_paylater").insert([
      { jenis_layanan: jenisFinal, jumlah_utang: parseFloat(formUtang.jumlah), tenggat_waktu: formUtang.tenggat, catatan: formUtang.catatan }
    ]);
    setFormUtang({ jenis: "GoPayLater", jenisCustom: "", jumlah: "", tenggat: "", catatan: "" });
    fetchData();
  };

  const hitungSisa = (target, terkumpul) => {
    const sisa = target - terkumpul;
    return sisa < 0 ? 0 : sisa;
  };

  const formatRp = (angka) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-emerald-400">ZRXNVIE Dashboard Keuangan</h1>
          <p className="text-gray-400 text-sm">Catatan Keuangan Mandiri & Pelacak Target Tabungan</p>
        </header>

        {/* SECTION 1: CASHFLOW */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">Input Transaksi</h2>
            <form onSubmit={handleAddTransaksi} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Tipe</label>
                <select value={formTx.tipe} onChange={(e) => setFormTx({...formTx, tipe: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600">
                  <option value="pengeluaran">Pengeluaran 📉</option>
                  <option value="pemasukan">Pemasukan 📈</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Kategori / Sumber</label>
                <input type="text" placeholder="Gaji, Makanan, Kopi, dll" value={formTx.kategori} onChange={(e) => setFormTx({...formTx, kategori: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600" required />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Jumlah (Rp)</label>
                <input type="number" placeholder="0" value={formTx.jumlah} onChange={(e) => setFormTx({...formTx, jumlah: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600" required />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Catatan Detail</label>
                <textarea placeholder="Dari mana / buat apa secara spesifik..." value={formTx.catatan} onChange={(e) => setFormTx({...formTx, catatan: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600 h-20" />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-gray-900 font-bold p-2 rounded transition">Simpan Transaksi</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-gray-800 p-5 rounded-xl border border-gray-700 h-[400px] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Riwayat Transaksi</h2>
            <div className="space-y-3">
              {transaksi.map((tx) => (
                <div key={tx.id} className={`p-3 rounded-lg border flex justify-between items-start ${tx.tipe === 'pemasukan' ? 'bg-emerald-950/40 border-emerald-800' : 'bg-rose-950/40 border-rose-800'}`}>
                  <div>
                    <span className="text-xs text-gray-400">{tx.tanggal}</span>
                    <h4 className="font-bold text-white text-lg">{tx.kategori}</h4>
                    <p className="text-sm text-gray-300 italic">💬 {tx.catatan || "-"}</p>
                  </div>
                  <span className={`font-bold text-lg ${tx.tipe === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.tipe === 'pemasukan' ? '+' : '-'} {formatRp(tx.jumlah)}
                  </span>
                </div>
              ))}
              {transaksi.length === 0 && <p className="text-gray-500 text-center py-8">Belum ada data transaksi.</p>}
            </div>
          </div>
        </section>

        {/* SECTION 2: TABUNGAN */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">🎯 Celengan & Target Tabungan</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-gray-300 mb-3">Buat Target Baru</h3>
              <form onSubmit={handleAddTabungan} className="space-y-3 text-sm">
                <input type="text" placeholder="Nama Target (ex: Dana Darurat, HP)" value={formTabungan.nama} onChange={(e) => setFormTabungan({...formTabungan, nama: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600" required />
                <input type="number" placeholder="Target Dana (Rp)" value={formTabungan.target} onChange={(e) => setFormTabungan({...formTabungan, target: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600" required />
                <input type="number" placeholder="Dana Awal Terkumpul" value={formTabungan.terkumpul} onChange={(e) => setFormTabungan({...formTabungan, terkumpul: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600" />
                <input type="date" value={formTabungan.tenggat} onChange={(e) => setFormTabungan({...formTabungan, tenggat: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600" required />
                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold p-2 rounded transition">Tambah Target</button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {tabungan.map((tab) => {
                const sisa = hitungSisa(tab.target_dana, tab.dana_terkumpul);
                const progressPersen = Math.min((tab.dana_terkumpul / tab.target_dana) * 100, 100);
                return (
                  <div key={tab.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-lg">{tab.nama_tabungan}</span>
                      <span className="text-xs text-yellow-400 bg-yellow-950 px-2 py-1 rounded">📅 Batas: {tab.tenggat_waktu}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 my-2">
                      <div>Target: <b className="text-white block">{formatRp(tab.target_dana)}</b></div>
                      <div>Terkumpul: <b className="text-cyan-400 block">{formatRp(tab.dana_terkumpul)}</b></div>
                      <div>Sisa Lagi: <b className="text-rose-400 block">{formatRp(sisa)}</b></div>
                    </div>
                    <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full" style={{ width: `${progressPersen}%` }}></div>
                    </div>
                    <p className="text-right text-[10px] text-gray-500 mt-1">{progressPersen.toFixed(1)}% Terpenuhi</p>
                  </div>
                );
              })}
              {tabungan.length === 0 && <p className="text-gray-500 text-center py-4">Belum ada target tabungan.</p>}
            </div>
          </div>
        </section>

        {/* SECTION 3: UTANG/PAYLATER */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-rose-400 mb-4">🚨 Pelacak Utang & Paylater</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <form onSubmit={handleAddUtang} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Layanan</label>
                  <select value={formUtang.jenis} onChange={(e) => setFormUtang({...formUtang, jenis: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600">
                    <option value="GoPayLater">GoPayLater</option>
                    <option value="SPayLater">SPayLater</option>
                    <option value="TikTokPayLater">TikTokPayLater</option>
                    <option value="Custom">Custom (Ketik Sendiri)</option>
                  </select>
                </div>
                {formUtang.jenis === "Custom" && (
                  <input type="text" placeholder="Nama Layanan Paylater" value={formUtang.jenisCustom} onChange={(e) => setFormUtang({...formUtang, jenisCustom: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600" required />
                )}
                <input type="number" placeholder="Jumlah Tagihan (Rp)" value={formUtang.jumlah} onChange={(e) => setFormUtang({...formUtang, jumlah: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600" required />
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Jatuh Tempo</label>
                  <input type="date" value={formUtang.tenggat} onChange={(e) => setFormUtang({...formUtang, tenggat: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600" required />
                </div>
                <input type="text" placeholder="Catatan Keperluan" value={formUtang.catatan} onChange={(e) => setFormUtang({...formUtang, catatan: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white border border-gray-600" />
                <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-gray-900 font-bold p-2 rounded transition">Tambah Tagihan</button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {utang.map((utg) => (
                <div key={utg.id} className="bg-gray-900 p-4 rounded-lg border border-rose-950 flex justify-between items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-rose-400 text-base">{utg.jenis_layanan}</span>
                      <span className="text-[11px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full font-semibold">🚨 Tempo: {utg.tenggat_waktu}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Keperluan: <span className="text-gray-200 italic">{utg.catatan || "-"}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white block">{formatRp(utg.jumlah_utang)}</span>
                  </div>
                </div>
              ))}
              {utang.length === 0 && <p className="text-gray-500 text-center py-4">Bersih dari hutang/paylater! 🙌</p>}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

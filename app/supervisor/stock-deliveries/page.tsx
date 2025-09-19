"use client";

import { useEffect, useState } from "react";
import API from "@/lib/api";
import Swal from "sweetalert2";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// --- TAMBAHAN BARU ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StockDelivery {
  id: number;
  spbu_id: number;
  volumePertalite: number;
  volumePertamax: number;
  volumePertamaxTurbo: number;
  volumeBiosolar: number;
  volumeDexLite: number;
  volumePertaminaDex: number;
  createdAt: string;
  updatedAt: string;
}

export default function StockDeliveriesPage() {
  const [stockDeliveries, setStockDeliveries] = useState<StockDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editing, setEditing] = useState<StockDelivery | null>(null);
  const [form, setForm] = useState<any>({});

  const setField = (key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [key]: value }));

  const fetchStockDeliveries = async () => {
    setLoading(true);
    try {
      const res = await API.get("/supervisor/stock-deliveries");
      setStockDeliveries(res.data.data || []);
    } catch (err: any) {
      Swal.fire("Error", "Gagal memuat data stock deliveries!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockDeliveries();
  }, []);

  const resetForm = () =>
    setForm({
      volumePertalite: "",
      volumePertamax: "",
      volumePertamaxTurbo: "",
      volumeBiosolar: "",
      volumeDexLite: "",
      volumePertaminaDex: "",
    });

  const openAdd = () => {
    resetForm();
    setOpenAddModal(true);
  };

  const openEdit = (s: StockDelivery) => {
    setEditing(s);
    setForm({
      volumePertalite: s.volumePertalite,
      volumePertamax: s.volumePertamax,
      volumePertamaxTurbo: s.volumePertamaxTurbo,
      volumeBiosolar: s.volumeBiosolar,
      volumeDexLite: s.volumeDexLite,
      volumePertaminaDex: s.volumePertaminaDex,
    });
    setOpenEditModal(true);
  };

  const handleAdd = async () => {
    try {
      const payload = {
        volumePertalite: Number(form.volumePertalite || 0),
        volumePertamax: Number(form.volumePertamax || 0),
        volumePertamaxTurbo: Number(form.volumePertamaxTurbo || 0),
        volumeBiosolar: Number(form.volumeBiosolar || 0),
        volumeDexLite: Number(form.volumeDexLite || 0),
        volumePertaminaDex: Number(form.volumePertaminaDex || 0),
      };
      await API.post("/supervisor/stock-deliveries", payload);
      Swal.fire("Berhasil", "Stock Delivery berhasil ditambahkan!", "success");
      setOpenAddModal(false);
      fetchStockDeliveries();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Gagal tambah data!", "error");
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const payload = {
        volumePertalite: Number(form.volumePertalite),
        volumePertamax: Number(form.volumePertamax),
        volumePertamaxTurbo: Number(form.volumePertamaxTurbo),
        volumeBiosolar: Number(form.volumeBiosolar),
        volumeDexLite: Number(form.volumeDexLite),
        volumePertaminaDex: Number(form.volumePertaminaDex),
      };
      await API.put(`/supervisor/stock-deliveries/${editing.id}`, payload);
      Swal.fire("Berhasil", "Stock Delivery berhasil diupdate!", "success");
      setOpenEditModal(false);
      setEditing(null);
      fetchStockDeliveries();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Gagal update data!", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Yakin?", text: "Data akan dihapus permanen!", icon: "warning",
      showCancelButton: true, confirmButtonText: "Ya, hapus!", cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;
    try {
      await API.delete(`/supervisor/stock-deliveries/${id}`);
      Swal.fire("Berhasil", "Data berhasil dihapus!", "success");
      fetchStockDeliveries();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Gagal hapus data!", "error");
    }
  };

  // --- TAMBAHAN BARU: Fungsi Ekspor PDF ---
  const handleExportPDF = () => {
    if (stockDeliveries.length === 0) {
      Swal.fire("Info", "Tidak ada data untuk diekspor!", "info");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan Stock Deliveries", doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 25);
    
    const head = [["ID", "Pertalite", "Pertamax", "Pertamax Turbo", "Biosolar", "DexLite", "Pertamina Dex", "Dibuat"]];
    const body = stockDeliveries.map(s => [
        s.id,
        s.volumePertalite.toLocaleString('id-ID'),
        s.volumePertamax.toLocaleString('id-ID'),
        s.volumePertamaxTurbo.toLocaleString('id-ID'),
        s.volumeBiosolar.toLocaleString('id-ID'),
        s.volumeDexLite.toLocaleString('id-ID'),
        s.volumePertaminaDex.toLocaleString('id-ID'),
        new Date(s.createdAt).toLocaleString('id-ID')
    ]);

    autoTable(doc, {
      head: head,
      body: body,
      startY: 30,
      theme: 'grid',
      headStyles: { fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 },
    });

    doc.save(`Laporan_Stock_Deliveries.pdf`);
  };

  const renderFormFields = () => (
    <>
      <div><label>Volume Pertalite</label><Input type="number" value={form.volumePertalite || ""} onChange={(e) => setField("volumePertalite", e.target.value)} /></div>
      <div><label>Volume Pertamax</label><Input type="number" value={form.volumePertamax || ""} onChange={(e) => setField("volumePertamax", e.target.value)} /></div>
      <div><label>Volume Pertamax Turbo</label><Input type="number" value={form.volumePertamaxTurbo || ""} onChange={(e) => setField("volumePertamaxTurbo", e.target.value)} /></div>
      <div><label>Volume Biosolar</label><Input type="number" value={form.volumeBiosolar || ""} onChange={(e) => setField("volumeBiosolar", e.target.value)} /></div>
      <div><label>Volume DexLite</label><Input type="number" value={form.volumeDexLite || ""} onChange={(e) => setField("volumeDexLite", e.target.value)} /></div>
      <div><label>Volume Pertamina Dex</label><Input type="number" value={form.volumePertaminaDex || ""} onChange={(e) => setField("volumePertaminaDex", e.target.value)} /></div>
    </>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Stock Deliveries</h1>
        {/* --- TOMBOL EKSPOR DITAMBAHKAN DI SINI --- */}
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF}>Export PDF</Button>
            <Button onClick={openAdd}>+ Tambah Data</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Data Stock Deliveries</CardTitle></CardHeader>
        <CardContent>
          {loading ? (<p>Loading...</p>) : stockDeliveries.length === 0 ? (<p>Belum ada data stock deliveries.</p>) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead><TableHead>Pertalite</TableHead><TableHead>Pertamax</TableHead>
                  <TableHead>Pertamax Turbo</TableHead><TableHead>Biosolar</TableHead><TableHead>DexLite</TableHead>
                  <TableHead>Pertamina Dex</TableHead><TableHead>Dibuat</TableHead><TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockDeliveries.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>{s.volumePertalite}</TableCell><TableCell>{s.volumePertamax}</TableCell>
                    <TableCell>{s.volumePertamaxTurbo}</TableCell><TableCell>{s.volumeBiosolar}</TableCell>
                    <TableCell>{s.volumeDexLite}</TableCell><TableCell>{s.volumePertaminaDex}</TableCell>
                    <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {openAddModal && (<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 overflow-y-auto"><div className="bg-white rounded-2xl p-6 w-full max-w-2xl"><h2 className="text-xl font-semibold mb-4">Tambah Stock Delivery</h2><div className="grid grid-cols-2 gap-4">{renderFormFields()}</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setOpenAddModal(false)}>Batal</Button><Button onClick={handleAdd}>Simpan</Button></div></div></div>)}
      {openEditModal && editing && (<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 overflow-y-auto"><div className="bg-white rounded-2xl p-6 w-full max-w-2xl"><h2 className="text-xl font-semibold mb-4">Edit Stock Delivery</h2><div className="grid grid-cols-2 gap-4">{renderFormFields()}</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => { setOpenEditModal(false); setEditing(null); }}>Batal</Button><Button onClick={handleUpdate}>Simpan</Button></div></div></div>)}
    </div>
  );
}
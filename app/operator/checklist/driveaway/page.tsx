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

interface ChecklistDriveway {
  id: number;
  tanggal: string;
  shift: string;
  elemen: string;
  aktifitasDriveway: string;
  checklistStatus: string;
  spbu?: { code_spbu: string };
  user?: { name: string };
}

export default function ChecklistDrivewayPage() {
  const [checklists, setChecklists] = useState<ChecklistDriveway[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editing, setEditing] = useState<ChecklistDriveway | null>(null);
  const [form, setForm] = useState<any>({});

  // --- TAMBAHAN BARU: State untuk pilihan ekspor ---
  const [exportMonth, setExportMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [exportYear, setExportYear] = useState<string>(new Date().getFullYear().toString());


  const setField = (key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [key]: value }));

  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const res = await API.get("/operator/checklist-driveway");
      setChecklists(res.data.data || []);
    } catch (err: any) {
      Swal.fire("Error", "Gagal memuat data checklist driveway!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const resetForm = () => setForm({});

  const openAdd = () => {
    resetForm();
    setOpenAddModal(true);
  };

  const openEdit = (c: ChecklistDriveway) => {
    setEditing(c);
    setForm({
      ...c,
      tanggal: c.tanggal.slice(0, 16), // format datetime-local
    });
    setOpenEditModal(true);
  };

  const handleAdd = async () => {
    try {
      const formData = new URLSearchParams();
      formData.append("tanggal", new Date(form.tanggal).toISOString());
      formData.append("shift", form.shift);
      formData.append("elemen", form.elemen);
      formData.append("aktifitasDriveway", form.aktifitasDriveway);
      formData.append("checklistStatus", form.checklistStatus);

      await API.post("/operator/checklist-driveway", formData);
      Swal.fire("Berhasil", "Checklist berhasil ditambahkan!", "success");
      setOpenAddModal(false);
      fetchChecklists();
    } catch (err: any) {
      Swal.fire( "Error", err.response?.data?.message || "Gagal tambah data!", "error" );
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const formData = new URLSearchParams();
      formData.append("tanggal", new Date(form.tanggal).toISOString());
      formData.append("shift", form.shift);
      formData.append("elemen", form.elemen);
      formData.append("aktifitasDriveway", form.aktifitasDriveway);
      formData.append("checklistStatus", form.checklistStatus);

      await API.put(`/operator/checklist-driveway/${editing.id}`, formData);
      Swal.fire("Berhasil", "Checklist berhasil diupdate!", "success");
      setOpenEditModal(false);
      setEditing(null);
      fetchChecklists();
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
      await API.delete(`/operator/checklist-driveway/${id}`);
      Swal.fire("Berhasil", "Data berhasil dihapus!", "success");
      fetchChecklists();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Gagal hapus data!", "error");
    }
  };

  const renderFormFields = () => (
    <>
      <div><label>Tanggal</label><Input type="datetime-local" value={form.tanggal || ""} onChange={(e) => setField("tanggal", e.target.value)} /></div>
      <div><label>Shift</label><Select value={form.shift || ""} onValueChange={(v) => setField("shift", v)}><SelectTrigger><SelectValue placeholder="Pilih Shift" /></SelectTrigger><SelectContent><SelectItem value="PAGI">PAGI</SelectItem><SelectItem value="SIANG">SIANG</SelectItem><SelectItem value="MALAM">MALAM</SelectItem></SelectContent></Select></div>
      <div>
        <label>Elemen</label>
        <Select value={form.elemen || ""} onValueChange={(v) => setField("elemen", v)}>
          <SelectTrigger><SelectValue placeholder="Pilih Elemen" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="DRIVEWAY">DRIVEWAY</SelectItem><SelectItem value="PULAU">PULAU</SelectItem><SelectItem value="KANOPI">KANOPI</SelectItem>
            <SelectItem value="SIGNAGE">SIGNAGE</SelectItem><SelectItem value="OIL">OIL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label>Aktifitas Driveway</label>
        <Select value={form.aktifitasDriveway || ""} onValueChange={(v) => setField("aktifitasDriveway", v)}>
          <SelectTrigger><SelectValue placeholder="Pilih Aktifitas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PERIKSA_KERUSAKAN_SECARA_VISUAL">PERIKSA KERUSAKAN SECARA VISUAL</SelectItem>
            <SelectItem value="SAPU_DAERAH_DRIVEWAY_DAN_SEKITARNYA">SAPU DAERAH DRIVEWAY DAN SEKITARNYA</SelectItem>
            <SelectItem value="CUCI_DRIVEWAY_DENGAN_SIKAT_DAN_DETERGEN">CUCI DRIVEWAY DENGAN SIKAT DAN DETERGEN</SelectItem>
            <SelectItem value="CUCI_PULAU_DENGAN_SIKAT_DAN_DETERGEN">CUCI PULAU DENGAN SIKAT DAN DETERGEN</SelectItem>
            <SelectItem value="PEMERIKSAAN_VISUAL_KESULITAN_DAN_KEBERSIHAN">PEMERIKSAAN VISUAL KESULITAN DAN KEBERSIHAN</SelectItem>
            <SelectItem value="PERIKSA_FUNGSI_LAMPU">PERIKSA FUNGSI LAMPU</SelectItem>
            <SelectItem value="PERIKSA_LAMPU">PERIKSA LAMPU</SelectItem>
            <SelectItem value="PERIKSA_KEDALAMAN_DAN_KEBERSIHAN">PERIKSA KEDALAMAN DAN KEBERSIHAN</SelectItem>
            <SelectItem value="KURAS">KURAS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><label>Status Checklist</label><Select value={form.checklistStatus || ""} onValueChange={(v) => setField("checklistStatus", v)}><SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger><SelectContent><SelectItem value="TERLAKSANA">TERLAKSANA</SelectItem><SelectItem value="BERSIH">BERSIH</SelectItem><SelectItem value="TIDAK_BERSIH">TIDAK BERSIH</SelectItem><SelectItem value="ADA_KERUSAKAN">ADA KERUSAKAN</SelectItem><SelectItem value="BELUM_DILAKUKAN">BELUM DILAKUKAN</SelectItem></SelectContent></Select></div>
    </>
  );

  // --- TAMBAHAN BARU: Fungsi Ekspor PDF untuk Driveway ---
  const handleExportPDF = () => {
    if (!exportMonth || !exportYear) {
      Swal.fire("Gagal", "Silakan pilih bulan dan tahun untuk ekspor.", "error");
      return;
    }
    const month = parseInt(exportMonth, 10) - 1;
    const year = parseInt(exportYear, 10);

    const filteredChecklists = checklists.filter(c => {
      const date = new Date(c.tanggal);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    if (filteredChecklists.length === 0) {
      Swal.fire("Info", "Tidak ada data checklist pada bulan dan tahun yang dipilih.", "info");
      return;
    }

    const spbu = filteredChecklists[0]?.spbu?.code_spbu || "N/A";
    const monthName = new Date(year, month).toLocaleString('id-ID', { month: 'long' });
    const uniqueShifts = [...new Set(filteredChecklists.map(c => c.shift))].join(', ');
    
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CHECKLIST KEGIATAN HOUSEKEEPING DRIVEWAY", doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`SPBU: ${spbu}`, 14, 25);
    doc.text(`Bulan: ${monthName.toUpperCase()} ${year}`, 14, 30);
    doc.text(`Shift: ${uniqueShifts}`, 14, 35);

    const statusMap: { [key: string]: string } = {
        'TERLAKSANA': 'T', 'BERSIH': 'B', 'TIDAK_BERSIH': 'TB',
        'ADA_KERUSAKAN': 'AK', 'BELUM_DILAKUKAN': 'BD'
    };
    const shiftMap: { [key: string]: string } = {
        'PAGI': 'P', 'SIANG': 'S', 'MALAM': 'M'
    };

    // Kelompokkan aktivitas berdasarkan elemen
    const groupedActivities: { [key: string]: { value: string; label: string }[] } = {
        DRIVEWAY: [{ value: "SAPU_DAERAH_DRIVEWAY_DAN_SEKITARNYA", label: "Sapu daerah driveway & sekitarnya" }, { value: "CUCI_DRIVEWAY_DENGAN_SIKAT_DAN_DETERGEN", label: "Cuci driveway dengan sikat & detergen" }],
        PULAU: [{ value: "CUCI_PULAU_DENGAN_SIKAT_DAN_DETERGEN", label: "Cuci pulau dengan sikat & detergen" }],
        KANOPI: [{ value: "PEMERIKSAAN_VISUAL_KESULITAN_DAN_KEBERSIHAN", label: "Pemeriksaan visual kesulitan & kebersihan" }, { value: "PERIKSA_FUNGSI_LAMPU", label: "Periksa fungsi lampu" }],
        SIGNAGE: [{ value: "PERIKSA_LAMPU", label: "Periksa lampu" }],
        OIL: [{ value: "PERIKSA_KEDALAMAN_DAN_KEBERSIHAN", label: "Periksa kedalaman & kebersihan" }, { value: "KURAS", label: "Kuras" }]
    };

    const head = [["Elemen", "Aktifitas", ...Array.from({ length: 31 }, (_, i) => (i + 1).toString()), "Paraf Supervisor"]];
    const body: any[] = [];

    Object.keys(groupedActivities).forEach(elemen => {
        const activities = groupedActivities[elemen];
        activities.forEach((activity, index) => {
            const row: (string | number)[] = Array(34).fill('');
            // Hanya tulis nama elemen di baris pertama
            if (index === 0) {
                row[0] = elemen;
            }
            row[1] = activity.label;

            const checksForActivity = filteredChecklists.filter(c => c.aktifitasDriveway === activity.value);
            checksForActivity.forEach(c => {
                const day = new Date(c.tanggal).getDate();
                const currentCell = row[day + 1] as string; // +1 karena ada kolom elemen
                const statusAbbr = statusMap[c.checklistStatus] || '';
                const shiftAbbr = shiftMap[c.shift] || '';
                const newEntry = `${statusAbbr} (${shiftAbbr})`;
                row[day + 1] = currentCell ? `${currentCell}\n${newEntry}` : newEntry;
            });
            body.push(row);
        });
    });

    autoTable(doc, {
      head: head,
      body: body,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fontSize: 8, fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold', fontSize: 8, halign: 'center', valign: 'middle' },
        1: { cellWidth: 45, fontSize: 8 },
        ...Object.fromEntries(Array.from({ length: 31 }, (_, i) => [i + 2, { cellWidth: 6.2, halign: 'center' }])),
        33: { cellWidth: 20 },
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Keterangan (Legend):", 14, finalY + 10);
    doc.setFont("helvetica", "normal");
    doc.text("Status: T (Terlaksana), B (Bersih), TB (Tidak Bersih), AK (Ada Kerusakan), BD (Belum Dilakukan)", 14, finalY + 14);
    doc.text("Shift: P (Pagi), S (Siang), M (Malam)", 14, finalY + 18);

    doc.save(`Checklist_Driveway_${spbu}_${monthName}_${year}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Checklist Driveway</h1>
        <div className="flex items-center gap-2">
            <Select value={exportMonth} onValueChange={setExportMonth}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Bulan" /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, i) => (<SelectItem key={i} value={(i + 1).toString()}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</SelectItem>))}</SelectContent></Select>
            <Select value={exportYear} onValueChange={setExportYear}><SelectTrigger className="w-[100px]"><SelectValue placeholder="Tahun" /></SelectTrigger><SelectContent>{Array.from({ length: 5 }, (_, i) => (<SelectItem key={i} value={(new Date().getFullYear() - i).toString()}>{new Date().getFullYear() - i}</SelectItem>))}</SelectContent></Select>
            <Button variant="outline" onClick={handleExportPDF}>Export PDF</Button>
            <Button onClick={openAdd}>+ Tambah Data</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Data Checklist Driveway</CardTitle></CardHeader>
        <CardContent>
          {loading ? (<p>Loading...</p>) : checklists.length === 0 ? (<p>Belum ada data checklist driveway.</p>) : (
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>SPBU</TableHead><TableHead>User</TableHead><TableHead>Tanggal</TableHead><TableHead>Shift</TableHead><TableHead>Elemen</TableHead><TableHead>Aktifitas</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {checklists.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.id}</TableCell><TableCell>{c.spbu?.code_spbu}</TableCell><TableCell>{c.user?.name}</TableCell>
                    <TableCell>{new Date(c.tanggal).toLocaleString("id-ID")}</TableCell>
                    <TableCell>{c.shift}</TableCell><TableCell>{c.elemen}</TableCell>
                    <TableCell>{c.aktifitasDriveway.replace(/_/g, " ")}</TableCell>
                    <TableCell>{c.checklistStatus.replace(/_/g, " ")}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {openAddModal && (<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 overflow-y-auto"><div className="bg-white rounded-2xl p-6 w-full max-w-3xl"><h2 className="text-xl font-semibold mb-4">Tambah Checklist Driveway</h2><div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">{renderFormFields()}</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setOpenAddModal(false)}>Batal</Button><Button onClick={handleAdd}>Simpan</Button></div></div></div>)}
      {openEditModal && editing && (<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 overflow-y-auto"><div className="bg-white rounded-2xl p-6 w-full max-w-3xl"><h2 className="text-xl font-semibold mb-4">Edit Checklist Driveway</h2><div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">{renderFormFields()}</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => { setOpenEditModal(false); setEditing(null); }}>Batal</Button><Button onClick={handleUpdate}>Simpan</Button></div></div></div>)}
    </div>
  );
}
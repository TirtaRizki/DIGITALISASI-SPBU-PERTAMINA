"use client";

import { useEffect, useState } from "react";
import API from "@/lib/api";
import Swal from "sweetalert2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// --- PERBAIKAN 1: INTERFACE DIBUAT LEBIH FLEKSIBEL ---
interface IssueReport {
  id: number;
  tanggalLaporan?: string | null; // Dibuat opsional
  tanggal?: string | null;        // Ditambahkan kemungkinan field 'tanggal'
  shift: string;
  judulLaporan: string;
  deskripsiLaporan: string;
  spbu?: { code_spbu: string };
  user?: { name: string };
}

export default function IssueReportPage() {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editing, setEditing] = useState<IssueReport | null>(null);
  const [form, setForm] = useState<any>({});

  const setField = (key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [key]: value }));

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get("/operator/issue-report");
      setReports(res.data.data || []);
    } catch (err: any) {
      Swal.fire("Error", "Gagal memuat data laporan masalah!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const resetForm = () => setForm({});

  const openAdd = () => {
    resetForm();
    setOpenAddModal(true);
  };

  const openEdit = (report: IssueReport) => {
    setEditing(report);
    const reportDate = report.tanggalLaporan || report.tanggal;
    setForm({
      ...report,
      tanggal: reportDate ? reportDate.slice(0, 16) : "",
    });
    setOpenEditModal(true);
  };

  const createPayload = () => {
    const formData = new URLSearchParams();
    if (form.tanggal && !isNaN(new Date(form.tanggal).getTime())) {
      formData.append("tanggal", new Date(form.tanggal).toISOString());
    } else {
      formData.append("tanggal", new Date().toISOString()); // Default ke waktu sekarang jika tidak valid
    }
    formData.append("shift", form.shift || "");
    formData.append("judulLaporan", form.judulLaporan || "");
    formData.append("deskripsiLaporan", form.deskripsiLaporan || "");
    return formData;
  };

  const handleAdd = async () => {
    try {
      const payload = createPayload();
      await API.post("/operator/issue-report", payload);
      Swal.fire("Berhasil", "Laporan berhasil ditambahkan!", "success");
      setOpenAddModal(false);
      fetchReports();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Gagal tambah data!", "error");
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const payload = createPayload();
      await API.put(`/operator/issue-report/${editing.id}`, payload);
      Swal.fire("Berhasil", "Laporan berhasil diupdate!", "success");
      setOpenEditModal(false);
      setEditing(null);
      fetchReports();
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
      await API.delete(`/operator/issue-report/${id}`);
      Swal.fire("Berhasil", "Data berhasil dihapus!", "success");
      fetchReports();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Gagal hapus data!", "error");
    }
  };

  // --- TAMBAHAN BARU: Fungsi Ekspor PDF untuk Laporan Masalah ---
  const handleExportPDF = () => {
    if (reports.length === 0) {
      Swal.fire("Info", "Tidak ada data untuk diekspor!", "info");
      return;
    }
    
    const doc = new jsPDF();
    const spbu = reports[0]?.spbu?.code_spbu || "N/A";

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan Masalah (Issue Report)", 105, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`SPBU: ${spbu}`, 14, 25);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, doc.internal.pageSize.getWidth() - 14, 25, { align: 'right' });
    
    const head = [["ID", "Tanggal", "Shift", "User", "Judul Laporan", "Deskripsi"]];
    const body = reports.map(report => {
        const reportDate = report.tanggalLaporan || report.tanggal;
        return [
            report.id,
            reportDate ? new Date(reportDate).toLocaleString("id-ID") : "-",
            report.shift,
            report.user?.name || "-",
            report.judulLaporan,
            report.deskripsiLaporan
        ];
    });

    autoTable(doc, {
      head: head,
      body: body,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: 0 },
      columnStyles: {
        0: { cellWidth: 10 }, // ID
        1: { cellWidth: 30 }, // Tanggal
        2: { cellWidth: 15 }, // Shift
        3: { cellWidth: 25 }, // User
        4: { cellWidth: 40 }, // Judul
        5: { cellWidth: 'auto' }, // Deskripsi
      }
    });

    doc.save(`Laporan_Masalah_${spbu}.pdf`);
  };

  const renderFormFields = () => (
    <>
      <div><label>Tanggal Laporan</label><Input type="datetime-local" value={form.tanggal || ""} onChange={(e) => setField("tanggal", e.target.value)} /></div>
      <div>
        <label>Shift</label>
        <Select value={form.shift || ""} onValueChange={(v) => setField("shift", v)}>
          <SelectTrigger><SelectValue placeholder="Pilih Shift" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PAGI">PAGI</SelectItem><SelectItem value="SIANG">SIANG</SelectItem><SelectItem value="MALAM">MALAM</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2"><label>Judul Laporan</label><Input placeholder="Cth: Lampu kanopi mati" value={form.judulLaporan || ""} onChange={(e) => setField("judulLaporan", e.target.value)} /></div>
      <div className="col-span-2"><label>Deskripsi Laporan</label><Textarea placeholder="Jelaskan masalah secara rinci..." value={form.deskripsiLaporan || ""} onChange={(e) => setField("deskripsiLaporan", e.target.value)} /></div>
    </>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Laporan Masalah</h1>
        {/* --- TAMBAHAN BARU: Tombol Export --- */}
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF}>Export PDF</Button>
            <Button onClick={openAdd}>+ Buat Laporan</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Data Laporan Masalah</CardTitle></CardHeader>
        <CardContent>
          {loading ? (<p>Loading...</p>) : reports.length === 0 ? (<p>Belum ada laporan masalah.</p>) : (
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>SPBU</TableHead><TableHead>User</TableHead><TableHead>Tanggal Laporan</TableHead><TableHead>Shift</TableHead><TableHead>Judul Laporan</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const reportDate = report.tanggalLaporan || report.tanggal;
                  return (
                    <TableRow key={report.id}>
                      <TableCell>{report.id}</TableCell><TableCell>{report.spbu?.code_spbu}</TableCell>
                      <TableCell>{report.user?.name}</TableCell>
                      <TableCell>{reportDate ? new Date(reportDate).toLocaleString("id-ID") : "-"}</TableCell>
                      <TableCell>{report.shift}</TableCell><TableCell>{report.judulLaporan}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(report)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(report.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {openAddModal && (<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 overflow-y-auto"><div className="bg-white rounded-2xl p-6 w-full max-w-2xl"><h2 className="text-xl font-semibold mb-4">Buat Laporan Masalah Baru</h2><div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-2">{renderFormFields()}</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setOpenAddModal(false)}>Batal</Button><Button onClick={handleAdd}>Simpan</Button></div></div></div>)}
      {openEditModal && editing && (<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 overflow-y-auto"><div className="bg-white rounded-2xl p-6 w-full max-w-2xl"><h2 className="text-xl font-semibold mb-4">Edit Laporan Masalah</h2><div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-2">{renderFormFields()}</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => { setOpenEditModal(false); setEditing(null); }}>Batal</Button><Button onClick={handleUpdate}>Simpan</Button></div></div></div>)}
    </div>
  );
}
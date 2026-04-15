import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Upload, CheckCircle, Clock, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
export default function Guide() {
  return <div className="min-h-screen bg-background islamic-pattern py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <Card className="shadow-lg border-primary/20 mb-8">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full gradient-islamic flex items-center justify-center mb-4">
              <HelpCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Panduan Pengguna
            </CardTitle>
            <CardDescription>
              Petunjuk lengkap penggunaan sistem submission skripsi
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Steps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Langkah-langkah Submission</h3>
              
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-islamic flex items-center justify-center text-primary-foreground font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Daftar / Masuk Akun</h4>
                    <p className="text-sm text-muted-foreground">
                      Buat akun baru atau masuk dengan akun yang sudah ada. Pastikan data diri Anda sudah benar.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-islamic flex items-center justify-center text-primary-foreground font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Klik Entry Skripsi</h4>
                    <p className="text-sm text-muted-foreground">
                      Dari halaman utama, klik tombol "Entry Skripsi" untuk memulai proses submission.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-islamic flex items-center justify-center text-primary-foreground font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Lengkapi Form</h4>
                    <p className="text-sm text-muted-foreground">
                      Isi semua data yang diminta: Nama, NIM, Email, dan Jurusan. Pastikan email valid karena akan digunakan untuk feedback.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-islamic flex items-center justify-center text-primary-foreground font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Upload File</h4>
                    <p className="text-sm text-muted-foreground">Upload file skripsi dalam format ZIP/rar. file wajib diisi.<strong>PDF</strong> dan <strong>Word (.doc/.docx)</strong>. Kedua file wajib diisi.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-islamic flex items-center justify-center text-primary-foreground font-bold text-sm">
                    5
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Kirim & Tunggu Review</h4>
                    <p className="text-sm text-muted-foreground">
                      Setelah submit, tunggu review dari admin. Status dan feedback dapat dilihat di halaman Profil.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Explanation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Status Submission</h3>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Menunggu Review</p>
                    <p className="text-xs text-yellow-600">Skripsi belum direview admin</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Sedang Direview</p>
                    <p className="text-xs text-blue-600">Admin sedang memeriksa</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Diterima</p>
                    <p className="text-xs text-green-600">Skripsi telah disetujui</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <Upload className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Ditolak</p>
                    <p className="text-xs text-red-600">Perlu revisi, lihat feedback</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">FAQ</h3>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Bagaimana jika lupa password?</AccordionTrigger>
                  <AccordionContent>
                    Silakan hubungi admin untuk reset password atau gunakan fitur lupa password pada halaman login.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Apakah bisa edit submission yang sudah dikirim?</AccordionTrigger>
                  <AccordionContent>
                    Submission yang sudah dikirim tidak dapat diedit. Jika perlu perubahan, silakan submit ulang dengan data yang benar.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Berapa lama proses review?</AccordionTrigger>
                  <AccordionContent>
                    Proses review biasanya memakan waktu 3-7 hari kerja. Anda akan mendapat notifikasi via email jika sudah ada feedback.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Format file apa saja yang diterima?</AccordionTrigger>
                  <AccordionContent>
                    File PDF untuk dokumen final dan file Word (.doc atau .docx) untuk dokumen yang dapat diedit. Kedua file wajib diupload.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
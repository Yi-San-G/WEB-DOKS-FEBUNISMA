import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileUp, ArrowLeft, FileText, Check, Archive } from "lucide-react";
import type { JurusanType } from "@/lib/auth";

export default function Submission() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [jurusan, setJurusan] = useState<JurusanType>("akuntansi");
  const [zipFile, setZipFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    if (profile) {
      setNama(profile.nama);
      setNim(profile.nim);
      setEmail(profile.email);
      setJurusan(profile.jurusan);
    }
  }, [user, profile, authLoading, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/zip", "application/x-zip-compressed", "application/x-rar-compressed", "application/vnd.rar"];
    const validExtensions = [".zip", ".rar"];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: "File Tidak Valid",
        description: "Mohon upload file ZIP atau RAR yang valid",
      });
      return;
    }

    setZipFile(file);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    // Store the file path (not public URL) since the bucket is now private
    const fileName = `${user?.id}/${folder}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("submissions")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    // Return the file path instead of public URL
    // Files will be accessed via signed URLs when needed
    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!zipFile) {
      toast({
        variant: "destructive",
        title: "File Belum Lengkap",
        description: "Mohon upload file ZIP/RAR",
      });
      return;
    }

    // Proper email validation using regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Email Tidak Valid",
        description: "Mohon masukkan email yang valid",
      });
      return;
    }

    setLoading(true);

    try {
      const fileUrl = await uploadFile(zipFile, "files");

      if (!fileUrl) {
        throw new Error("Gagal mengupload file");
      }

      const { error } = await supabase.from("submissions").insert({
        user_id: user?.id,
        nama,
        nim,
        email,
        jurusan,
        file_url: fileUrl,
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Skripsi berhasil disubmit!",
      });

      navigate("/profil");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Submit",
        description: err.message || "Terjadi kesalahan",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background islamic-pattern">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background islamic-pattern py-8 px-4">
      <div className="container max-w-2xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <Card className="shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full gradient-islamic flex items-center justify-center mb-4">
              <FileUp className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Form Submission Skripsi
            </CardTitle>
            <CardDescription>
              Lengkapi data dan upload file skripsi Anda
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nim">NIM</Label>
                  <Input
                    id="nim"
                    value={nim}
                    onChange={(e) => setNim(e.target.value.replace(/\D/g, ""))}
                    placeholder="Masukkan NIM"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jurusan">Jurusan</Label>
                  <Select value={jurusan} onValueChange={(v) => setJurusan(v as JurusanType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jurusan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="akuntansi">Akuntansi</SelectItem>
                      <SelectItem value="manajemen">Manajemen</SelectItem>
                      <SelectItem value="perbankan_syariah">Perbankan Syariah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">File Skripsi (ZIP/RAR) - wajib</Label>
                  <p className="text-sm text-muted-foreground">
                    Kompres semua file skripsi Anda ke dalam format ZIP atau RAR
                  </p>
                  <div className="relative">
                    <Input
                      id="file"
                      type="file"
                      accept=".zip,.rar"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                      required
                    />
                    {zipFile && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                        <Archive className="h-4 w-4" />
                        {zipFile.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-islamic hover:opacity-90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Kirim Submission
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
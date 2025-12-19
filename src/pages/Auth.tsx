import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { signUp, signIn, type JurusanType } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, GraduationCap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [jurusan, setJurusan] = useState<JurusanType>("akuntansi");
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Login Gagal",
            description: error.message === "Invalid login credentials" 
              ? "Email atau password salah" 
              : error.message,
          });
        } else {
          toast({ title: "Berhasil", description: "Selamat datang kembali!" });
          navigate("/");
        }
      } else {
        if (!nama || !nim || !jurusan) {
          toast({
            variant: "destructive",
            title: "Data Tidak Lengkap",
            description: "Mohon lengkapi semua field",
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp({ email, password, nama, nim, jurusan });
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Registrasi Gagal",
              description: "Email sudah terdaftar",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Registrasi Gagal",
              description: error.message,
            });
          }
        } else {
          toast({ title: "Berhasil", description: "Akun berhasil dibuat!" });
          navigate("/");
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan, silakan coba lagi",
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
    <div className="min-h-screen flex items-center justify-center bg-background islamic-pattern p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <Card className="shadow-lg border-primary/20">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full gradient-islamic flex items-center justify-center mb-2">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {isLogin ? "Masuk" : "Daftar Akun"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Masuk untuk mengakses E-Submission Skripsi" 
                : "Buat akun baru untuk memulai"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nim">NIM</Label>
                    <Input
                      id="nim"
                      value={nim}
                      onChange={(e) => setNim(e.target.value.replace(/\D/g, ""))}
                      placeholder="Masukkan NIM (angka saja)"
                      required={!isLogin}
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
                </>
              )}

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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-islamic hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Masuk" : "Daftar"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
              </span>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Daftar sekarang" : "Masuk"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
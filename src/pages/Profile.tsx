import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, User, Mail, BookOpen, Clock, FileText, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Submission {
  id: string;
  nama: string;
  nim: string;
  jurusan: string;
  email: string;
  status: string;
  feedback: string | null;
  created_at: string;
  pdf_url: string;
  word_url: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  reviewed: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "Menunggu Review",
  reviewed: "Sedang Direview",
  accepted: "Diterima",
  rejected: "Ditolak",
};

const jurusanLabels: Record<string, string> = {
  akuntansi: "Akuntansi",
  manajemen: "Manajemen",
  perbankan_syariah: "Perbankan Syariah",
};

export default function Profile() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchSubmissions() {
      if (!user) return;

      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSubmissions(data as Submission[]);
      }
      setLoadingSubmissions(false);
    }

    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background islamic-pattern">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background islamic-pattern py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        {/* Profile Card */}
        <Card className="shadow-lg border-primary/20 mb-8">
          <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24 rounded-full gradient-islamic flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {profile?.nama || "Nama Pengguna"}
            </CardTitle>
            <CardDescription>Profil Mahasiswa</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">NIM</p>
                  <p className="font-medium">{profile?.nim || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{profile?.email || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Jurusan</p>
                  <p className="font-medium">
                    {profile?.jurusan ? jurusanLabels[profile.jurusan] : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Submission</p>
                  <p className="font-medium">{submissions.length} submission</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <h2 className="text-xl font-bold text-foreground mb-4">Riwayat Submission</h2>

        {loadingSubmissions ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada submission</p>
              <Link 
                to="/submission" 
                className="text-primary hover:underline text-sm mt-2 inline-block"
              >
                Buat submission pertama Anda
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <Card key={sub.id} className="shadow border-primary/10">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(sub.created_at), "dd MMMM yyyy, HH:mm", { locale: id })}
                        </span>
                      </div>
                      <p className="font-medium">{jurusanLabels[sub.jurusan]}</p>
                    </div>

                    <Badge className={statusColors[sub.status]}>
                      {statusLabels[sub.status]}
                    </Badge>
                  </div>

                  {sub.feedback && (
                    <div className="mt-4 p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground mb-1">Feedback Admin:</p>
                      <p className="text-sm">{sub.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
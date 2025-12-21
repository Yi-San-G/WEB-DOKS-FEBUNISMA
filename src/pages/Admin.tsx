import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Menu, 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  History, 
  LogOut,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  Send,
  Check,
  Clock,
  Bell,
  Download,
  Trash2,
  ExternalLink,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Submission {
  id: string;
  user_id: string;
  nama: string;
  nim: string;
  jurusan: string;
  email: string;
  status: string;
  feedback: string | null;
  created_at: string;
  file_url: string;
  deleted_at: string | null;
}

const jurusanLabels: Record<string, string> = {
  akuntansi: "Akuntansi",
  manajemen: "Manajemen",
  perbankan_syariah: "Perbankan Syariah",
};

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedJurusan, setSelectedJurusan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "history" | "trash">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [sendingFeedback, setSendingFeedback] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/admin-auth");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchSubmissions();

    // Realtime subscription
    const channel = supabase
      .channel("submissions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        () => fetchSubmissions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setSubmissions(data as Submission[]);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Berhasil", description: "Anda telah keluar" });
    navigate("/");
  };

  const handleSendFeedback = async (submission: Submission) => {
    const feedback = feedbackText[submission.id];
    if (!feedback?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Mohon isi feedback terlebih dahulu",
      });
      return;
    }

    setSendingFeedback(submission.id);

    try {
      const fullFeedback = `Terima kasih atas data yang Anda kirimkan.\n\nHasil validasi dari admin adalah sebagai berikut:\n${feedback}`;

      // Send email via edge function
      const { data: emailData, error: emailError } = await supabase.functions.invoke(
        "send-feedback-email",
        {
          body: {
            to: submission.email,
            nama: submission.nama,
            nim: submission.nim,
            jurusan: submission.jurusan,
            feedback: fullFeedback,
          },
        }
      );

      if (emailError) {
        console.error("Email error:", emailError);
        throw new Error("Gagal mengirim email: " + emailError.message);
      }

      // Update submission in database
      const { error } = await supabase
        .from("submissions")
        .update({ 
          feedback: fullFeedback, 
          status: "reviewed" 
        })
        .eq("id", submission.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Email feedback terkirim ke ${submission.email}`,
      });

      setFeedbackText((prev) => ({ ...prev, [submission.id]: "" }));
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    } finally {
      setSendingFeedback(null);
    }
  };

  const handleAccept = async (submission: Submission) => {
    setAccepting(submission.id);

    try {
      const { error } = await supabase
        .from("submissions")
        .update({ status: "accepted" })
        .eq("id", submission.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Submission dari ${submission.nama} telah diterima dan diarsipkan ke ${jurusanLabels[submission.jurusan]}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    } finally {
      setAccepting(null);
    }
  };

  const handleDelete = async (submission: Submission) => {
    setDeleting(submission.id);

    try {
      const { error } = await supabase
        .from("submissions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", submission.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Data ${submission.nama} telah dipindahkan ke Sampah`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleRestore = async (submission: Submission) => {
    setRestoring(submission.id);

    try {
      const { error } = await supabase
        .from("submissions")
        .update({ deleted_at: null })
        .eq("id", submission.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Data ${submission.nama} telah dipulihkan`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (submission: Submission) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus permanen data ${submission.nama}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setDeleting(submission.id);

    try {
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submission.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Data ${submission.nama} telah dihapus permanen`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Gagal mengunduh file",
      });
    }
  };

  const pendingSubmissions = submissions.filter((s) => (s.status === "pending" || s.status === "reviewed") && !s.deleted_at);
  const acceptedSubmissions = submissions.filter((s) => s.status === "accepted" && !s.deleted_at);
  const trashedSubmissions = submissions.filter((s) => s.deleted_at);

  const filteredSubmissions = selectedJurusan
    ? acceptedSubmissions.filter((s) => s.jurusan === selectedJurusan)
    : activeTab === "pending"
    ? pendingSubmissions
    : activeTab === "trash"
    ? trashedSubmissions
    : acceptedSubmissions;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-white border-r border-blue-100 transition-all duration-300 flex flex-col shadow-sm`}>
        <div className="p-4 border-b border-blue-100 flex items-center justify-between">
          {sidebarOpen && <h2 className="font-bold text-blue-600">Admin Panel</h2>}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-blue-600"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            <Button
              variant={activeTab === "pending" && !selectedJurusan ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => { setActiveTab("pending"); setSelectedJurusan(null); }}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              {sidebarOpen && "Dashboard"}
            </Button>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {sidebarOpen && "Data Jurusan"}
                  </div>
                  {sidebarOpen && <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                {["akuntansi", "manajemen", "perbankan_syariah"].map((j) => (
                  <Button
                    key={j}
                    variant={selectedJurusan === j ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm"
                    onClick={() => { setSelectedJurusan(j); setActiveTab("history"); }}
                  >
                    {jurusanLabels[j]}
                    <Badge className="ml-auto" variant="outline">
                      {acceptedSubmissions.filter((s) => s.jurusan === j).length}
                    </Badge>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <Button
              variant={activeTab === "history" && !selectedJurusan ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => { setActiveTab("history"); setSelectedJurusan(null); }}
            >
              <History className="h-4 w-4 mr-2" />
              {sidebarOpen && "Riwayat"}
            </Button>

            <Button
              variant={activeTab === "trash" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => { setActiveTab("trash"); setSelectedJurusan(null); }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {sidebarOpen && "Sampah"}
              {trashedSubmissions.length > 0 && (
                <Badge className="ml-auto" variant="destructive">
                  {trashedSubmissions.length}
                </Badge>
              )}
            </Button>
          </nav>
        </ScrollArea>

        <div className="p-2 border-t border-blue-100">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {sidebarOpen && "Keluar"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-md">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Kelola Submission</h1>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm">
                Terdapat <strong>{pendingSubmissions.length}</strong> mahasiswa menunggu feedback Anda!
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <h2 className="text-lg font-semibold mb-4 text-slate-700">
            {selectedJurusan 
              ? `Arsip ${jurusanLabels[selectedJurusan]}`
              : activeTab === "pending" 
              ? "Submission Menunggu Review" 
              : activeTab === "trash"
              ? "Sampah"
              : "Semua Riwayat"}
          </h2>

          {filteredSubmissions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Tidak ada data</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((sub) => (
                <Card key={sub.id} className="shadow-sm border-blue-100 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Collapsed View */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
                          <div>
                            <p className="text-xs text-muted-foreground">Nama</p>
                            <p className="font-medium">{sub.nama}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">NIM</p>
                            <p className="font-medium">{sub.nim}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Jurusan</p>
                            <p className="font-medium">{jurusanLabels[sub.jurusan]}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium text-sm">{sub.email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Waktu</p>
                            <p className="font-medium text-sm">
                              {format(new Date(sub.created_at), "dd MMM yyyy, HH:mm", { locale: id })}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="ml-4">
                          {expandedId === sub.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          Perluas
                        </Button>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {expandedId === sub.id && (
                      <div className="p-4 border-t border-blue-100 bg-slate-50 space-y-4 animate-fade-in">
                        {/* File Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(sub.file_url, "_blank")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat File
                          </Button>

                          {/* Download button for archived/trash items */}
                          {(sub.status === "accepted" || sub.deleted_at) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(sub.file_url, `${sub.nim}_${sub.nama}.zip`)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Unduh File
                            </Button>
                          )}

                          {/* Trash view - Restore and Permanent Delete */}
                          {sub.deleted_at && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleRestore(sub)}
                                disabled={restoring === sub.id}
                              >
                                {restoring === sub.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                )}
                                Pulihkan
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handlePermanentDelete(sub)}
                                disabled={deleting === sub.id}
                              >
                                {deleting === sub.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Hapus Permanen
                              </Button>
                            </>
                          )}

                          {/* Archive view - Setorkan and Hapus */}
                          {sub.status === "accepted" && !sub.deleted_at && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open("#", "_self")}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Setorkan
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(sub)}
                                disabled={deleting === sub.id}
                              >
                                {deleting === sub.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Hapus
                              </Button>
                            </>
                          )}

                          {sub.status !== "accepted" && !sub.deleted_at && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const el = document.getElementById(`feedback-${sub.id}`);
                                  el?.focus();
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Kirim Feedback
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAccept(sub)}
                                disabled={accepting === sub.id}
                              >
                                {accepting === sub.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-2" />
                                )}
                                Terima
                              </Button>
                            </>
                          )}
                        </div>

                        {/* Feedback Section */}
                        {sub.status !== "accepted" && !sub.deleted_at && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Tulis Feedback:</p>
                            <div className="bg-white p-3 rounded-lg border">
                              <p className="text-sm text-muted-foreground mb-2">
                                Terima kasih atas data yang Anda kirimkan. Hasil validasi dari admin adalah sebagai berikut:
                              </p>
                              <Textarea
                                id={`feedback-${sub.id}`}
                                placeholder="Tulis komentar Anda di sini..."
                                value={feedbackText[sub.id] || ""}
                                onChange={(e) => 
                                  setFeedbackText((prev) => ({ ...prev, [sub.id]: e.target.value }))
                                }
                                rows={3}
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSendFeedback(sub)}
                              disabled={sendingFeedback === sub.id}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {sendingFeedback === sub.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              Kirim Feedback
                            </Button>
                          </div>
                        )}

                        {/* Existing Feedback */}
                        {sub.feedback && (
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                            <p className="text-xs text-blue-600 mb-1">Feedback yang sudah dikirim:</p>
                            <p className="text-sm whitespace-pre-wrap">{sub.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 text-center text-sm">
          <p className="font-arabic text-lg mb-1">بسم الله الرحمن الرحيم</p>
          <p className="opacity-90">Panel Admin E-Submission Skripsi</p>
        </footer>
      </main>
    </div>
  );
}
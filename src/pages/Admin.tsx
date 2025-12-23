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
  RotateCcw,
  X,
  Disc,
  BookOpen,
  FileCheck,
  ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  softfile_at: string | null;
  cetak_at: string | null;
  bebas_pustaka_at: string | null;
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
  const [activeTab, setActiveTab] = useState<"pending" | "history" | "trash" | "tanggungan">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [sendingFeedback, setSendingFeedback] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [expandedTanggungan, setExpandedTanggungan] = useState<string | null>(null);

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
        .update({ 
          status: "accepted",
          softfile_at: new Date().toISOString() // Auto-set softfile when accepted
        })
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

  const handleReject = async (submission: Submission) => {
    setRejecting(submission.id);

    try {
      const { error } = await supabase
        .from("submissions")
        .update({ status: "rejected" })
        .eq("id", submission.id);

      if (error) throw error;

      toast({
        title: "Ditolak",
        description: `Submission dari ${submission.nama} telah ditolak`,
        variant: "destructive",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    } finally {
      setRejecting(null);
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

  const handleToggleTanggungan = async (submissionId: string, field: "cetak_at" | "bebas_pustaka_at") => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    const currentValue = submission[field];
    const newValue = currentValue ? null : new Date().toISOString();

    try {
      const { error } = await supabase
        .from("submissions")
        .update({ [field]: newValue })
        .eq("id", submissionId);

      if (error) throw error;

      toast({
        title: newValue ? "Ditandai" : "Dibatalkan",
        description: `Status ${field === "cetak_at" ? "Cetak" : "Bebas Pustaka"} telah ${newValue ? "ditandai" : "dibatalkan"}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    }
  };

  // Filter submissions
  const pendingReviewSubmissions = submissions.filter((s) => (s.status === "pending" || s.status === "reviewed") && !s.deleted_at);
  const rejectedSubmissions = submissions.filter((s) => s.status === "rejected" && !s.deleted_at);
  const acceptedSubmissions = submissions.filter((s) => s.status === "accepted" && !s.deleted_at);
  const trashedSubmissions = submissions.filter((s) => s.deleted_at);
  
  // For history: show both accepted and rejected (sorted by updated time)
  const historySubmissions = submissions
    .filter((s) => (s.status === "accepted" || s.status === "rejected") && !s.deleted_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // For tanggungan pustaka: only accepted, sorted by name alphabetically
  const tanggunganSubmissions = [...acceptedSubmissions].sort((a, b) => a.nama.localeCompare(b.nama));

  const filteredSubmissions = selectedJurusan
    ? acceptedSubmissions.filter((s) => s.jurusan === selectedJurusan)
    : activeTab === "pending"
    ? [] // Will be handled separately with 2-column layout
    : activeTab === "trash"
    ? trashedSubmissions
    : activeTab === "history"
    ? historySubmissions
    : activeTab === "tanggungan"
    ? tanggunganSubmissions
    : acceptedSubmissions;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const renderSubmissionCard = (sub: Submission, showRejectedStyle = false) => (
    <Card 
      key={sub.id} 
      className={`shadow-sm overflow-hidden ${
        showRejectedStyle && sub.status === "rejected" 
          ? "border-red-300 bg-red-50" 
          : sub.status === "accepted" 
          ? "border-green-300 bg-green-50" 
          : "border-blue-100"
      }`}
    >
      <CardContent className="p-0">
        {/* Collapsed View */}
        <div 
          className={`p-4 cursor-pointer transition-colors ${
            showRejectedStyle && sub.status === "rejected"
              ? "hover:bg-red-100"
              : sub.status === "accepted"
              ? "hover:bg-green-100"
              : "hover:bg-slate-50"
          }`}
          onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
        >
        <div className="flex flex-col gap-3">
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Nama</p>
                <p className="font-medium truncate">{sub.nama}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">NIM</p>
                <p className="font-medium">{sub.nim}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Jurusan</p>
                <p className="font-medium truncate">{jurusanLabels[sub.jurusan]}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="font-medium text-sm truncate">{sub.email}</p>
              </div>
            </div>
            {/* Footer Row */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(sub.created_at), "dd MMM yyyy, HH:mm", { locale: id })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {sub.status === "rejected" && (
                  <Badge variant="destructive">Ditolak</Badge>
                )}
                {sub.status === "accepted" && (
                  <Badge className="bg-green-600">Diterima</Badge>
                )}
                <Button variant="outline" size="sm">
                  {expandedId === sub.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Perluas
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded View */}
        {expandedId === sub.id && (
          <div className={`p-4 border-t space-y-4 animate-fade-in ${
            showRejectedStyle && sub.status === "rejected"
              ? "border-red-200 bg-red-50"
              : sub.status === "accepted"
              ? "border-green-200 bg-green-100"
              : "border-blue-100 bg-slate-50"
          }`}>
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
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(sub)}
                    disabled={rejecting === sub.id}
                  >
                    {rejecting === sub.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Tolak
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
  );

  const isAllTanggunganComplete = (sub: Submission) => {
    return sub.softfile_at && sub.cetak_at && sub.bebas_pustaka_at;
  };

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

            <Button
              variant={activeTab === "tanggungan" && !selectedJurusan ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => { setActiveTab("tanggungan"); setSelectedJurusan(null); }}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              {sidebarOpen && "Tanggungan Pustaka"}
              {acceptedSubmissions.length > 0 && sidebarOpen && (
                <Badge className="ml-auto" variant="outline">
                  {acceptedSubmissions.length}
                </Badge>
              )}
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
            <div className="flex items-center gap-4">
              {pendingReviewSubmissions.length > 0 && (
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">
                    Terdapat <strong>{pendingReviewSubmissions.length}</strong> mahasiswa menunggu feedback Anda!
                  </span>
                </div>
              )}
              {rejectedSubmissions.length > 0 && (
                <div className="flex items-center gap-2 bg-red-500/80 rounded-lg px-4 py-2">
                  <X className="h-4 w-4" />
                  <span className="text-sm">
                    <strong>{rejectedSubmissions.length}</strong> laporan telah ditolak
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === "pending" && !selectedJurusan ? (
            // Two-column layout for pending submissions
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Pending/Reviewed */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Menunggu Review
                  <Badge variant="secondary">{pendingReviewSubmissions.length}</Badge>
                </h2>
                {pendingReviewSubmissions.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Tidak ada submission menunggu</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingReviewSubmissions.map((sub) => renderSubmissionCard(sub))}
                  </div>
                )}
              </div>

              {/* Right Column - Rejected */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2">
                  <X className="h-5 w-5" />
                  Laporan Ditolak
                  <Badge variant="destructive">{rejectedSubmissions.length}</Badge>
                </h2>
                {rejectedSubmissions.length === 0 ? (
                  <Card className="text-center py-12 border-red-200">
                    <CardContent>
                      <FileText className="h-12 w-12 mx-auto text-red-300 mb-4" />
                      <p className="text-muted-foreground">Tidak ada laporan ditolak</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {rejectedSubmissions.map((sub) => renderSubmissionCard(sub, true))}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "tanggungan" && !selectedJurusan ? (
            // Tanggungan Pustaka View
            <div>
              <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Tanggungan Pustaka
              </h2>
              {tanggunganSubmissions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Belum ada data tanggungan</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>NIM</TableHead>
                        <TableHead>Jurusan</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center">
                            <Disc className="h-4 w-4 mb-1" />
                            <span className="text-xs">Softfile</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center">
                            <BookOpen className="h-4 w-4 mb-1" />
                            <span className="text-xs">Cetak</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center">
                            <FileCheck className="h-4 w-4 mb-1" />
                            <span className="text-xs">Bebas Pustaka</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tanggunganSubmissions.map((sub, index) => (
                        <>
                          <TableRow key={sub.id} className="hover:bg-slate-50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{sub.nama}</TableCell>
                            <TableCell>{sub.nim}</TableCell>
                            <TableCell>{jurusanLabels[sub.jurusan]}</TableCell>
                            <TableCell className="text-sm">{sub.email}</TableCell>
                            <TableCell className="text-center">
                              <button
                                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors ${
                                  sub.softfile_at 
                                    ? "bg-green-500 border-green-600 text-white" 
                                    : "bg-white border-gray-300 text-gray-400"
                                }`}
                                disabled
                                title="Otomatis terisi saat diterima"
                              >
                                <Disc className="h-5 w-5" />
                              </button>
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                onClick={() => handleToggleTanggungan(sub.id, "cetak_at")}
                                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer hover:opacity-80 ${
                                  sub.cetak_at 
                                    ? "bg-green-500 border-green-600 text-white" 
                                    : "bg-white border-gray-300 text-gray-400 hover:border-green-400"
                                }`}
                                title={sub.cetak_at ? "Klik untuk membatalkan" : "Klik untuk menandai"}
                              >
                                <BookOpen className="h-5 w-5" />
                              </button>
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                onClick={() => handleToggleTanggungan(sub.id, "bebas_pustaka_at")}
                                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer hover:opacity-80 ${
                                  sub.bebas_pustaka_at 
                                    ? "bg-green-500 border-green-600 text-white" 
                                    : "bg-white border-gray-300 text-gray-400 hover:border-green-400"
                                }`}
                                title={sub.bebas_pustaka_at ? "Klik untuk membatalkan" : "Klik untuk menandai"}
                              >
                                <FileCheck className="h-5 w-5" />
                              </button>
                            </TableCell>
                            <TableCell className="text-center">
                              {isAllTanggunganComplete(sub) ? (
                                <button
                                  onClick={() => setExpandedTanggungan(expandedTanggungan === sub.id ? null : sub.id)}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2 mx-auto"
                                >
                                  <Check className="h-4 w-4" />
                                  Selesai
                                  {expandedTanggungan === sub.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-muted-foreground text-sm">Belum lengkap</span>
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedTanggungan === sub.id && isAllTanggunganComplete(sub) && (
                            <TableRow>
                              <TableCell colSpan={9} className="bg-green-50 border-t-0">
                                <div className="p-4 space-y-2">
                                  <p className="font-medium text-green-700">Waktu Penyelesaian:</p>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Disc className="h-4 w-4 text-green-600" />
                                      <span>Softfile: {sub.softfile_at && format(new Date(sub.softfile_at), "dd MMM yyyy, HH:mm", { locale: id })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="h-4 w-4 text-green-600" />
                                      <span>Cetak: {sub.cetak_at && format(new Date(sub.cetak_at), "dd MMM yyyy, HH:mm", { locale: id })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <FileCheck className="h-4 w-4 text-green-600" />
                                      <span>Bebas Pustaka: {sub.bebas_pustaka_at && format(new Date(sub.bebas_pustaka_at), "dd MMM yyyy, HH:mm", { locale: id })}</span>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          ) : activeTab === "history" && !selectedJurusan ? (
            // History/Log View
            <div>
              <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
                <History className="h-5 w-5" />
                Riwayat Aktivitas
              </h2>
              {historySubmissions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Belum ada riwayat</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {historySubmissions.map((sub) => renderSubmissionCard(sub, true))}
                </div>
              )}
            </div>
          ) : (
            // Default view for other tabs
            <>
              <h2 className="text-lg font-semibold mb-4 text-slate-700">
                {selectedJurusan 
                  ? `Arsip ${jurusanLabels[selectedJurusan]}`
                  : activeTab === "trash"
                  ? "Sampah"
                  : "Semua Data"}
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
                  {filteredSubmissions.map((sub) => renderSubmissionCard(sub, true))}
                </div>
              )}
            </>
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

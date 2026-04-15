import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Menu, FileText, User, Shield, BookOpen, LogOut, GraduationCap, Sparkles } from "lucide-react";
import logoUnisma from "@/assets/logo-unisma.png";
import { AnimatedText, AnimatedLetter, AnimatedWord } from "@/components/AnimatedText";

export default function Index() {
  const {
    user,
    profile,
    isAdmin
  } = useAuth();
  const {
    toast
  } = useToast();
  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Berhasil",
      description: "Anda telah keluar"
    });
  };
  return <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full gradient-islamic text-primary-foreground py-4 px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">DOKS
          </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20">
                <Menu className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user ? <>
                  <DropdownMenuItem asChild>
                    <Link to="/profil" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profil Saya
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="h-4 w-4" />
                        Panel Admin
                      </Link>
                    </DropdownMenuItem>}
                  <DropdownMenuItem asChild>
                    <Link to="/panduan" className="flex items-center gap-2 cursor-pointer">
                      <BookOpen className="h-4 w-4" />
                      Panduan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </> : <>
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Masuk Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin-auth" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="h-4 w-4" />
                      Masuk Admin
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/panduan" className="flex items-center gap-2 cursor-pointer">
                      <BookOpen className="h-4 w-4" />
                      Panduan
                    </Link>
                  </DropdownMenuItem>
                </>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          {/* Decorative Element */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Optimalisasi Validator
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            <AnimatedText text="Selamat Datang di Website" />
            <span className="block mt-2">
              <AnimatedLetter letter="D" className="text-primary" />
              <AnimatedLetter letter="O" className="text-accent" />
              <AnimatedLetter letter="K" className="text-primary" />
              <AnimatedLetter letter="S" className="text-accent" />
            </span>
          </h1>

          <p className="text-lg mb-6 max-w-xl mx-auto">
            <AnimatedWord word="Deposit" className="text-primary font-semibold" />{" "}
            <AnimatedWord word="Online" className="text-accent font-semibold" />{" "}
            <AnimatedWord word="Karya" className="text-primary font-semibold" />{" "}
            <AnimatedWord word="Skripsi" className="text-accent font-semibold" />{" "}
            <AnimatedText text="FEB UNSIMA" className="text-muted-foreground" />
          </p>

          {/* Logo UNISMA */}
          <div className="mb-8">
            <img 
              src={logoUnisma} 
              alt="Logo UNISMA" 
              className="h-32 sm:h-40 md:h-48 mx-auto object-contain"
            />
          </div>

          {/* Entry Skripsi Button */}
          <Link to={user ? "/submission" : "/auth"}>
            <Button size="lg" className="gradient-islamic hover:opacity-90 transition-all text-lg px-8 py-6 h-auto rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              <FileText className="mr-2 h-5 w-5" />
              Entry Skripsi
            </Button>
          </Link>

          {user && profile && <p className="mt-6 text-sm text-muted-foreground">
              Selamat datang kembali, <span className="font-medium text-primary">{profile.nama}</span>
            </p>}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full gradient-islamic text-primary-foreground py-6 px-6">
        <div className="container mx-auto text-center">
          <p className="font-arabic text-xl mb-2">بسم الله الرحمن الرحيم</p>
          <p className="text-sm opacity-90">Komitmen untuk Masa Depan</p>
          <p className="text-xs opacity-70 mt-2">© 2024 Deposit Online Karya Skripsi. All rights reserved.</p>
        </div>
      </footer>
    </div>;
}
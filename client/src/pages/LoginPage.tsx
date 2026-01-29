import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login falhou");
      }
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({ email, password });
      toast({ title: "Bem-vindo!", description: "Sessão iniciada com sucesso." });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1612] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#1a1612] border-[#c4a57b] text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <img src="/assets/logo.webp" alt="AlphaSafe Logo" className="h-32 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#c4a57b]">
            Iniciar Sessão
          </CardTitle>
          <CardDescription className="text-gray-400">
            Introduza as suas credenciais para aceder ao sistema interno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                placeholder="exemplo@alphasafe.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/50 border-white/10 h-11 focus:border-[#c4a57b] transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Palavra-passe</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/50 border-white/10 h-11 focus:border-[#c4a57b] transition-colors"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#c4a57b] hover:bg-[#b3946a] text-black font-bold h-11 mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-400">
                Não tem conta?{" "}
                <Link href="/register" className="text-[#c4a57b] hover:underline">
                  Registar-se
                </Link>
              </p>
            </div>
            <div className="text-center mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-gray-500 italic">
                Acesso restrito a funcionários autorizados da AlphaSafe.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

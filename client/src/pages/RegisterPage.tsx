import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Registo falhou");
      }
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As palavras-passe não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Erro",
        description: "A palavra-passe deve ter pelo menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      await registerMutation.mutateAsync({ email, password, firstName, lastName });
      toast({
        title: "Conta criada!",
        description: "Bem-vindo ao AlphaSafe.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no registo",
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
            Criar Conta
          </CardTitle>
          <CardDescription className="text-gray-400">
            Registe-se com um e-mail autorizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  type="text"
                  placeholder="João"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-black/50 border-white/10 h-11 focus:border-[#c4a57b] transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Apelido</label>
                <Input
                  type="text"
                  placeholder="Silva"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-black/50 border-white/10 h-11 focus:border-[#c4a57b] transition-colors"
                  required
                />
              </div>
            </div>
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
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar Palavra-passe</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black/50 border-white/10 h-11 focus:border-[#c4a57b] transition-colors"
                minLength={8}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#c4a57b] hover:bg-[#b3946a] text-black font-bold h-11 mt-2"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Registar"
              )}
            </Button>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-400">
                Já tem conta?{" "}
                <Link href="/login" className="text-[#c4a57b] hover:underline">
                  Iniciar sessão
                </Link>
              </p>
            </div>
            <div className="text-center mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-gray-500 italic">
                Apenas e-mails autorizados podem criar conta.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

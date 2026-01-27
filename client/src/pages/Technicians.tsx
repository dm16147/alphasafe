import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserPlus, Trash2, Calendar, UserCheck, UserMinus, Umbrella, Stethoscope, Pencil, Search, Filter, Mail, Bell, Briefcase, UserCog } from "lucide-react";
import { format } from "date-fns";
import type { Technician } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function TechnicianModal({ 
  open, 
  onOpenChange, 
  technician 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  technician?: Technician | null 
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("technician");
  const [receiveAssignment, setReceiveAssignment] = useState(true);
  const [receiveBilling, setReceiveBilling] = useState(false);
  const [receiveAssistance, setReceiveAssistance] = useState(true);
  const [active, setActive] = useState("Ativo");
  const [createdAt, setCreatedAt] = useState("");
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");
  const [sickLeaveStart, setSickLeaveStart] = useState("");
  const [sickLeaveEnd, setSickLeaveEnd] = useState("");
  const [terminationDate, setTerminationDate] = useState("");

  useEffect(() => {
    if (open) {
      if (technician) {
        setName(technician.name);
        setEmail(technician.email || "");
        setRole(technician.role || "technician");
        setReceiveAssignment(technician.receiveAssignmentNotifications ?? true);
        setReceiveBilling(technician.receiveBillingNotifications ?? false);
        setReceiveAssistance(technician.receiveAssistanceNotifications ?? true);
        setActive(technician.active);
        setCreatedAt(technician.createdAt ? format(new Date(technician.createdAt), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
        setVacationStart(technician.vacationStart ? format(new Date(technician.vacationStart), "yyyy-MM-dd") : "");
        setVacationEnd(technician.vacationEnd ? format(new Date(technician.vacationEnd), "yyyy-MM-dd") : "");
        setSickLeaveStart(technician.sickLeaveStart ? format(new Date(technician.sickLeaveStart), "yyyy-MM-dd") : "");
        setSickLeaveEnd(technician.sickLeaveEnd ? format(new Date(technician.sickLeaveEnd), "yyyy-MM-dd") : "");
        setTerminationDate(technician.terminationDate ? format(new Date(technician.terminationDate), "yyyy-MM-dd") : "");
      } else {
        setName("");
        setEmail("");
        setRole("technician");
        setReceiveAssignment(true);
        setReceiveBilling(false);
        setReceiveAssistance(true);
        setActive("Ativo");
        setCreatedAt(format(new Date(), "yyyy-MM-dd"));
        setVacationStart("");
        setVacationEnd("");
        setSickLeaveStart("");
        setSickLeaveEnd("");
        setTerminationDate("");
      }
    }
  }, [technician, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const data = { 
        name, 
        email: email || null,
        role,
        receiveAssignmentNotifications: receiveAssignment,
        receiveBillingNotifications: receiveBilling,
        receiveAssistanceNotifications: receiveAssistance,
        active, 
        createdAt,
        vacationStart: vacationStart || null,
        vacationEnd: vacationEnd || null,
        sickLeaveStart: sickLeaveStart || null,
        sickLeaveEnd: sickLeaveEnd || null,
        terminationDate: terminationDate || null,
      };
      if (technician) {
        await apiRequest("PUT", `/api/technicians/${technician.id}`, data);
      } else {
        await apiRequest("POST", "/api/technicians", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      onOpenChange(false);
      toast({ title: technician ? "Funcionário atualizado" : "Funcionário adicionado" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>{technician ? "Editar Funcionário" : "Adicionar Funcionário"}</DialogTitle>
          <DialogDescription>
            Configure os detalhes e preferências de notificação do funcionário.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="bg-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Cargo</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border-border shadow-md z-50">
                  <SelectItem value="technician">Técnico</SelectItem>
                  <SelectItem value="office">Administração</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="bg-white" />
          </div>

          <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Preferências de Notificação
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-assignment" className="text-xs cursor-pointer">Atribuição de Intervenções</Label>
                <Switch id="notify-assignment" checked={receiveAssignment} onCheckedChange={setReceiveAssignment} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-assistance" className="text-xs cursor-pointer">Pedidos de Assistência</Label>
                <Switch id="notify-assistance" checked={receiveAssistance} onCheckedChange={setReceiveAssistance} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-billing" className="text-xs cursor-pointer">Estado "A Faturar"</Label>
                <Switch id="notify-billing" checked={receiveBilling} onCheckedChange={setReceiveBilling} />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={active} onValueChange={setActive}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border-border shadow-md z-50">
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Férias">Férias</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Data de Registo</Label>
              <Input id="date" type="date" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} className="bg-white" />
            </div>
            {active === "Inativo" && (
              <div className="grid gap-2">
                <Label htmlFor="termDate">Data de Saída</Label>
                <Input id="termDate" type="date" value={terminationDate} onChange={(e) => setTerminationDate(e.target.value)} className="bg-white" />
              </div>
            )}
          </div>

          {active === "Férias" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vacStart">Início Férias</Label>
                <Input id="vacStart" type="date" value={vacationStart} onChange={(e) => setVacationStart(e.target.value)} className="bg-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vacEnd">Fim Férias</Label>
                <Input id="vacEnd" type="date" value={vacationEnd} onChange={(e) => setVacationEnd(e.target.value)} className="bg-white" />
              </div>
            </div>
          )}

          {active === "Baixa" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sickStart">Início Baixa</Label>
                <Input id="sickStart" type="date" value={sickLeaveStart} onChange={(e) => setSickLeaveStart(e.target.value)} className="bg-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sickEnd">Fim Baixa</Label>
                <Input id="sickEnd" type="date" value={sickLeaveEnd} onChange={(e) => setSickLeaveEnd(e.target.value)} className="bg-white" />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name || mutation.isPending}>
            {mutation.isPending ? "A guardar..." : (technician ? "Atualizar" : "Adicionar")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Technicians() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const itemsPerPage = 6;
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [techToDelete, setTechToDelete] = useState<number | null>(null);

  const { data: technicians, isLoading } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const filteredTechs = technicians?.filter(tech => {
    const matchesName = tech.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || tech.active === statusFilter;
    return matchesName && matchesStatus;
  }) || [];

  const sortedTechs = [...filteredTechs].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA; // Most recent first
  });

  const totalPages = Math.ceil(sortedTechs.length / itemsPerPage);
  const paginatedTechs = sortedTechs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/technicians/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      toast({ title: "Funcionário removido com sucesso" });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Ativo": return <UserCheck className="w-4 h-4 text-green-500" />;
      case "Férias": return <Umbrella className="w-4 h-4 text-blue-500" />;
      case "Baixa": return <Stethoscope className="w-4 h-4 text-orange-500" />;
      default: return <UserMinus className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleEdit = (tech: Technician) => {
    if (user?.role !== 'admin') return;
    setSelectedTech(tech);
    setModalOpen(true);
  };

  const handleAdd = () => {
    if (user?.role !== 'admin') return;
    setSelectedTech(null);
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 animate-slide-in">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pt-12 lg:pt-0">
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Funcionários</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Gestão de equipa e preferências de notificação</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar por nome..." 
                className="pl-9 w-full sm:w-[200px] bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white border-border shadow-sm">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border border-border shadow-xl z-[9999]">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativos</SelectItem>
                <SelectItem value="Férias">Férias</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>

            {user?.role === 'admin' && (
              <Button onClick={handleAdd} className="shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Funcionário
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
            ))
          ) : paginatedTechs?.map((tech) => (
            <div key={tech.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary text-xl font-bold">
                    {tech.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg truncate" title={tech.name}>{tech.name}</h3>
                      {tech.role === 'office' ? (
                        <div title="Administração"><Briefcase className="w-3 h-3 text-primary" /></div>
                      ) : (
                        <div title="Técnico"><UserCog className="w-3 h-3 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {tech.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{tech.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tech.active)}
                        <span className="text-sm font-medium">{tech.active}</span>
                      </div>
                      {tech.active === "Férias" && tech.vacationStart && tech.vacationEnd && (
                        <div className="text-[10px] text-blue-600 font-medium">
                          {format(new Date(tech.vacationStart), "dd/MM/yyyy")} - {format(new Date(tech.vacationEnd), "dd/MM/yyyy")}
                        </div>
                      )}
                      {tech.active === "Baixa" && tech.sickLeaveStart && tech.sickLeaveEnd && (
                        <div className="text-[10px] text-orange-600 font-medium">
                          {format(new Date(tech.sickLeaveStart), "dd/MM/yyyy")} - {format(new Date(tech.sickLeaveEnd), "dd/MM/yyyy")}
                        </div>
                      )}
                      {tech.active === "Inativo" && tech.terminationDate && (
                        <div className="text-[10px] text-gray-500 font-medium">
                          Saída: {format(new Date(tech.terminationDate), "dd/MM/yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-start">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(tech)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setTechToDelete(tech.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {tech.receiveAssignmentNotifications && (
                  <div className="flex items-center gap-1 text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full">
                    <Bell className="w-2.5 h-2.5" />
                    Atribuições
                  </div>
                )}
                {tech.receiveAssistanceNotifications && (
                  <div className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                    <Bell className="w-2.5 h-2.5" />
                    Assistências
                  </div>
                )}
                {tech.receiveBillingNotifications && (
                  <div className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                    <Bell className="w-2.5 h-2.5" />
                    Faturação
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border">
                <Calendar className="w-4 h-4" />
                <span>Membro desde: {tech.createdAt ? format(new Date(tech.createdAt), "dd/MM/yyyy") : "-"}</span>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </main>

      {user?.role === 'admin' && (
        <>
          <TechnicianModal 
            open={modalOpen} 
            onOpenChange={setModalOpen} 
            technician={selectedTech} 
          />

          <AlertDialog open={techToDelete !== null} onOpenChange={(open) => !open && setTechToDelete(null)}>
            <AlertDialogContent className="bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle>Remover Funcionário</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem a certeza que deseja remover este funcionário? Esta ação não pode ser revertida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (techToDelete) {
                      deleteMutation.mutate(techToDelete);
                      setTechToDelete(null);
                    }
                  }}
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
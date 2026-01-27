import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useInterventions } from "@/hooks/use-interventions";
import { Plus, Filter, Calendar, Wrench, Image as ImageIcon, Trash2, Download, Search, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { InterventionModal } from "@/components/InterventionModal";
import { ClientModal } from "@/components/ClientModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Technician } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
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

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [interventionToDelete, setInterventionToDelete] = useState<number | null>(null);
  const [viewingPhotos, setViewingPhotos] = useState<any[] | null>(null);
  const { toast } = useToast();

  const { data: interventions, isLoading, error } = useInterventions({ 
    status: statusFilter === "all" ? undefined : statusFilter 
  });

  const deleteInterventionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/interventions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
      toast({ title: "Intervenção removida com sucesso" });
    },
  });

  // Client-side filtering and sorting
  const filteredInterventions = interventions?.filter(intervention => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      intervention.client.name.toLowerCase().includes(searchLower) ||
      intervention.client.nif.includes(searchLower)
    );
  }) || [];

  const sortedInterventions = [...filteredInterventions].sort((a, b) => {
    if (statusFilter === "Assistência") {
      if (a.assistanceDate && b.assistanceDate) {
        return new Date(a.assistanceDate).getTime() - new Date(b.assistanceDate).getTime();
      }
      if (a.assistanceDate) return -1;
      if (b.assistanceDate) return 1;
    }
    // Default sorting (usually by ID or most recent)
    return b.id - a.id;
  });

  const totalPages = Math.ceil(sortedInterventions.length / itemsPerPage);
  const paginatedInterventions = sortedInterventions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const { data: technicians } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/photos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
      // Update viewing photos locally
      if (viewingPhotos) {
        setViewingPhotos(prev => prev ? prev.filter(p => p.id !== p.id) : null);
        // Better to just close and let the user reopen or wait for cache
        setViewingPhotos(null);
      }
      toast({ title: "Foto removida" });
    },
  });

  const downloadPhoto = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await apiRequest("PUT", `/api/interventions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
    },
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: async ({ id, technician }: { id: number, technician: string }) => {
      await apiRequest("PUT", `/api/interventions/${id}`, { technician });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
    },
  });

  const handleEdit = (intervention: any) => {
    setSelectedIntervention(intervention);
    setIsInterventionModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedIntervention(null);
    setIsInterventionModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 animate-slide-in">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pt-12 lg:pt-0">
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Intervenções Técnicas</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Gestão centralizada de avarias e assistência</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar..." 
                className="pl-9 w-full sm:w-[250px] bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white border-border shadow-sm">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-xl z-[9999]">
                <SelectItem value="all" className="focus:bg-muted focus:text-foreground text-sm">Todos</SelectItem>
                <SelectItem value="Em curso" className="focus:bg-muted focus:text-foreground text-sm">Em curso</SelectItem>
                <SelectItem value="A faturar" className="focus:bg-muted focus:text-foreground text-sm">A faturar</SelectItem>
                <SelectItem value="Concluído" className="focus:bg-muted focus:text-foreground text-sm">Concluído</SelectItem>
                <SelectItem value="Assistência" className="focus:bg-muted focus:text-foreground text-sm">Assistência</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsClientModalOpen(true)} className="flex-1">
                <Plus className="w-4 h-4 mr-1" />
                Cliente
              </Button>

              <Button size="sm" onClick={handleCreate} className="flex-1 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-1" />
                Intervenção
              </Button>
            </div>
          </div>
        </header>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center text-destructive">
              Não foi possível carregar as intervenções.
            </div>
          ) : sortedInterventions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center p-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-bold">Sem intervenções</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-6">Não existem intervenções para os filtros selecionados.</p>
              <Button onClick={handleCreate}>Criar Intervenção</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                    <tr>
                      <th className="px-3 md:px-4 py-4">Cliente</th>
                      <th className="px-3 md:px-4 py-4">NIF</th>
                      <th className="px-3 md:px-4 py-4">Morada</th>
                      <th className="px-3 md:px-4 py-4">Contacto</th>
                      <th className="px-3 md:px-4 py-4">E-mail</th>
                      <th className="px-3 md:px-4 py-4">Serviço Contratado</th>
                      <th className="px-3 md:px-4 py-4">Equipamento(s)</th>
                      <th className="px-3 md:px-4 py-4">Nº de Série</th>
                      <th className="px-3 md:px-4 py-4">Estado</th>
                      <th className="px-3 md:px-4 py-4">Registo da Assistência</th>
                      <th className="px-3 md:px-4 py-4">Fotos</th>
                      <th className="px-3 md:px-4 py-4">Técnico</th>
                      <th className="px-3 md:px-4 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedInterventions.map((intervention) => (
                      <tr key={intervention.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-3 md:px-4 py-4 font-semibold">{intervention.client.name}</td>
                        <td className="px-3 md:px-4 py-4 text-[10px] md:text-xs font-mono">{intervention.client.nif}</td>
                        <td className="px-3 md:px-4 py-4 max-w-[150px] truncate" title={intervention.client.address || ""}>{intervention.client.address || "-"}</td>
                        <td className="px-3 md:px-4 py-4">{intervention.client.phone}</td>
                        <td className="px-3 md:px-4 py-4 text-[10px] md:text-xs">{intervention.client.email}</td>
                        <td className="px-3 md:px-4 py-4 max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(intervention.serviceType) 
                              ? intervention.serviceType.map((type: string) => (
                                  <span key={type} className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium border border-border/50">
                                    {type}
                                  </span>
                                ))
                              : <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium border border-border/50">{intervention.serviceType}</span>
                            }
                          </div>
                        </td>
                        <td className="px-3 md:px-4 py-4">{intervention.equipmentModel}</td>
                        <td className="px-3 md:px-4 py-4 text-[10px] md:text-xs font-mono">{intervention.serialNumber}</td>
                        <td className="px-3 md:px-4 py-4">
                          <Select 
                            value={intervention.status} 
                            onValueChange={(val) => updateStatusMutation.mutate({ id: intervention.id, status: val })}
                          >
                            <SelectTrigger className="w-[120px] md:w-[130px] h-8 text-[10px] md:text-xs border-none bg-transparent hover:bg-muted focus:ring-0 p-0">
                              <StatusBadge status={intervention.status} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-border shadow-xl z-[9999]">
                              <SelectItem value="Em curso" className="text-xs focus:bg-muted focus:text-foreground">Em curso</SelectItem>
                              <SelectItem value="A faturar" className="text-xs focus:bg-muted focus:text-foreground">A faturar</SelectItem>
                              <SelectItem value="Concluído" className="text-xs focus:bg-muted focus:text-foreground">Concluído</SelectItem>
                              <SelectItem value="Assistência" className="text-xs focus:bg-muted focus:text-foreground">Assistência</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 md:px-4 py-4 text-[10px] md:text-xs">
                          {intervention.assistanceDate ? format(new Date(intervention.assistanceDate), "dd/MM HH:mm") : "-"}
                        </td>
                        <td className="px-3 md:px-4 py-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 relative"
                            onClick={() => setViewingPhotos(intervention.photos)}
                            disabled={!intervention.photos || intervention.photos.length === 0}
                          >
                            <ImageIcon className="h-4 w-4" />
                            {intervention.photos && intervention.photos.length > 0 && (
                              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center border-2 border-background">
                                {intervention.photos.length}
                              </span>
                            )}
                          </Button>
                        </td>
                        <td className="px-3 md:px-4 py-4">
                          <Select 
                            value={intervention.technician} 
                            onValueChange={(val) => updateTechnicianMutation.mutate({ id: intervention.id, technician: val })}
                          >
                            <SelectTrigger className="w-[120px] md:w-[140px] h-8 text-[10px] md:text-xs border-none bg-transparent hover:bg-muted focus:ring-0">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                  {intervention.technician?.charAt(0).toUpperCase()}
                                </div>
                                <SelectValue placeholder="Técnico" />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-border shadow-xl z-[9999]">
                              {technicians?.map((tech) => {
                                const targetDate = intervention.assistanceDate 
                                  ? startOfDay(new Date(intervention.assistanceDate)) 
                                  : startOfDay(new Date());
                                  
                                let isUnavailable = false;
                                let unavailableReason = tech.active;

                                if (tech.active === "Inativo") {
                                  if (tech.terminationDate) {
                                    isUnavailable = targetDate >= startOfDay(new Date(tech.terminationDate));
                                  } else {
                                    isUnavailable = true;
                                  }
                                } else if (tech.active === "Férias" && tech.vacationStart && tech.vacationEnd) {
                                  isUnavailable = isWithinInterval(targetDate, {
                                    start: startOfDay(new Date(tech.vacationStart)),
                                    end: endOfDay(new Date(tech.vacationEnd))
                                  });
                                } else if (tech.active === "Baixa" && tech.sickLeaveStart && tech.sickLeaveEnd) {
                                  isUnavailable = isWithinInterval(targetDate, {
                                    start: startOfDay(new Date(tech.sickLeaveStart)),
                                    end: endOfDay(new Date(tech.sickLeaveEnd))
                                  });
                                }

                                const isDisabled = isUnavailable;

                                return (
                                  <SelectItem 
                                    key={tech.id} 
                                    value={tech.name} 
                                    className={cn(
                                      "text-xs focus:bg-muted focus:text-foreground",
                                      isDisabled && "opacity-50 grayscale pointer-events-none bg-muted/20"
                                    )}
                                    disabled={isDisabled}
                                  >
                                    {tech.name} {isDisabled ? `(${unavailableReason})` : ""}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 md:px-4 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleEdit(intervention)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => setInterventionToDelete(intervention.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
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

      <InterventionModal 
        open={isInterventionModalOpen} 
        onOpenChange={setIsInterventionModalOpen}
        intervention={selectedIntervention}
      />

      <ClientModal 
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
      />

      <Dialog open={!!viewingPhotos} onOpenChange={(open) => !open && setViewingPhotos(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fotos da Intervenção</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {viewingPhotos?.map((photo) => (
              <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden border">
                <img src={photo.url} className="w-full h-full object-cover" alt="Intervenção" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => downloadPhoto(photo.url, `foto-${photo.id}.png`)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => {
                      if (confirm("Tem a certeza que deseja remover esta foto?")) {
                        deletePhotoMutation.mutate(photo.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={interventionToDelete !== null} onOpenChange={(open) => !open && setInterventionToDelete(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Intervenção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja remover esta intervenção? Esta ação não pode ser revertida e todas as fotos associadas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (interventionToDelete) {
                  deleteInterventionMutation.mutate(interventionToDelete);
                  setInterventionToDelete(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { insertInterventionSchema } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/use-clients";
import { useCreateIntervention, useUpdateIntervention } from "@/hooks/use-interventions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Technician } from "@shared/schema";
import { Camera, Loader2, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const SERVICE_TYPES = [
  "Videoporteiro",
  "Videovigilância",
  "Alarme",
  "Domótica",
  "Controlo de acessos",
  "Sistemas de Segurança Contra Incêndios"
];

const interventionFormSchema = insertInterventionSchema.extend({
  clientId: z.coerce.number().min(1, "Selecione um cliente"),
  serviceType: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  assistanceDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
});

type FormData = z.infer<typeof interventionFormSchema>;

interface InterventionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention?: any;
}

export function InterventionModal({ open, onOpenChange, intervention }: InterventionModalProps) {
  const { data: clients } = useClients();
  const queryClient = useQueryClient();
  const { data: technicians } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });
  const createMutation = useCreateIntervention();
  const updateMutation = useUpdateIntervention();
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(interventionFormSchema),
    defaultValues: {
      clientId: 0,
      serviceType: [],
      equipmentModel: "",
      serialNumber: "",
      status: "Em curso",
      technician: "",
      notes: "",
      assistanceDate: null,
    },
  });

  useEffect(() => {
    // Only reset form when modal opens or intervention ID changes
    // This prevents re-focusing fields when photo count changes or other updates occur
    if (open) {
      const currentId = intervention?.id;
      const assistanceDateObj = intervention?.assistanceDate ? new Date(intervention.assistanceDate) : null;
      form.reset({
        clientId: intervention?.clientId || 0,
        serviceType: Array.isArray(intervention?.serviceType) ? intervention.serviceType : (intervention?.serviceType ? [intervention.serviceType] : []),
        equipmentModel: intervention?.equipmentModel || "",
        serialNumber: intervention?.serialNumber || "",
        status: intervention?.status || "Em curso",
        technician: intervention?.technician || "",
        notes: intervention?.notes || "",
        assistanceDate: assistanceDateObj ? format(assistanceDateObj, "yyyy-MM-dd'T'HH:mm") : null,
      } as any);
    }
  }, [open, intervention?.id, form]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !intervention) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          await apiRequest("POST", "/api/photos", {
            interventionId: intervention.id,
            url: base64
          });
          // Invalidate but don't force reset the whole form
          queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
          setIsUploading(false);
        } catch (uploadError) {
          console.error("Upload request failed", uploadError);
          setIsUploading(false);
        }
      };
      reader.onerror = (err) => {
        console.error("FileReader error", err);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Photo upload failed", error);
      setIsUploading(false);
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const formattedData = {
        ...data,
        assistanceDate: data.assistanceDate ? new Date(data.assistanceDate as any).toISOString() : null
      };
      
      if (intervention) {
        await updateMutation.mutateAsync({ id: intervention.id, ...formattedData } as any);
      } else {
        await createMutation.mutateAsync(formattedData as any);
      }
      
      setTimeout(() => {
        form.reset();
      }, 300);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background">
        <DialogHeader>
          <DialogTitle>{intervention ? "Editar Intervenção" : "Nova Intervenção"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da intervenção técnica abaixo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Cliente</Label>
              <Select 
                onValueChange={(val) => form.setValue("clientId", parseInt(val))}
                value={form.watch("clientId")?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border shadow-md z-[100]">
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()} className="focus:bg-muted focus:text-foreground">
                      {client.name} ({client.nif})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 col-span-2">
              <Label>Tipos de Serviço</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 border rounded-lg bg-muted/20">
                {SERVICE_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`service-${type}`}
                      checked={form.watch("serviceType")?.includes(type)}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("serviceType") || [];
                        if (checked) {
                          form.setValue("serviceType", [...current, type]);
                        } else {
                          form.setValue("serviceType", current.filter(t => t !== type));
                        }
                      }}
                    />
                    <label 
                      htmlFor={`service-${type}`}
                      className="text-xs font-medium leading-none cursor-pointer"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
              {form.formState.errors.serviceType && (
                <p className="text-[10px] text-destructive">{form.formState.errors.serviceType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select 
                onValueChange={(val) => form.setValue("status", val)}
                value={form.watch("status")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado atual" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border shadow-md z-[100]">
                  <SelectItem value="Em curso" className="focus:bg-muted focus:text-foreground">Em curso</SelectItem>
                  <SelectItem value="A faturar" className="focus:bg-muted focus:text-foreground">A faturar</SelectItem>
                  <SelectItem value="Concluído" className="focus:bg-muted focus:text-foreground">Concluído</SelectItem>
                  <SelectItem value="Assistência" className="focus:bg-muted focus:text-foreground">Assistência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipamento (Modelo)</Label>
              <Input {...form.register("equipmentModel")} placeholder="Ex: Hikvision DS-2CD..." />
            </div>

            <div className="space-y-2">
              <Label>Nº Série (Opcional)</Label>
              <Input {...form.register("serialNumber")} placeholder="S/N..." />
            </div>

            <div className="space-y-2">
              <Label>Técnico</Label>
              <Select 
                onValueChange={(val) => form.setValue("technician", val)}
                value={form.watch("technician")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o técnico" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border shadow-md z-[100]">
                  {technicians?.map((tech) => {
                    const assistanceDateStr = form.watch("assistanceDate");
                    const targetDate = assistanceDateStr ? startOfDay(new Date(assistanceDateStr)) : startOfDay(new Date());
                    
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
                        disabled={isDisabled}
                        className={cn(
                          "focus:bg-muted focus:text-foreground",
                          isDisabled && "opacity-50 grayscale pointer-events-none bg-muted/20"
                        )}
                      >
                        {tech.name} {isDisabled ? `(${unavailableReason})` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Data e Hora da Assistência (Se aplicável)</Label>
              <Input 
                type="datetime-local" 
                {...form.register("assistanceDate")} 
                autoComplete="off"
                className="focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0 focus:border-input"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Fotos da Intervenção</Label>
              {intervention && (
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                    Adicionar Foto
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    As fotos podem ser visualizadas e geridas na galeria do dashboard.
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Notas / Observações</Label>
              <Textarea 
                {...form.register("notes")} 
                placeholder="Detalhes adicionais sobre a intervenção..."
                className="h-24 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              disabled={isPending}
              onClick={() => {
                // Manually trigger submit and close
                onOpenChange(false);
                form.handleSubmit(onSubmit)();
              }}
            >
              {isPending ? "A guardar..." : (intervention ? "Atualizar" : "Criar Intervenção")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

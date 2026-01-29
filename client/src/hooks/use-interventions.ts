import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertIntervention, UpdateInterventionRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface InterventionFilters {
  status?: string;
  technician?: string;
  clientId?: number;
}

export function useInterventions(filters?: InterventionFilters) {
  return useQuery({
    queryKey: [api.interventions.list.path, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "all") params.append("status", filters.status);
      if (filters?.technician) params.append("technician", filters.technician);
      if (filters?.clientId) params.append("clientId", String(filters.clientId));

      const url = `${api.interventions.list.path}?${params.toString()}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch interventions");
      return api.interventions.list.responses[200].parse(await res.json());
    },
  });
}

export function useIntervention(id: number) {
  return useQuery({
    queryKey: [api.interventions.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.interventions.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch intervention");
      return api.interventions.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateIntervention() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertIntervention) => {
      // Ensure numeric fields are numbers, even if form passes strings
      const payload = {
        ...data,
        clientId: Number(data.clientId),
      };

      const validated = api.interventions.create.input.parse(payload);
      
      const res = await fetch(api.interventions.create.path, {
        method: api.interventions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.interventions.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create intervention");
      }
      return api.interventions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.interventions.list.path] });
      toast({
        title: "Sucesso",
        description: "Intervenção criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateIntervention() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateInterventionRequest) => {
      const validated = api.interventions.update.input.parse(updates);
      const url = buildUrl(api.interventions.update.path, { id });
      
      const res = await fetch(url, {
        method: api.interventions.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to update intervention" }));
        throw new Error(errorData.message || "Failed to update intervention");
      }
      return api.interventions.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.interventions.list.path] });
      toast({
        title: "Sucesso",
        description: "Intervenção atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { insertClientSchema } from "@shared/schema";

const clientFormSchema = insertClientSchema.extend({
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  nif: z.string().min(9, "NIF deve ter 9 dígitos").max(9, "NIF deve ter 9 dígitos"),
});

type FormData = z.infer<typeof clientFormSchema>;

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
}

export function ClientModal({ open, onOpenChange, client }: ClientModalProps) {
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  
  const form = useForm<FormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      nif: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    if (client) {
      form.reset(client);
    } else {
      form.reset({
        name: "",
        nif: "",
        address: "",
        phone: "",
        email: "",
      });
    }
  }, [client, open, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (client) {
        await updateMutation.mutateAsync({ id: client.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            Adicione as informações de contacto e fiscais do cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Cliente <span className="text-destructive">*</span></Label>
            <Input {...form.register("name")} placeholder="Ex: Nome ou Empresa Lda." />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NIF <span className="text-destructive">*</span></Label>
              <Input {...form.register("nif")} placeholder="123456789" />
              {form.formState.errors.nif && (
                <p className="text-sm text-destructive">{form.formState.errors.nif.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input {...form.register("phone")} placeholder="+351..." />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input {...form.register("email")} type="email" placeholder="email@exemplo.com" />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Morada Completa</Label>
            <Input {...form.register("address")} placeholder="Rua..." />
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "A guardar..." : (client ? "Atualizar" : "Criar Cliente")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

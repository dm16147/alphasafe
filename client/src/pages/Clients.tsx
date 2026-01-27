import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients } from "@/hooks/use-clients";
import { Plus, Search, MapPin, Phone, Mail } from "lucide-react";
import { ClientModal } from "@/components/ClientModal";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  
  const { data: clients, isLoading, error } = useClients(search);

  const totalPages = Math.ceil((clients?.length || 0) / itemsPerPage);
  const paginatedClients = clients?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 animate-slide-in">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-12 lg:pt-0">
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Clientes</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Gerir base de dados de clientes</p>
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
            <Button onClick={handleCreate} className="shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Erro ao carregar clientes. Tente novamente.
          </div>
        ) : clients?.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-border">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground mt-2 mb-6">Comece por adicionar o seu primeiro cliente.</p>
            <Button onClick={handleCreate}>Adicionar Cliente</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedClients?.map((client) => (
                <div 
                  key={client.id}
                  onClick={() => handleEdit(client)}
                  className="group bg-card hover:bg-white hover:scale-[1.02] transition-all duration-300 border border-border p-6 rounded-2xl shadow-sm hover:shadow-lg cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {client.name}
                      </h3>
                      <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded mt-2 inline-block">
                        NIF: {client.nif}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary/60" />
                      <span className="truncate">{client.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary/60" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary/60" />
                      <span className="truncate">{client.email}</span>
                    </div>
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
          </>
        )}
      </main>

      <ClientModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        client={selectedClient}
      />
    </div>
  );
}

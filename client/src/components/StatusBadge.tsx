import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  "Em curso": { 
    label: "Em curso", 
    className: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground" 
  },
  "A faturar": { 
    label: "A faturar", 
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" 
  },
  "Concluído": { 
    label: "Concluído", 
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" 
  },
  "Assistência": { 
    label: "Assistência", 
    className: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800" 
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig["Em curso"];
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      config.className
    )}>
      {config.label}
    </span>
  );
}

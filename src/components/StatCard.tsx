import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export default function StatCard({ title, value, subtitle, icon: Icon, trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          trend === "up" && "bg-primary/15 text-primary",
          trend === "down" && "bg-destructive/15 text-destructive",
          (!trend || trend === "neutral") && "bg-secondary text-muted-foreground"
        )}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={cn(
        "text-2xl font-heading font-bold",
        trend === "up" && "text-primary",
        trend === "down" && "text-destructive",
      )}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  );
}

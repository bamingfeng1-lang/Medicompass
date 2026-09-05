import {
  MessageSquare,
  Video,
  Zap,
  BedDouble,
  UserPlus,
  HeartHandshake,
  Home,
  BadgePercent,
  Users,
  Stethoscope,
  Plane,
  CreditCard,
  Search,
  UserRound,
  ClipboardList,
  PlaneLanding,
  Activity,
  Sparkles,
  Leaf,
  Droplet,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  MessageSquare,
  Video,
  Zap,
  BedDouble,
  UserPlus,
  HeartHandshake,
  Home,
  BadgePercent,
  Users,
  Stethoscope,
  Plane,
  CreditCard,
  Search,
  UserRound,
  ClipboardList,
  PlaneLanding,
  Activity,
  Sparkles,
  Leaf,
  Droplet,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? HeartPulse;
  return <Icon className={className} />;
}

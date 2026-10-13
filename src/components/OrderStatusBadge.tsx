import { Badge } from "@/components/ui/badge";
import { Clock, Flame, CheckCircle2, XCircle } from "lucide-react";

export function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="gold" className="flex items-center gap-1.5 py-1 px-3">
          <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          <span>Chờ quầy bar nhận</span>
        </Badge>
      );
    case "preparing":
      return (
        <Badge className="bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 py-1 px-3">
          <Flame className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
          <span>Đang pha chế</span>
        </Badge>
      );
    case "served":
      return (
        <Badge variant="success" className="flex items-center gap-1.5 py-1 px-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Đã phục vụ</span>
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="destructive" className="flex items-center gap-1.5 py-1 px-3">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Đã hủy</span>
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

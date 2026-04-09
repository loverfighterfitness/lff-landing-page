/**
 * Shop Orders Tab — order management for admin panel.
 * Shows all shop orders with status toggles and expandable item details.
 */
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp, Package, Truck, Check } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  unfulfilled: { label: "Unfulfilled", bg: "#fef9c3", text: "#92400e", icon: Package },
  shipped:     { label: "Shipped",     bg: "#dbeafe", text: "#1d4ed8", icon: Truck },
  delivered:   { label: "Delivered",   bg: "#dcfce7", text: "#15803d", icon: Check },
} as const;

type OrderStatus = keyof typeof statusConfig;

function Badge({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: bg, color: text }}>
      {children}
    </span>
  );
}

function OrderCard({ order }: { order: any }) {
  const utils = trpc.useUtils();
  const [expanded, setExpanded] = useState(false);

  const updateStatus = trpc.shop.updateOrderStatus.useMutation({
    onSuccess: () => {
      utils.shop.getOrders.invalidate();
      toast.success("Order status updated");
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const cfg = statusConfig[order.status as OrderStatus] ?? statusConfig.unfulfilled;
  const shippingAddr = order.shippingAddress ? JSON.parse(order.shippingAddress) : null;

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(0,0,0,0.25)", border: "1px solid rgba(234,230,210,0.25)" }}>
      {/* Row 1: Customer + status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-black text-lg" style={{ color: "#EAE6D2" }}>{order.customerName}</div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: "rgba(234,230,210,0.75)" }}>
            {order.customerEmail}
          </div>
          <div className="text-xs font-medium mt-1" style={{ color: "rgba(234,230,210,0.55)" }}>
            {new Date(order.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge bg={cfg.bg} text={cfg.text}>{cfg.label}</Badge>
          <span className="text-sm font-black" style={{ color: "#EAE6D2" }}>
            ${(order.total / 100).toFixed(2)}
          </span>
          {order.isShipping && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(234,230,210,0.6)" }}>
              <Truck size={11} /> Shipping
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Status toggle buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(Object.entries(statusConfig) as [OrderStatus, typeof statusConfig[OrderStatus]][]).map(([key, scfg]) => {
          const isActive = order.status === key;
          const Icon = scfg.icon;
          return (
            <button
              key={key}
              onClick={() => updateStatus.mutate({ id: order.id, status: key })}
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all"
              style={{
                backgroundColor: isActive ? scfg.bg : "transparent",
                color: isActive ? scfg.text : "rgba(234,230,210,0.7)",
                borderColor: isActive ? scfg.text + "60" : "rgba(234,230,210,0.3)",
              }}
            >
              <Icon size={11} />
              {scfg.label}
            </button>
          );
        })}

        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border transition-all"
          style={{
            backgroundColor: expanded ? "rgba(234,230,210,0.15)" : "transparent",
            color: "rgba(234,230,210,0.7)",
            borderColor: "rgba(234,230,210,0.25)",
          }}
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {order.items?.length ?? 0} item(s)
        </button>
      </div>

      {/* Expandable: Order items + shipping address */}
      {expanded && (
        <div className="pt-2 space-y-2" style={{ borderTop: "1px solid rgba(234,230,210,0.15)" }}>
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm" style={{ color: "rgba(234,230,210,0.85)" }}>
              <div>
                <span className="font-bold">{item.quantity}x</span> {item.productName}
                {item.variant && <span className="text-xs ml-1" style={{ color: "rgba(234,230,210,0.5)" }}>({item.variant})</span>}
              </div>
              <span className="font-mono text-xs" style={{ color: "rgba(234,230,210,0.6)" }}>
                ${(item.unitPrice / 100).toFixed(2)}
              </span>
            </div>
          ))}

          {/* Shipping address */}
          {shippingAddr && (
            <div className="mt-2 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "rgba(234,230,210,0.7)" }}>
              <span className="font-bold">Ship to: </span>
              {[shippingAddr.line1, shippingAddr.line2, shippingAddr.city, shippingAddr.state, shippingAddr.postal_code].filter(Boolean).join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ShopOrdersTab() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const { data: orders, isLoading } = trpc.shop.getOrders.useQuery(
    statusFilter === "all" ? undefined : { status: statusFilter }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" size={24} style={{ color: "#EAE6D2" }} />
      </div>
    );
  }

  const unfulfilled = orders?.filter((o) => o.status === "unfulfilled").length ?? 0;
  const shipped = orders?.filter((o) => o.status === "shipped").length ?? 0;
  const delivered = orders?.filter((o) => o.status === "delivered").length ?? 0;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Unfulfilled", value: unfulfilled, accent: false, danger: unfulfilled > 0 },
          { label: "Shipped", value: shipped, accent: false },
          { label: "Delivered", value: delivered, accent: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: stat.danger ? "rgba(234,179,8,0.2)" : stat.accent ? "#EAE6D2" : "rgba(0,0,0,0.25)",
              color: stat.danger ? "#fbbf24" : stat.accent ? "#54412F" : "#EAE6D2",
              border: stat.danger ? "1px solid rgba(234,179,8,0.3)" : stat.accent ? "none" : "1px solid rgba(234,230,210,0.2)",
            }}
          >
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-xs font-bold mt-0.5" style={{ opacity: 0.75 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-4">
        {(["all", "unfulfilled", "shipped", "delivered"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className="text-xs font-bold px-3 py-1 rounded-full transition-all capitalize"
            style={{
              backgroundColor: statusFilter === filter ? "rgba(234,230,210,0.15)" : "transparent",
              color: statusFilter === filter ? "#EAE6D2" : "rgba(234,230,210,0.55)",
              border: `1px solid ${statusFilter === filter ? "rgba(234,230,210,0.3)" : "rgba(234,230,210,0.15)"}`,
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {(!orders || orders.length === 0) ? (
        <div className="text-center py-24 rounded-2xl" style={{ backgroundColor: "rgba(234,230,210,0.08)" }}>
          <p className="text-4xl mb-4">📦</p>
          <p className="text-xl font-black mb-2" style={{ color: "#EAE6D2" }}>No orders yet</p>
          <p className="text-sm font-medium" style={{ color: "rgba(234,230,210,0.65)" }}>
            Orders will appear here when customers complete checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </>
  );
}

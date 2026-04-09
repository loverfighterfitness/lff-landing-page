/**
 * Shop Inventory Tab — stock levels with inline edit for admin panel.
 */
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

function Badge({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: bg, color: text }}>
      {children}
    </span>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge bg="#fde8e8" text="#b91c1c">Out of Stock</Badge>;
  if (stock <= 3) return <Badge bg="#fef9c3" text="#92400e">{stock} left</Badge>;
  if (stock <= 10) return <Badge bg="#fef9c3" text="#92400e">{stock}</Badge>;
  return <Badge bg="#dcfce7" text="#15803d">{stock}</Badge>;
}

function VariantRow({ variant, productName }: { variant: any; productName: string }) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [stockValue, setStockValue] = useState(variant.stock);

  const updateStock = trpc.shop.updateStock.useMutation({
    onSuccess: () => {
      setEditing(false);
      utils.shop.getStock.invalidate();
      toast.success("Stock updated");
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const label = [variant.colour, variant.size].filter(Boolean).join(" / ") || "Default";

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold" style={{ color: "#EAE6D2" }}>
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <button
              onClick={() => setStockValue(Math.max(0, stockValue - 1))}
              className="p-1 rounded-full transition-colors"
              style={{ backgroundColor: "rgba(234,230,210,0.1)", color: "#EAE6D2" }}
            >
              <Minus size={12} />
            </button>
            <input
              type="number"
              value={stockValue}
              onChange={(e) => setStockValue(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-14 text-center text-sm font-bold rounded-lg py-1 border focus:outline-none"
              style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "#EAE6D2", borderColor: "rgba(234,230,210,0.3)" }}
            />
            <button
              onClick={() => setStockValue(stockValue + 1)}
              className="p-1 rounded-full transition-colors"
              style={{ backgroundColor: "rgba(234,230,210,0.1)", color: "#EAE6D2" }}
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => updateStock.mutate({ variantId: variant.id, stock: stockValue })}
              disabled={updateStock.isPending}
              className="text-xs font-bold px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: "#EAE6D2", color: "#54412F" }}
            >
              {updateStock.isPending ? <Loader2 size={12} className="animate-spin" /> : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setStockValue(variant.stock); }}
              className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{ color: "rgba(234,230,210,0.6)", border: "1px solid rgba(234,230,210,0.2)" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <StockBadge stock={variant.stock} />
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-bold px-2 py-1 rounded-lg transition-colors"
              style={{ color: "rgba(234,230,210,0.6)", border: "1px solid rgba(234,230,210,0.2)" }}
            >
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const categoryLabels: Record<string, string> = {
  tee: "Tees",
  socks: "Socks",
  straps: "Straps",
  cuffs: "Cuffs",
  bundle: "Bundles",
};

export default function ShopInventoryTab() {
  const { data: products, isLoading } = trpc.shop.getStock.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" size={24} style={{ color: "#EAE6D2" }} />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-24 rounded-2xl" style={{ backgroundColor: "rgba(234,230,210,0.08)" }}>
        <p className="text-4xl mb-4">📦</p>
        <p className="text-xl font-black mb-2" style={{ color: "#EAE6D2" }}>No products</p>
        <p className="text-sm font-medium" style={{ color: "rgba(234,230,210,0.65)" }}>
          Run the seed script to populate shop products.
        </p>
      </div>
    );
  }

  // Calculate totals
  const totalStock = products.reduce(
    (sum, p) => sum + p.variants.reduce((vs, v) => vs + v.stock, 0),
    0
  );
  const lowStock = products.reduce(
    (sum, p) => sum + p.variants.filter((v) => v.stock > 0 && v.stock <= 3).length,
    0
  );
  const outOfStock = products.reduce(
    (sum, p) => sum + p.variants.filter((v) => v.stock === 0).length,
    0
  );

  // Group by category
  const byCategory = new Map<string, typeof products>();
  for (const p of products) {
    const existing = byCategory.get(p.category) ?? [];
    existing.push(p);
    byCategory.set(p.category, existing);
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Units", value: totalStock, accent: true },
          { label: "Low Stock", value: lowStock, danger: lowStock > 0 },
          { label: "Out of Stock", value: outOfStock, danger: outOfStock > 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: stat.danger ? "rgba(185,28,28,0.2)" : stat.accent ? "#EAE6D2" : "rgba(0,0,0,0.25)",
              color: stat.danger ? "#fca5a5" : stat.accent ? "#54412F" : "#EAE6D2",
              border: stat.danger ? "1px solid rgba(185,28,28,0.3)" : stat.accent ? "none" : "1px solid rgba(234,230,210,0.2)",
            }}
          >
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-xs font-bold mt-0.5" style={{ opacity: 0.75 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Products by category */}
      <div className="space-y-6">
        {Array.from(byCategory.entries()).map(([category, categoryProducts]) => (
          <div key={category}>
            <div className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "rgba(234,230,210,0.75)" }}>
              {categoryLabels[category] ?? category}
            </div>

            <div className="space-y-3">
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl p-4"
                  style={{ backgroundColor: "rgba(0,0,0,0.25)", border: "1px solid rgba(234,230,210,0.25)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-black text-base" style={{ color: "#EAE6D2" }}>
                        {product.name}
                      </span>
                      <span className="ml-2 text-xs font-mono" style={{ color: "rgba(234,230,210,0.5)" }}>
                        ${(product.price / 100).toFixed(2)}
                      </span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "rgba(234,230,210,0.4)" }}>
                      {product.variants.reduce((s, v) => s + v.stock, 0)} total
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {product.variants.map((variant) => (
                      <VariantRow key={variant.id} variant={variant} productName={product.name} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

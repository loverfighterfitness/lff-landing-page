/**
 * Payment Link order reconstruction.
 *
 * Shop checkouts that go through static Stripe Payment Links (the
 * Instagram-safe checkout path — see Shop.tsx PAYMENT_LINKS) create
 * checkout sessions WITHOUT the `type: "shop_order"` / `items_json`
 * metadata that server-created sessions carry. Both the webhook and the
 * admin Backfill previously filtered on that metadata, so payment-link
 * orders never landed in shop_orders.
 *
 * This helper rebuilds cart items for those sessions from the real
 * Stripe line items instead of metadata.
 */
import Stripe from "stripe";

export type CartItem = {
  id: string;
  name: string;
  price: number; // dollars — matches the items_json convention
  priceId: string;
  quantity: number;
};

/** Slugify a Stripe product name into a cart-item-style id, e.g. "LFF Crew Socks — Brown" -> "crew-socks-brown" */
function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/lff/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fetch the session's line items from Stripe and map them into the same
 * shape items_json uses, so all downstream code (DB insert, emails,
 * notifications) works unchanged.
 */
export async function cartItemsFromLineItems(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<CartItem[]> {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 20,
    expand: ["data.price.product"],
  });

  // The shop appends the buyer's cart item id (e.g. "tee-brown-L") to the
  // payment link URL as client_reference_id. When present, use it as the
  // item id so variant parsing and stock decrement work exactly like
  // server-created cart checkouts. Payment links are single-product, so
  // one reference id covers the session.
  const refId = session.client_reference_id;

  return lineItems.data.map((li) => {
    const product = li.price?.product;
    const name =
      (product && typeof product !== "string" && !("deleted" in product && product.deleted)
        ? (product as Stripe.Product).name
        : null) ??
      li.description ??
      "Shop item";
    return {
      id: refId && lineItems.data.length === 1 ? refId : slugFromName(name),
      name,
      price: (li.price?.unit_amount ?? 0) / 100,
      priceId: li.price?.id ?? "",
      quantity: li.quantity ?? 1,
    };
  });
}

/**
 * Variant text from payment-link custom fields (e.g. a size/colour
 * dropdown configured on the link), since payment-link sessions have no
 * cart-item id to parse a variant from.
 */
export function variantFromCustomFields(
  session: Stripe.Checkout.Session
): string | null {
  const fields = session.custom_fields ?? [];
  const values = fields
    .map((f) => {
      if (f.type === "dropdown") {
        // Prefer the human label of the selected option
        const selected = f.dropdown?.options?.find(
          (o) => o.value === f.dropdown?.value
        );
        return selected?.label ?? f.dropdown?.value ?? null;
      }
      if (f.type === "text") return f.text?.value ?? null;
      if (f.type === "numeric") return f.numeric?.value ?? null;
      return null;
    })
    .filter((v): v is string => !!v);
  return values.length ? values.join(" / ") : null;
}

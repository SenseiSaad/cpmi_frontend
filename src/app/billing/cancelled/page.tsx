import { redirect } from "next/navigation";

/** Stripe Checkout returns here when the buyer cancels. */
export default function Page() {
  redirect("/agency/orders?checkout=cancelled");
}

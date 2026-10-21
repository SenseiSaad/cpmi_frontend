import { redirect } from "next/navigation";

/** Stripe Checkout returns here after payment; access is granted once Stripe confirms it. */
export default function Page() {
  redirect("/agency/orders?checkout=success");
}

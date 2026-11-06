import { redirect } from "next/navigation";

/** Old address form: /verify/<certificate number>. Send it to the real verification page. */
export default function LegacyVerifyRedirect({ params }: { params: { id: string } }) {
  redirect(`/verify?number=${encodeURIComponent(decodeURIComponent(params.id))}`);
}

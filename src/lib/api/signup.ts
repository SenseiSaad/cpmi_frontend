import { http } from "./client";

/**
 * Ask to register a new agency. The server always answers the same way, whether or not the address is already
 * known, and emails a link; the account only exists once that link is followed.
 */
export async function registerAgency(input: { agencyName: string; email: string; termsAccepted: true; website?: string }): Promise<void> {
  await http("POST", "/api/public/agency-signup", input);
}

// Clients log in with just a Client Code, no real email required.
// Internally, Supabase Auth still needs an email-shaped identifier,
// so we derive one deterministically. It's never shown to the client
// and never used to actually send mail.
export function clientCodeToLoginEmail(clientCode: string) {
  return `${clientCode.trim().toLowerCase()}@clients.fcapp.internal`;
}

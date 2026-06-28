# Roadmap

## Now

- Maintain parity with the SmartBill adapter previously shipped from the Voyant
  monorepo.
- Keep the standalone package installable against published Voyant packages.
- Preserve the existing client, plugin, Hono, sync, invoice UI, mock, and
  workflow exports.

## Next

- Add a small consumer fixture app for release verification.
- Document supported SmartBill API behaviors and error handling in more detail.
- Add migration notes for Voyant apps switching from workspace dependency to
  npm dependency.

## Later

- Split vendor-neutral e-invoicing seams from SmartBill-specific behavior if a
  second e-invoicing provider needs the same runtime contract.

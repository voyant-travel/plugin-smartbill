# Contributing

This repo publishes `@voyant-travel/plugin-smartbill`, the SmartBill
e-invoicing adapter for Voyant.

## Scope

- SmartBill API client and validation.
- Package-owned Finance invoice event subscriber runtime and persistence mapping.
- Optional Hono admin route wiring.
- Optional invoice detail UI helpers.
- SmartBill sync, artifact, reconciliation, and proforma conversion workflows.

Out of scope: finance core semantics and generic Node database, storage, and
configuration adapters. Those stay in the consuming Voyant app or framework
packages; SmartBill-specific event handling stays here.

## Working Rules

- Keep vendor-specific SmartBill behavior in this adapter package.
- Keep public exports intentional and documented in the package README.
- Preserve optional React/UI dependencies as optional peers.
- Prefer narrow helpers over widening Voyant core contracts.

## Before Opening A PR

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

## Releases

Add a changeset (`pnpm changeset`) for any user-visible package change. CI opens
a release PR; merging it publishes to npm.

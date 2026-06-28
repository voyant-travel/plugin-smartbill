# @voyant-travel/plugin-smartbill

Standalone workspace for Voyant's SmartBill e-invoicing adapter.

The published package lives in [`packages/smartbill`](./packages/smartbill) and
ships:

- SmartBill REST client helpers
- finance invoice event subscribers
- optional Hono admin sync routes
- optional React invoice detail UI helpers
- scheduler-agnostic reconciliation and proforma conversion workflows
- local SmartBill-compatible test mocks

## Install

```sh
pnpm add @voyant-travel/plugin-smartbill
```

## Develop

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

Package-level usage and export documentation is in
[`packages/smartbill/README.md`](./packages/smartbill/README.md).

Releases are managed with [Changesets](https://github.com/changesets/changesets):
add one with `pnpm changeset`, then `pnpm release` publishes.

## License

Apache-2.0. See [LICENSE](./LICENSE).

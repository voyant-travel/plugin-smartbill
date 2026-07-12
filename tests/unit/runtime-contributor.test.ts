import type { VoyantRuntimeHostPrimitives } from "@voyant-travel/core"
import type {
  FinanceInvoiceSettlementPollerProvider,
  InvoiceSettlementPollerContext,
} from "@voyant-travel/finance"
import { describe, expect, it, vi } from "vitest"

import type { SmartbillRuntimeHost } from "../../src/graph-runtime.js"
import {
  createSmartbillRuntimePortContribution,
  resolveSmartbillRuntimeConfig,
} from "../../src/runtime-contributor.js"

const configuredEnv = {
  SMARTBILL_USERNAME: " billing@example.test ",
  SMARTBILL_API_TOKEN: " preferred-secret ",
  SMARTBILL_TOKEN: " compatibility-secret ",
  SMARTBILL_COMPANY_VAT_CODE: " RO12345678 ",
  SMARTBILL_SERIES_NAME: " SB ",
  SMARTBILL_INVOICE_SERIES_NAME: " INV ",
  SMARTBILL_PROFORMA_SERIES_NAME: " PRO ",
  SMARTBILL_API_URL: " https://smartbill.test/api ",
  SMARTBILL_LANGUAGE: " RO ",
  SMARTBILL_ART_311_SPECIAL_REGIME: "true",
}

function createPrimitives(
  env: VoyantRuntimeHostPrimitives["env"] = () => configuredEnv,
): VoyantRuntimeHostPrimitives {
  return {
    env,
    database: {
      resolve: vi.fn(() => ({ database: true })),
      fromContext: vi.fn(() => ({})),
      transaction: vi.fn(async (_bindings, operation) => operation({})),
    },
    storage: {
      resolve: vi.fn(() => ({ storage: true })),
      read: vi.fn(async () => null),
      downloadUrl: vi.fn(async () => null),
    },
    events: { deliver: vi.fn(async () => undefined) },
    config: { read: vi.fn(() => undefined) },
  }
}

describe("SmartBill runtime contributor", () => {
  it("maps trimmed deployment config with compatibility aliases and optionals", () => {
    expect(resolveSmartbillRuntimeConfig(configuredEnv)).toEqual({
      username: "billing@example.test",
      apiToken: "preferred-secret",
      companyVatCode: "RO12345678",
      seriesName: "INV",
      invoiceSeriesName: "INV",
      proformaSeriesName: "PRO",
      apiUrl: "https://smartbill.test/api",
      language: "RO",
      art311SpecialRegime: true,
    })
    expect(
      resolveSmartbillRuntimeConfig({
        ...configuredEnv,
        SMARTBILL_API_TOKEN: " ",
        SMARTBILL_INVOICE_SERIES_NAME: " ",
        SMARTBILL_ART_311_SPECIAL_REGIME: "false",
      }),
    ).toMatchObject({
      apiToken: "compatibility-secret",
      seriesName: "SB",
      art311SpecialRegime: false,
    })
    expect(resolveSmartbillRuntimeConfig({})).toBeNull()
    expect(
      resolveSmartbillRuntimeConfig({
        ...configuredEnv,
        SMARTBILL_ART_311_SPECIAL_REGIME: " true ",
      }),
    ).toMatchObject({ art311SpecialRegime: false })
  })

  it("constructs the SmartBill host from primitives and contributes Finance settlement", () => {
    const bindings = { request: true }
    const primitives = createPrimitives()
    const contribution = createSmartbillRuntimePortContribution({ primitives })
    const host = contribution["smartbill.runtime-host"] as SmartbillRuntimeHost
    const settlement = contribution[
      "finance.invoice-settlement-poller"
    ] as FinanceInvoiceSettlementPollerProvider

    expect(Object.keys(contribution).sort()).toEqual([
      "finance.invoice-settlement-poller",
      "smartbill.runtime-host",
    ])
    expect(host.resolveConfig(bindings)).toEqual(resolveSmartbillRuntimeConfig(configuredEnv))
    expect(host.resolveDatabase(bindings)).toEqual({ database: true })
    expect(host.resolveDocumentStorage?.(bindings)).toEqual({ storage: true })
    expect(primitives.env).toHaveBeenCalledWith(bindings)
    expect(primitives.database.resolve).toHaveBeenCalledWith(bindings)
    expect(primitives.storage.resolve).toHaveBeenCalledWith(bindings)
    expect(settlement).toEqual({ provider: "smartbill", poller: expect.any(Function) })
  })

  it("resolves settlement config from invocation bindings and reports missing config", async () => {
    const firstBindings = { request: 1 }
    const secondBindings = { request: 2 }
    const env = vi.fn(() => ({}))
    const contribution = createSmartbillRuntimePortContribution({
      primitives: createPrimitives(env),
    })
    const { poller } = contribution[
      "finance.invoice-settlement-poller"
    ] as FinanceInvoiceSettlementPollerProvider
    const context = {
      db: null,
      invoice: { invoiceNumber: "INV-1" },
      externalRef: { externalId: null, externalNumber: null, metadata: null },
    } as unknown as Omit<InvoiceSettlementPollerContext, "bindings">

    await expect(poller({ ...context, bindings: firstBindings })).resolves.toEqual({
      syncError:
        "SmartBill settlement polling configuration is unavailable; required SMARTBILL_* credentials are missing.",
    })
    await poller({ ...context, bindings: secondBindings })

    expect(env).toHaveBeenNthCalledWith(1, firstBindings)
    expect(env).toHaveBeenNthCalledWith(2, secondBindings)
  })
})

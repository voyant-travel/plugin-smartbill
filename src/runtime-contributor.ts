import type { VoyantRuntimeHostPrimitives } from "@voyant-travel/core"
import {
  type FinanceInvoiceSettlementPollerProvider,
  financeInvoiceSettlementPollerRuntimePort,
  type InvoiceSettlementPoller,
} from "@voyant-travel/finance"
import type { StorageProvider } from "@voyant-travel/storage"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import type { SmartbillRuntimeConfig, SmartbillRuntimeHost } from "./graph-runtime.js"
import { smartbillRuntimeHostPort } from "./runtime-port.js"
import { createSmartbillInvoiceSettlementPoller } from "./settlement.js"

export interface SmartbillRuntimePortContributionHost {
  primitives: VoyantRuntimeHostPrimitives
}

/** Map deployment bindings to SmartBill's package-owned runtime configuration. */
export function resolveSmartbillRuntimeConfig(
  env: Readonly<Record<string, unknown>>,
): SmartbillRuntimeConfig | null {
  const username = nonEmpty(env.SMARTBILL_USERNAME)
  const apiToken = nonEmpty(env.SMARTBILL_API_TOKEN) ?? nonEmpty(env.SMARTBILL_TOKEN)
  const companyVatCode = nonEmpty(env.SMARTBILL_COMPANY_VAT_CODE)
  const invoiceSeriesName = nonEmpty(env.SMARTBILL_INVOICE_SERIES_NAME)
  const seriesName = invoiceSeriesName ?? nonEmpty(env.SMARTBILL_SERIES_NAME)
  if (!username || !apiToken || !companyVatCode || !seriesName) return null

  return {
    username,
    apiToken,
    companyVatCode,
    seriesName,
    invoiceSeriesName,
    proformaSeriesName: nonEmpty(env.SMARTBILL_PROFORMA_SERIES_NAME),
    apiUrl: nonEmpty(env.SMARTBILL_API_URL),
    language: nonEmpty(env.SMARTBILL_LANGUAGE),
    art311SpecialRegime: env.SMARTBILL_ART_311_SPECIAL_REGIME === "true",
  }
}

/** Package-owned registration map composed from domain-neutral host primitives. */
export function createSmartbillRuntimePortContribution({
  primitives,
}: SmartbillRuntimePortContributionHost): Readonly<Record<string, unknown>> {
  const runtimeHost: SmartbillRuntimeHost = {
    resolveDatabase: (bindings) => primitives.database.resolve<PostgresJsDatabase>(bindings),
    resolveConfig: (bindings) => resolveSmartbillRuntimeConfig(primitives.env(bindings)),
    resolveDocumentStorage: (bindings) =>
      (primitives.storage.resolve(bindings) as StorageProvider | null | undefined) ?? null,
    logger: console,
  }
  const settlementProvider: FinanceInvoiceSettlementPollerProvider = {
    provider: "smartbill",
    poller: createRuntimeSettlementPoller(primitives),
  }

  return {
    [smartbillRuntimeHostPort.id]: runtimeHost,
    [financeInvoiceSettlementPollerRuntimePort.id]: settlementProvider,
  }
}

function createRuntimeSettlementPoller(
  primitives: VoyantRuntimeHostPrimitives,
): InvoiceSettlementPoller {
  return async (context) => {
    const config = resolveSmartbillRuntimeConfig(primitives.env(context.bindings))
    if (!config) {
      return {
        syncError:
          "SmartBill settlement polling configuration is unavailable; required SMARTBILL_* credentials are missing.",
      }
    }

    return createSmartbillInvoiceSettlementPoller({
      username: config.username,
      apiToken: config.apiToken,
      apiUrl: config.apiUrl,
      companyVatCode: config.companyVatCode,
      seriesName: config.invoiceSeriesName ?? config.seriesName,
    })(context)
  }
}

function nonEmpty(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

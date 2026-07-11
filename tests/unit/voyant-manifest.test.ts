import { describe, expect, it } from "vitest"
import { smartbillVoyantPlugin } from "../../src/voyant.js"

describe("SmartBill deployment manifest", () => {
  it("declares stable identity, requirements, configuration, and runtime references", () => {
    expect(smartbillVoyantPlugin).toMatchObject({
      schemaVersion: "voyant.plugin.v1",
      id: "@voyant-travel/plugin-smartbill",
      packageName: "@voyant-travel/plugin-smartbill",
      localId: "plugin-smartbill",
      provides: {
        capabilities: ["finance.external-invoicing", "finance.external-payment-sync"],
      },
      requires: {
        ports: [{ id: "database.client" }, { id: "storage.object", optional: true }],
      },
      api: [
        {
          id: "@voyant-travel/plugin-smartbill#api.admin",
          runtime: { entry: "./hono", export: "createSmartbillAdminModule" },
        },
      ],
      subscribers: [
        {
          id: "@voyant-travel/plugin-smartbill#subscriber.invoice-issued",
          eventType: "invoice.issued",
          source: "@voyant-travel/plugin-smartbill/subscriber-runtime",
          runtime: {
            entry: "./subscriber-runtime",
            export: "smartbillInvoiceIssuedSubscriber",
          },
        },
        {
          id: "@voyant-travel/plugin-smartbill#subscriber.proforma-issued",
          eventType: "invoice.proforma.issued",
          source: "@voyant-travel/plugin-smartbill/subscriber-runtime",
          runtime: {
            entry: "./subscriber-runtime",
            export: "smartbillProformaIssuedSubscriber",
          },
        },
        {
          id: "@voyant-travel/plugin-smartbill#subscriber.payment-recorded",
          eventType: "invoice.payment.recorded",
          source: "@voyant-travel/plugin-smartbill/subscriber-runtime",
          runtime: {
            entry: "./subscriber-runtime",
            export: "smartbillPaymentRecordedSubscriber",
          },
        },
      ],
      config: [
        { key: "companyVatCode", required: true },
        { key: "seriesName", required: true },
        { key: "apiUrl", default: "https://ws.smartbill.ro/SBORO/api" },
        { key: "language", default: "RO" },
        { key: "art311SpecialRegime", default: false },
      ],
      secrets: [
        { key: "username", required: true, rotation: "replace-only" },
        { key: "apiToken", required: true, rotation: "replace-only" },
      ],
      meta: { ownership: "package", externalProvider: "smartbill" },
    })
  })
})

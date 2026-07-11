import type { BootstrapContext, EventEnvelope } from "@voyant-travel/core"
import { describe, expect, it, vi } from "vitest"
import {
  SMARTBILL_SUBSCRIBER_RUNTIME_KEY,
  type SmartbillSubscriberRuntime,
  smartbillInvoiceIssuedSubscriber,
  smartbillPaymentRecordedSubscriber,
  smartbillProformaIssuedSubscriber,
} from "../../src/subscriber-runtime.js"

const descriptors = [
  [smartbillInvoiceIssuedSubscriber, "invoiceIssued"],
  [smartbillProformaIssuedSubscriber, "proformaIssued"],
  [smartbillPaymentRecordedSubscriber, "paymentRecorded"],
] as const

describe("SmartBill subscriber runtimes", () => {
  it.each(
    descriptors,
  )("registers %s and delegates through the explicit runtime key", async (descriptor, handler) => {
    const runtime: SmartbillSubscriberRuntime = {
      invoiceIssued: vi.fn(),
      proformaIssued: vi.fn(),
      paymentRecorded: vi.fn(),
    }
    let registered:
      | { eventType: string; handler: (envelope: EventEnvelope) => Promise<void> | void }
      | undefined
    const context = {
      container: {
        has: vi.fn((key: string) => key === SMARTBILL_SUBSCRIBER_RUNTIME_KEY),
        resolve: vi.fn(() => runtime),
      },
      eventBus: {
        subscribe: vi.fn((eventType, registeredHandler) => {
          registered = { eventType, handler: registeredHandler }
        }),
      },
    } as unknown as BootstrapContext

    await descriptor.register(context)
    expect(registered?.eventType).toBe(descriptor.eventType)

    const envelope = { id: "evt_1", name: descriptor.eventType, data: {} } as EventEnvelope
    await registered?.handler(envelope)

    expect(runtime[handler]).toHaveBeenCalledWith(envelope)
    expect(context.container.resolve).toHaveBeenCalledWith(SMARTBILL_SUBSCRIBER_RUNTIME_KEY)
  })

  it("fails clearly when the host runtime adapter is unavailable", async () => {
    let handler: ((envelope: EventEnvelope) => Promise<void> | void) | undefined
    const context = {
      container: { has: () => false },
      eventBus: {
        subscribe: (_eventType: string, registeredHandler: typeof handler) => {
          handler = registeredHandler
        },
      },
    } as unknown as BootstrapContext

    await smartbillInvoiceIssuedSubscriber.register(context)

    await expect(handler?.({} as EventEnvelope)).rejects.toThrow(SMARTBILL_SUBSCRIBER_RUNTIME_KEY)
  })
})

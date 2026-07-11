import type { BootstrapContext, EventEnvelope } from "@voyant-travel/core"

export const SMARTBILL_SUBSCRIBER_RUNTIME_KEY = "providers.smartbill.subscriberRuntime"

export interface SmartbillSubscriberRuntime {
  invoiceIssued: (envelope: EventEnvelope) => Promise<void> | void
  proformaIssued: (envelope: EventEnvelope) => Promise<void> | void
  paymentRecorded: (envelope: EventEnvelope) => Promise<void> | void
}

export interface SmartbillSubscriberRuntimeDescriptor {
  readonly id: string
  readonly eventType: string
  readonly register: (context: BootstrapContext) => Promise<void> | void
}

type SmartbillSubscriberRuntimeHandler = keyof SmartbillSubscriberRuntime

function defineSmartbillSubscriberRuntime(
  id: string,
  eventType: string,
  handler: SmartbillSubscriberRuntimeHandler,
): SmartbillSubscriberRuntimeDescriptor {
  return {
    id,
    eventType,
    register: ({ container, eventBus }) => {
      eventBus.subscribe(eventType, async (envelope) => {
        if (!container.has(SMARTBILL_SUBSCRIBER_RUNTIME_KEY)) {
          throw new Error(
            `SmartBill subscriber runtime is not registered at "${SMARTBILL_SUBSCRIBER_RUNTIME_KEY}".`,
          )
        }
        const runtime = container.resolve<SmartbillSubscriberRuntime>(
          SMARTBILL_SUBSCRIBER_RUNTIME_KEY,
        )
        await runtime[handler](envelope)
      })
    },
  }
}

export const smartbillInvoiceIssuedSubscriber = defineSmartbillSubscriberRuntime(
  "@voyant-travel/plugin-smartbill#subscriber.invoice-issued",
  "invoice.issued",
  "invoiceIssued",
)

export const smartbillProformaIssuedSubscriber = defineSmartbillSubscriberRuntime(
  "@voyant-travel/plugin-smartbill#subscriber.proforma-issued",
  "invoice.proforma.issued",
  "proformaIssued",
)

export const smartbillPaymentRecordedSubscriber = defineSmartbillSubscriberRuntime(
  "@voyant-travel/plugin-smartbill#subscriber.payment-recorded",
  "invoice.payment.recorded",
  "paymentRecorded",
)

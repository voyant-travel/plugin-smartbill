#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = (path) => readFileSync(join(root, path), "utf8")
const packageJson = JSON.parse(read("package.json"))
const manifest = read("src/voyant.ts")
const hono = read("src/hono.ts")
const contributor = read("src/runtime-contributor.ts")
const violations = []

if (packageJson.voyant?.schemaVersion !== "voyant.package.v1") {
  violations.push("package.json must advertise voyant.package.v1 metadata")
}
if (
  packageJson.voyant?.runtime?.entry !== "./runtime-contributor" ||
  packageJson.voyant?.runtime?.export !== "createSmartbillRuntimePortContribution"
) {
  violations.push("package.json must activate the package-owned runtime contributor")
}
if (
  packageJson.exports?.["./runtime-contributor"] !== "./src/runtime-contributor.ts" ||
  !packageJson.publishConfig?.exports?.["./runtime-contributor"]
) {
  violations.push("the runtime contributor must be exported in source and published packages")
}
if (!manifest.includes('openapi: { document: "smartbill" }')) {
  violations.push("the SmartBill admin API must claim the smartbill OpenAPI document")
}
for (const expected of [
  'path: "/invoices/{id}/sync"',
  'operationId: "syncSmartbillInvoice"',
  '"x-voyant-api-id": SMARTBILL_OPENAPI_API_ID',
]) {
  if (!hono.includes(expected)) violations.push(`missing OpenAPI operation ownership: ${expected}`)
}
if (
  !contributor.includes("createSmartbillRuntimePortContribution") ||
  !contributor.includes("[smartbillRuntimeHostPort.id]: runtimeHost") ||
  !contributor.includes("[financeInvoiceSettlementPollerRuntimePort.id]: settlementProvider")
) {
  violations.push("SmartBill must own its host and Finance settlement runtime-port contributions")
}
if (
  !contributor.includes("primitives.env(context.bindings)") ||
  contributor.includes("contribution.host") ||
  /\bhost\s*:\s*SmartbillRuntimeHost\b/.test(contributor)
) {
  violations.push(
    "SmartBill must derive runtime services from primitives without a deployment host argument",
  )
}
for (const expected of [
  "SMARTBILL_API_TOKEN",
  "SMARTBILL_TOKEN",
  "SMARTBILL_INVOICE_SERIES_NAME",
  "SMARTBILL_SERIES_NAME",
  "required SMARTBILL_* credentials are missing",
]) {
  if (!contributor.includes(expected)) {
    violations.push(`missing package-owned SmartBill runtime behavior: ${expected}`)
  }
}
if (
  !manifest.includes("providePort(smartbillRuntimeHostPort)") ||
  !manifest.includes("providePort(financeInvoiceSettlementPollerRuntimePort)")
) {
  violations.push("the SmartBill manifest must declare authority for both contributed ports")
}
if (/cloudflare|workers/i.test(`${manifest}\n${contributor}`)) {
  violations.push("SmartBill deployment metadata must remain Node-only")
}

if (violations.length > 0) {
  console.error("SmartBill unified graph check failed.\n")
  for (const violation of violations) console.error(`  - ${violation}`)
  process.exit(1)
}

console.log(
  "check-unified-graph: OK (OpenAPI authority, primitive host, and settlement contribution)",
)

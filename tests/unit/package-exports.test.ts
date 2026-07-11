import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

describe("package exports", () => {
  it("publishes the package manifest and subscriber runtime entrypoints", async () => {
    const packageJsonPath = fileURLToPath(new URL("../../package.json", import.meta.url))
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"))

    expect(packageJson.voyant).toEqual({
      schemaVersion: "voyant.package.v1",
      kind: "plugin",
      manifest: "./voyant",
    })
    expect(packageJson.exports["./voyant"]).toBe("./src/voyant.ts")
    expect(packageJson.exports["./subscriber-runtime"]).toBe("./src/subscriber-runtime.ts")
    expect(packageJson.publishConfig.exports["./voyant"]).toEqual({
      types: "./dist/voyant.d.ts",
      import: "./dist/voyant.js",
      default: "./dist/voyant.js",
    })
    expect(packageJson.publishConfig.exports["./subscriber-runtime"]).toEqual({
      types: "./dist/subscriber-runtime.d.ts",
      import: "./dist/subscriber-runtime.js",
      default: "./dist/subscriber-runtime.js",
    })
  })
})

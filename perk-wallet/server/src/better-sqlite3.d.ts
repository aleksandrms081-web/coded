// Ambient module declaration so tsc accepts `import Database from "better-sqlite3"`
// without pulling in @types/better-sqlite3 as a devDependency (which would
// trigger a fresh npm install on every container build).
//
// We treat the runtime API as `any` for now — the call sites in db.ts already
// narrow their results back to typed `Profile` / `Vault` shapes.
declare module "better-sqlite3" {
  const Database: any
  export default Database
}

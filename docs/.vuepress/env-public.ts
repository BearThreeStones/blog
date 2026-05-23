/** Safe env read for files imported by both Node (config) and client bundles. */
export function readPublicEnv(key: string): string {
  if (typeof process !== "undefined" && process.env[key]) {
    return process.env[key] as string;
  }
  return "";
}

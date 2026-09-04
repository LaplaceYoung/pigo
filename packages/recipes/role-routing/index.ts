/**
 * Pigo brick: role-routing
 *
 * Map roles (default / smol / plan / vision) onto model ids from models.json.
 * Never store provider keys in this file.
 *
 *   mkdir -p .pi/extensions
 *   cp packages/recipes/role-routing/index.ts .pi/extensions/role-routing.ts
 *
 * Config: .pi/roles.json
 *   { "default": "openai/gpt-4.1", "smol": "openai/gpt-4.1-mini", "plan": "anthropic/claude-sonnet-4-5", "vision": "openai/gpt-4.1" }
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Roles = Record<string, string>;

const FALLBACK: Roles = {
  default: "",
  smol: "",
  plan: "",
  vision: "",
};

function rolesPath(cwd: string) {
  return join(cwd, ".pi", "roles.json");
}

function load(cwd: string): Roles {
  const path = rolesPath(cwd);
  if (!existsSync(path)) return { ...FALLBACK };
  try {
    return { ...FALLBACK, ...JSON.parse(readFileSync(path, "utf8")) };
  } catch {
    return { ...FALLBACK };
  }
}

function save(cwd: string, roles: Roles) {
  mkdirSync(join(cwd, ".pi"), { recursive: true });
  writeFileSync(rolesPath(cwd), JSON.stringify(roles, null, 2) + "\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("role", {
    description: "Show or set a model role. /role [name] [model-id]",
    handler: async (args, ctx) => {
      const cwd = ctx.cwd || process.cwd();
      const roles = load(cwd);
      const parts = String(args || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (parts.length === 0) {
        ctx.ui.notify(
          Object.entries(roles)
            .map(([k, v]) => `${k}: ${v || "(unset)"}`)
            .join("\n"),
          "info",
        );
        return;
      }
      if (parts.length === 1) {
        ctx.ui.notify(`${parts[0]}: ${roles[parts[0]] || "(unset)"}`, "info");
        return;
      }
      const [name, ...rest] = parts;
      roles[name] = rest.join(" ");
      save(cwd, roles);
      ctx.ui.notify(`role ${name} → ${roles[name]}`, "info");
    },
  });
}

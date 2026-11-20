import type { DrillModule } from "./drill.ts";
import { combos } from "./drills/combos.ts";
import { ev } from "./drills/ev.ts";
import { mdf } from "./drills/mdf.ts";
import { outs } from "./drills/outs.ts";
import { pot } from "./drills/pot.ts";
import { rule } from "./drills/rule.ts";
import { spr } from "./drills/spr.ts";

export const registry: DrillModule[] = [outs, rule, pot, combos, ev, mdf, spr];

export function findDrill(id: string): DrillModule | undefined {
  return registry.find((drill) => drill.id === id);
}

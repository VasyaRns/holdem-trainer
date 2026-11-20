import type { Spot } from "./spot.ts";

export type ActionWeight = {
  action: string;
  weight: number;
};

export type ActionMix = {
  actions: ActionWeight[];
};

export interface SolutionSource {
  id: string;
  lookup(spot: Spot): ActionMix | null;
}

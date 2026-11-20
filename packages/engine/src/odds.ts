export function potOdds(potFacing: number, callAmount: number): number {
  return callAmount / (potFacing + callAmount);
}

export function asPercent(ratio: number): number {
  return Math.round(ratio * 100);
}

export function callEv(equity: number, potFacing: number, callAmount: number): number {
  return equity * (potFacing + callAmount) - callAmount;
}

export function callChoice(equity: number, price: number): "call" | "fold" | "either" {
  if (Math.abs(equity - price) < 1e-9) return "either";
  return equity > price ? "call" : "fold";
}

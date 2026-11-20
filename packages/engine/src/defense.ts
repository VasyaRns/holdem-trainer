export function minimumDefenseFrequency(potBeforeBet: number, bet: number): number {
  return potBeforeBet / (potBeforeBet + bet);
}

export function alpha(potBeforeBet: number, bet: number): number {
  return bet / (potBeforeBet + bet);
}

export function stackToPot(effectiveStack: number, pot: number): number {
  return effectiveStack / pot;
}

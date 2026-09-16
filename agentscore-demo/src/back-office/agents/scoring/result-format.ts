export function evaluationResultLabel(score: number | null): string {
  return score == null ? "Insufficient evidence" : "Score available";
}

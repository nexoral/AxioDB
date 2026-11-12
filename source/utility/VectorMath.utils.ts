/**
 * Vector mathematics utility for semantic similarity and distance calculations.
 */
export default class VectorMath {
  /**
   * Validates if the input is a non-empty array of finite numbers.
   * If expectedDim is provided, enforces exact vector dimensions.
   */
  public static isValidVector(v: unknown, expectedDim?: number): v is number[] {
    if (!Array.isArray(v) || v.length === 0) return false;
    if (expectedDim !== undefined && v.length !== expectedDim) return false;
    for (let i = 0; i < v.length; i++) {
      const val = v[i];
      if (typeof val !== "number" || !Number.isFinite(val)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Computes the Cosine Similarity between two vectors: dot(a, b) / (||a|| * ||b||).
   * Returns a value between -1 and 1 (1 = identical direction, 0 = orthogonal, -1 = opposite).
   */
  public static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      const valA = a[i];
      const valB = b[i];
      dot += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }
    if (normA === 0 || normB === 0) return 0;
    const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(-1, Math.min(1, similarity));
  }

  /**
   * Computes the Dot Product between two vectors: sum(a[i] * b[i]).
   */
  public static dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    return dot;
  }

  /**
   * Computes the Euclidean Distance between two vectors: sqrt(sum((a[i] - b[i])^2)).
   */
  public static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }
}

/**
 * RegexGuard - Static ReDoS guard for user-supplied regex patterns.
 *
 * Rejects patterns that are too long, contain nested unbounded quantifiers
 * (`(a+)+`), or have overlapping alternation branches inside an unboundedly
 * quantified group (`(a|aa)+`). Bounded quantifiers like `{2,9}` are allowed.
 *
 * @class RegexGuard
 * @example
 * const safe = RegexGuard.compileRegex("(a+)b", "");
 * const guarded = RegexGuard.compileRegex("(a+)+$", ""); // throws
 */
export default class RegexGuard {
  /** Upper bound on pattern length. */
  static readonly MAX_PATTERN_LENGTH = 512;

  /**
   * Compiles a user-supplied pattern into a RegExp after proving it is safe.
   * @param pattern - The regex source to compile.
   * @param flags - Optional regex flags (e.g. "i").
   * @returns A compiled RegExp.
   * @throws Error if the pattern is empty, too long, or prone to catastrophic backtracking.
   */
  static compileRegex(pattern: string, flags?: string): RegExp {
    if (!pattern || typeof pattern !== "string") {
      throw new Error("Invalid regex pattern: must be a non-empty string");
    }
    if (pattern.length > this.MAX_PATTERN_LENGTH) {
      throw new Error(
        `Regex pattern exceeds maximum length of ${this.MAX_PATTERN_LENGTH}`,
      );
    }
    this.assertSafePattern(pattern);
    return new RegExp(pattern, flags || "");
  }

  /**
   * Returns true when the pattern does not contain the catastrophic
   * nested-quantifier shape. Pure check - callers decide what to do.
   * @param pattern - The regex source to inspect.
   * @returns true if the pattern is considered safe, false otherwise.
   */
  static isSafePattern(pattern: string): boolean {
    try {
      this.assertSafePattern(pattern);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Static scan for the catastrophic-backtracking shape.
   *
   * Two classes are rejected:
   *  1. Nested unbounded quantifiers: a group that contains an internally
   *     quantified atom and is itself unboundedly quantified, e.g. `(a+)+`.
   *  2. Overlapping alternation inside an unboundedly quantified group: two
   *     branches where one is a strict prefix of another, e.g. `(a|aa)+` -
   *     the parser cannot decide where a branch ends, causing exponential work.
   *
   * @param pattern - The regex source to inspect.
   * @throws Error describing the dangerous construct when detected.
   */
  static assertSafePattern(pattern: string): void {
    let inClass = false;
    let escaped = false;
    // Stack of currently-open groups; each tracks whether it contains an
    // internally quantified atom and where it opened (for branch analysis).
    const groups: { openIndex: number; hasQuantifiedAtom: boolean }[] = [];

    for (let i = 0; i < pattern.length; i++) {
      const c = pattern[i];

      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === "\\") {
        escaped = true;
        continue;
      }
      // Inside a character class like [abc+]: '+' is a literal there, not a quantifier.
      if (inClass) {
        if (c === "]") inClass = false;
        continue;
      }
      if (c === "[") {
        inClass = true;
        continue;
      }
      if (c === "(") {
        groups.push({ openIndex: i, hasQuantifiedAtom: false });
        continue;
      }
      if (c === ")") {
        const group = groups.pop();
        if (!group) continue;
        const quantifier = this.peekGroupQuantifier(pattern, i);
        const isUnbounded = quantifier === "unbounded";

        if (isUnbounded) {
          if (group.hasQuantifiedAtom) {
            throw new Error(
              "Regex pattern rejected: contains nested quantifiers that can cause catastrophic backtracking",
            );
          }
          const body = pattern.slice(group.openIndex + 1, i);
          if (this.hasOverlappingAlternation(this.stripGroupMarker(body))) {
            throw new Error(
              "Regex pattern rejected: quantified alternation with overlapping branches can cause catastrophic backtracking",
            );
          }
        }

        // A quantified group, or a group containing quantified atoms, is itself
        // a quantified atom to its parent group.
        const isQuantifiedAtom = group.hasQuantifiedAtom || isUnbounded;
        if (isQuantifiedAtom && groups.length > 0) {
          groups[groups.length - 1].hasQuantifiedAtom = true;
        }
        continue;
      }
      // Track unbounded quantifiers (+ or * or {n,}): the atom before them is a
      // quantified atom. '?' is deliberately excluded - a single optional atom
      // cannot blow up on its own. `{m}` bounded and `{m,n}` bounded are also excluded.
      let isUnbounded = false;
      if (c === "+" || c === "*") {
        isUnbounded = true;
      } else if (c === "{") {
        isUnbounded = this.isUnboundedRange(pattern, i) === true;
      }
      if (isUnbounded && groups.length > 0) {
        groups[groups.length - 1].hasQuantifiedAtom = true;
      }
    }
  }

  /**
   * Splits a group body on top-level alternation operators and reports whether
   * any two branches overlap, i.e. one is a strict prefix of another. Branch
   * overlap on an unboundedly quantified group is what produces exponential
   * backtracking in patterns like `(a|aa)+`.
   * @param body - The characters between a group's '(' and ')'.
   * @returns true when an overlapping branch pair is found.
   */
  private static hasOverlappingAlternation(body: string): boolean {
    const branches = this.splitTopLevel(body);
    if (branches.length < 2) return false;
    for (let i = 0; i < branches.length; i++) {
      for (let j = 0; j < branches.length; j++) {
        if (i === j) continue;
        const a = branches[i];
        const b = branches[j];
        // An empty branch can match zero width, so no line is consumed - the
        // classic `(|x)+` / `(a|)+` ambiguity.
        if (a === "" || b === "") return true;
        if (b.length > a.length && b.startsWith(a)) return true;
        if (a.length > b.length && a.startsWith(b)) return true;
        if (a === b) return true; // duplicate branches are always ambiguous
      }
    }
    return false;
  }

  /**
   * Strips the special group marker (`?:`, `?=`, `?!`, `?<=`, `?<!`, `?<name>`)
   * from a group body so branch analysis sees the actual alternation content.
   * @param body - The raw text between '(' and ')'.
   * @returns The body without its leading marker, if one was present.
   */
  private static stripGroupMarker(body: string): string {
    if (body[0] === "?" && body[1] === "<") {
      const close = body.indexOf(">");
      return close >= 0 ? body.slice(close + 1) : body;
    }
    if (body[0] === "?" && (body[1] === ":" || body[1] === "=" || body[1] === "!")) {
      return body.slice(2);
    }
    return body;
  }

  /**
   * Splits a group body on '|' operators that are not nested inside a
   * sub-group or character class.
   * @param body - The group's raw body text.
   * @returns The top-level alternation branches (at least one element).
   */
  private static splitTopLevel(body: string): string[] {
    const branches: string[] = [];
    let depth = 0;
    let inClass = false;
    let escaped = false;
    let current = "";
    for (const c of body) {
      if (escaped) {
        escaped = false;
        current += c;
        continue;
      }
      if (c === "\\") {
        escaped = true;
        current += c;
        continue;
      }
      if (inClass) {
        current += c;
        if (c === "]") inClass = false;
        continue;
      }
      if (c === "[") {
        inClass = true;
        current += c;
        continue;
      }
      if (c === "(") {
        depth++;
        current += c;
        continue;
      }
      if (c === ")") {
        depth--;
        current += c;
        continue;
      }
      if (c === "|" && depth === 0) {
        branches.push(current);
        current = "";
        continue;
      }
      current += c;
    }
    branches.push(current);
    return branches;
  }

  /**
   * Determines what kind of quantifier (if any) follows a closing parenthesis.
   * @param pattern - The full regex source.
   * @param closeIndex - Index of the ')' that just closed a group.
   * @returns "none" when no quantifier follows, "unbounded" for `*`, `+`, or an
   *          open-ended `{n,}` range, otherwise "bounded".
   */
  private static peekGroupQuantifier(
    pattern: string,
    closeIndex: number,
  ): "none" | "unbounded" | "bounded" {
    const next = pattern[closeIndex + 1];
    if (next === "*" || next === "+") return "unbounded";
    if (next === "{") {
      const bounded = this.isUnboundedRange(pattern, closeIndex + 1);
      return bounded === true ? "unbounded" : bounded === false ? "bounded" : "none";
    }
    if (next === "?") return "bounded";
    return "none";
  }

  /**
   * Parses a `{...}` quantifier starting at the given index.
   * @param pattern - The full regex source.
   * @param openIndex - Index of the '{'.
   * @returns true for an unbounded `{n,}` range, false for a bounded `{n}` or
   *          `{n,m}`, and null when the character is not actually a quantifier
   *          (e.g. a literal brace inside a larger construct).
   */
  private static isUnboundedRange(
    pattern: string,
    openIndex: number,
  ): boolean | null {
    let closeIndex = openIndex + 1;
    while (closeIndex < pattern.length && pattern[closeIndex] !== "}") {
      closeIndex++;
    }
    if (closeIndex >= pattern.length) return null;
    const body = pattern.slice(openIndex + 1, closeIndex);
    if (/^\d+$/.test(body)) return false;
    if (/^\d+,\d+$/.test(body)) return false;
    if (/^\d+,$/.test(body)) return true;
    return null;
  }
}
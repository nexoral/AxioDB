# Taste
- Treats documentation accuracy as a first-class correctness concern, not a nice-to-have; expects docs to be verified against the actual source of truth and corrected proactively. Confidence: 0.9
- Scopes "docs" broadly — hand-written READMEs/AGENTS.md/CONTRIBUTING, plus generated markdown, AI/LLM-facing artifacts (`llms.txt`, `llms-full.txt`, `SKILL.md`, `openapi.json`), and architecture-graph outputs like graphify. Assume all of it is in scope when auditing. Confidence: 0.85
- Asks for fixes, not just findings: when stale or nonexistent info is found, correct it as part of the same task. Confidence: 0.9
- Expects every numeric/quantified claim in docs (counts, versions, ports, suite totals) to be independently verified against code rather than trusted. Confidence: 0.85
- Prefers thorough end-to-end passes ("read the full project properly") over incremental or surface-level spot checks. Confidence: 0.8
- When touching generated/derived docs, the preference is to fix the real source and regenerate artifacts downstream rather than hand-editing the output. Confidence: 0.7
- Writes terse, typo-heavy, lowercase instructions and expects substantive autonomous execution rather than clarifying questions or incremental check-ins. Confidence: 0.75
- Skeptically probes the agent's own completion claims with short follow-up questions ("are the numbers right?", "did you actually measure that?") — treat these as a cue to re-measure every value and re-verify end-to-end, never to defend or re-state the earlier report. Confidence: 0.85
- Values frankness about provenance of numbers: a figure that was inherited from existing docs is not "verified", and the agent should say so plainly and go measure it instead of presenting it as confirmed. Confidence: 0.8

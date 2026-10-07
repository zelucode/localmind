/**
 * Feature switches for parts of the app that are built but not offered yet.
 * Everything behind a switch stays in the codebase and keeps its tests; flip the
 * value to bring the feature back.
 */
export const FEATURES = {
  /**
   * The Free Tier Advisor (floating button, "A" shortcut, Ctrl+K action, Ask box "Which Tool?").
   * Hidden until we decide which providers it should run on (see docs/BACKLOG.md, Task 14).
   */
  advisor: false,
} as const;

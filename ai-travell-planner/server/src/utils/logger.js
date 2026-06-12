/**
 * Minimal structured logger for Yatra server.
 * Uses console so it works with any Node version — no extra deps needed.
 * Colour-codes by level in development; strips colour in production.
 */

const IS_DEV = (process.env.NODE_ENV || "development") !== "production";

const COLOURS = {
  info:  "\x1b[36m",  // cyan
  warn:  "\x1b[33m",  // yellow
  error: "\x1b[31m",  // red
  debug: "\x1b[90m",  // grey
  reset: "\x1b[0m"
};

function format(level, label, message, data) {
  const ts   = new Date().toISOString();
  const col  = IS_DEV ? (COLOURS[level] ?? "") : "";
  const rst  = IS_DEV ? COLOURS.reset : "";
  const tag  = label ? `[${label}]` : "";
  const body = data !== undefined ? ` ${JSON.stringify(data, null, 2)}` : "";
  return `${col}${ts} ${level.toUpperCase().padEnd(5)} ${tag} ${message}${body}${rst}`;
}

export const logger = {
  info:  (label, msg, data) => console.log(format("info",  label, msg, data)),
  warn:  (label, msg, data) => console.warn(format("warn",  label, msg, data)),
  error: (label, msg, data) => console.error(format("error", label, msg, data)),
  debug: (label, msg, data) => IS_DEV && console.log(format("debug", label, msg, data))
};
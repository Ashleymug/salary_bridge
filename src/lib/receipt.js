// Re-exports the production PDF implementation.
// All callers (HistoryPage, BreakdownModal) import from here.
export { downloadReceipt, downloadStatement } from './pdf/index.js';

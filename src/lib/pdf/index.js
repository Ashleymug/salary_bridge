/**
 * PDF generation entry point.
 *
 * downloadReceipt(advance, user)      — single advance receipt (A4 portrait)
 * downloadStatement(advances, user)   — full transaction statement (A4 landscape)
 *
 * Both functions are async: they generate a real PDF Blob via @react-pdf/renderer,
 * then trigger a browser file download with a meaningful filename.
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF }   from './ReceiptPDF.jsx';
import { StatementPDF } from './StatementPDF.jsx';

/**
 * Programmatically trigger a <a download> with the given Blob.
 * Revokes the object URL after a short delay to free memory.
 */
function triggerDownload(blob, filename) {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/**
 * Generate and download a single-transaction receipt PDF.
 *
 * @param {object} advance  — AdvanceResponse (camelCase)
 * @param {object} user     — auth user object
 */
export async function downloadReceipt(advance, user) {
  const element = React.createElement(ReceiptPDF, { advance, user });
  const blob    = await pdf(element).toBlob();
  const safeRef = (advance.reference || 'receipt').replace(/[^a-zA-Z0-9-]/g, '-');
  triggerDownload(blob, `GovPay-Receipt-${safeRef}.pdf`);
}

/**
 * Generate and download a full transaction statement PDF.
 *
 * @param {object[]} advances — AdvanceResponse[] (camelCase, newest first)
 * @param {object}   user     — auth user object
 */
export async function downloadStatement(advances, user) {
  const element = React.createElement(StatementPDF, { advances, user });
  const blob    = await pdf(element).toBlob();
  const name    = (user?.fullName || 'statement').replace(/\s+/g, '-');
  const date    = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `GovPay-Statement-${name}-${date}.pdf`);
}

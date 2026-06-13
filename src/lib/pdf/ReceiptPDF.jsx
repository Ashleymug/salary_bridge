import React from 'react';
import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';
import { C, F, RECEIPT_PADDING as P } from './theme.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: F.regular,
    backgroundColor: C.white,
    fontSize: 10,
    color: C.text,
  },

  /* ── Header ── */
  header: {
    backgroundColor: C.navy,
    paddingTop: 28,
    paddingBottom: 22,
    paddingLeft: P,
    paddingRight: P,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  logoName: {
    fontFamily: F.bold,
    fontSize: 20,
    color: C.white,
    letterSpacing: -0.3,
  },
  logoSub: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  officialBadge: {
    borderWidth: 1,
    borderColor: 'rgba(124,249,148,0.45)',
    backgroundColor: 'rgba(124,249,148,0.12)',
    borderRadius: 999,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 10,
  },
  officialText: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.green,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
    marginBottom: 14,
  },
  docTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.green,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  docRef: {
    fontFamily: F.mono,
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
  },

  /* ── Body ── */
  body: {
    paddingTop: 22,
    paddingBottom: 16,
    paddingLeft: P,
    paddingRight: P,
    flexGrow: 1,
  },

  issuedBar: {
    backgroundColor: C.surface,
    borderRadius: 7,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  issuedText: {
    fontSize: 10,
    color: C.muted,
  },

  /* ── Sections ── */
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.mutedLight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 10,
  },

  /* ── Info grid (2-col) ── */
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  infoCell: {
    width: '50%',
    marginBottom: 12,
  },
  infoCellLabel: {
    fontSize: 8,
    color: C.mutedLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  infoCellValue: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.text,
  },

  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 14,
  },

  /* ── Transaction rows ── */
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 9,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  txnLabel: {
    fontSize: 11,
    color: C.muted,
  },
  txnValue: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.text,
  },

  /* ── Fee row highlight ── */
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.greenBg,
    borderRadius: 6,
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 2,
    marginBottom: 2,
  },
  feeLabel: { fontSize: 11, color: '#166534' },
  feeValue: { fontFamily: F.bold, fontSize: 11, color: C.greenDark },

  /* ── Status pill ── */
  pill: {
    borderRadius: 999,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8,
  },
  pillText: {
    fontFamily: F.bold,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* ── Total box ── */
  totalBox: {
    backgroundColor: C.navy,
    borderRadius: 10,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  totalLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    fontFamily: F.bold,
    fontSize: 20,
    color: C.green,
    letterSpacing: -0.5,
  },

  /* ── Footer ── */
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: P,
    paddingRight: P,
    alignItems: 'center',
  },
  footerVerified: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.greenDark,
    marginBottom: 5,
  },
  footerNote: {
    fontSize: 8,
    color: C.mutedLight,
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 6,
  },
  footerMeta: {
    fontSize: 8,
    color: C.mutedLight,
  },
});

// ── Component ─────────────────────────────────────────────────────────────────

export function ReceiptPDF({ advance, user }) {
  const year = new Date().getFullYear();
  const statusCompleted = advance.status === 'completed';

  return (
    <Document
      title={`Receipt ${advance.reference}`}
      author="GovPay Uganda"
      subject="Salary Advance Receipt"
      creator="GovPay Uganda Payroll System"
      producer="@react-pdf/renderer"
      keywords="salary advance receipt govpay uganda"
      language="en-GB"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.logoName}>GovPay Uganda</Text>
              <Text style={s.logoSub}>Ministry of Finance · Public Payroll System</Text>
            </View>
            <View style={s.officialBadge}>
              <Text style={s.officialText}>Official</Text>
            </View>
          </View>
          <View style={s.headerDivider} />
          <View style={s.docTitleRow}>
            <Text style={s.docTitle}>Salary Advance Receipt</Text>
            <Text style={s.docRef}>{advance.reference}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={s.body}>

          {/* Issued date */}
          <View style={s.issuedBar}>
            <Text style={s.issuedText}>Issued: {fmtDateTime(advance.createdAt)}</Text>
          </View>

          {/* Payee info */}
          <Text style={s.sectionLabel}>Payee Information</Text>
          <View style={s.infoGrid}>
            {[
              { label: 'Full Name',             value: user?.fullName       || '—' },
              { label: 'Employee ID',           value: user?.employeeId     || '—' },
              { label: 'Ministry / Department', value: user?.ministry       || '—' },
              { label: 'Job Category',          value: user?.jobCategory    || '—' },
            ].map(({ label, value }) => (
              <View key={label} style={s.infoCell}>
                <Text style={s.infoCellLabel}>{label}</Text>
                <Text style={s.infoCellValue}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={s.sectionDivider} />

          {/* Transaction details */}
          <Text style={s.sectionLabel}>Transaction Details</Text>

          <View style={s.txnRow}>
            <Text style={s.txnLabel}>Advance Amount</Text>
            <Text style={s.txnValue}>UGX {fmt(advance.amountUgx)}</Text>
          </View>

          <View style={s.feeRow}>
            <Text style={s.feeLabel}>Bridge Fee (flat)</Text>
            <Text style={s.feeValue}>+ UGX {fmt(advance.feeUgx)}</Text>
          </View>

          <View style={s.txnRow}>
            <Text style={s.txnLabel}>Disbursed Via</Text>
            <Text style={s.txnValue}>{advance.provider} Mobile Money</Text>
          </View>

          <View style={s.txnRow}>
            <Text style={s.txnLabel}>Repayment Date</Text>
            <Text style={s.txnValue}>{advance.repaymentDateLabel}</Text>
          </View>

          <View style={s.txnRow}>
            <Text style={s.txnLabel}>Transaction Status</Text>
            <View style={[s.pill, {
              backgroundColor: statusCompleted ? C.greenPill : C.blueBg,
            }]}>
              <Text style={[s.pillText, {
                color: statusCompleted ? C.greenDark : C.blue,
              }]}>
                {statusCompleted ? 'Completed' : 'Processing'}
              </Text>
            </View>
          </View>

          {/* Total repayment box */}
          <View style={s.totalBox}>
            <Text style={s.totalLabel}>Total Repayment</Text>
            <Text style={s.totalAmount}>UGX {fmt(advance.totalRepaymentUgx)}</Text>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerVerified}>
            ✓  Verified by Ministry of Finance  ·  Digitally Signed
          </Text>
          <Text style={s.footerNote}>
            This is a computer-generated document valid without a physical signature.{'\n'}
            For queries contact GovPay Uganda Support — support@govpay.go.ug
          </Text>
          <Text
            style={s.footerMeta}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}  ·  GovPay Uganda © ${year}`
            }
          />
        </View>

      </Page>
    </Document>
  );
}

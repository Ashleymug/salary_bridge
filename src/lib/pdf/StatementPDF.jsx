import React from 'react';
import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';
import { C, F } from './theme.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function fmtShort(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    return `${day} ${d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
  } catch { return iso; }
}

function fmtNow() {
  return new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Landscape A4 usable width ≈ 801pt (841 - 2×20pt padding)
const PAD = 28;

// ── Column flex weights (total = 10) ─────────────────────────────────────────
const COLS = [
  { label: 'Reference',       flex: 2   },
  { label: 'Date',            flex: 1.4 },
  { label: 'Amount',          flex: 1.5 },
  { label: 'Fee',             flex: 1   },
  { label: 'Total Repayment', flex: 1.8 },
  { label: 'Due Date',        flex: 1.4 },
  { label: 'Status',          flex: 0.9 },
];

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: F.regular,
    backgroundColor: C.white,
    fontSize: 9,
    color: C.text,
  },

  /* ── Header ── */
  header: {
    backgroundColor: C.navy,
    paddingTop: 20,
    paddingBottom: 18,
    paddingLeft: PAD,
    paddingRight: PAD,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  logoName: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.white,
    letterSpacing: -0.3,
  },
  logoSub: {
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 3,
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
    alignSelf: 'flex-start',
  },
  officialText: {
    fontFamily: F.bold,
    fontSize: 7.5,
    color: C.green,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
    marginBottom: 12,
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
  docGenerated: {
    fontFamily: F.mono,
    fontSize: 8,
    color: 'rgba(255,255,255,0.45)',
  },

  /* ── Body ── */
  body: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingLeft: PAD,
    paddingRight: PAD,
    flexGrow: 1,
  },

  /* ── Summary stats row ── */
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
  },
  statCellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  statLabel: {
    fontSize: 7.5,
    color: C.mutedLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  statValue: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.text,
    letterSpacing: -0.2,
  },
  statValueGreen: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.greenDark,
    letterSpacing: -0.2,
  },

  /* ── Payee info strip ── */
  payeeStrip: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 32,
  },
  payeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payeeLabel: {
    fontSize: 8,
    color: C.mutedLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  payeeValue: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.text,
  },

  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 7.5,
    color: C.mutedLight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  /* ── Table ── */
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 8,
    paddingRight: 8,
  },
  tableHeadCell: {
    fontFamily: F.bold,
    fontSize: 7.5,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: C.rowStripe,
  },
  tableCell: {
    fontSize: 9,
    color: C.text,
    paddingRight: 6,
  },
  tableCellMono: {
    fontFamily: F.mono,
    fontSize: 8.5,
    color: C.text,
    paddingRight: 6,
  },
  tableCellMuted: {
    fontSize: 8,
    color: C.mutedLight,
    marginTop: 1,
  },
  tableCellBold: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.text,
    paddingRight: 6,
  },

  /* ── Status pill ── */
  pill: {
    borderRadius: 999,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 6,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontFamily: F.bold,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  /* ── Totals bar ── */
  totalsBar: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    borderRadius: 8,
    marginTop: 10,
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 8,
    paddingRight: 8,
    alignItems: 'center',
  },
  totalsLabel: {
    fontFamily: F.bold,
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalsValue: {
    fontFamily: F.bold,
    fontSize: 9.5,
    color: C.green,
  },
  totalsValueWhite: {
    fontFamily: F.bold,
    fontSize: 9.5,
    color: C.white,
  },

  /* ── Footer (fixed, every page) ── */
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: PAD,
    paddingRight: PAD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: 7.5,
    color: C.mutedLight,
  },
  footerRight: {
    fontSize: 7.5,
    color: C.mutedLight,
  },
});

// ── Component ─────────────────────────────────────────────────────────────────

export function StatementPDF({ advances, user }) {
  const year      = new Date().getFullYear();
  const generated = fmtNow();

  const totalAdvanced  = advances.reduce((s, a) => s + (a.amountUgx       || 0), 0);
  const totalFees      = advances.reduce((s, a) => s + (a.feeUgx          || 0), 0);
  const totalRepayment = advances.reduce((s, a) => s + (a.totalRepaymentUgx || 0), 0);

  return (
    <Document
      title={`Transaction Statement — ${user?.fullName || 'GovPay Uganda'}`}
      author="GovPay Uganda"
      subject="Salary Advance Transaction Statement"
      creator="GovPay Uganda Payroll System"
      producer="@react-pdf/renderer"
      language="en-GB"
    >
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header} fixed>
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
            <Text style={s.docTitle}>Transaction Statement</Text>
            <Text style={s.docGenerated}>Generated: {generated}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={s.body}>

          {/* Summary stats */}
          <View style={s.statsRow}>
            {[
              { label: 'Total Advances',       value: String(advances.length),            green: false, border: false },
              { label: 'Total Disbursed',       value: `UGX ${fmt(totalAdvanced)}`,        green: true,  border: true  },
              { label: 'Total Fees',            value: `UGX ${fmt(totalFees)}`,            green: false, border: true  },
              { label: 'Total Repayment',       value: `UGX ${fmt(totalRepayment)}`,       green: false, border: true  },
              { label: 'Credit Standing',       value: advances.length > 0 ? 'Excellent' : 'N/A', green: false, border: true  },
            ].map(({ label, value, green, border }) => (
              <View key={label} style={[s.statCell, border && s.statCellBorder]}>
                <Text style={s.statLabel}>{label}</Text>
                <Text style={green ? s.statValueGreen : s.statValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Payee strip */}
          <View style={s.payeeStrip}>
            {[
              { label: 'Name',        value: user?.fullName    || '—' },
              { label: 'Employee ID', value: user?.employeeId  || '—' },
              { label: 'Ministry',    value: user?.ministry    || '—' },
              { label: 'Category',    value: user?.jobCategory || '—' },
            ].map(({ label, value }) => (
              <View key={label} style={s.payeeItem}>
                <Text style={s.payeeLabel}>{label}:</Text>
                <Text style={s.payeeValue}> {value}</Text>
              </View>
            ))}
          </View>

          {/* Table */}
          <Text style={s.sectionLabel}>
            All Transactions ({advances.length} record{advances.length !== 1 ? 's' : ''})
          </Text>

          {advances.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: C.mutedLight }}>No transactions on record.</Text>
            </View>
          ) : (
            <>
              {/* Table head */}
              <View style={s.tableHead} fixed>
                {COLS.map(({ label, flex }) => (
                  <View key={label} style={{ flex }}>
                    <Text style={s.tableHeadCell}>{label}</Text>
                  </View>
                ))}
              </View>

              {/* Table rows */}
              {advances.map((a, idx) => {
                const done = a.status === 'completed';
                return (
                  <View
                    key={a.id}
                    style={[s.tableRow, idx % 2 === 1 && s.tableRowAlt]}
                    wrap={false}
                  >
                    {/* Reference */}
                    <View style={{ flex: COLS[0].flex }}>
                      <Text style={s.tableCellMono}>{a.reference}</Text>
                      <Text style={s.tableCellMuted}>{a.provider} MoMo</Text>
                    </View>

                    {/* Date */}
                    <View style={{ flex: COLS[1].flex }}>
                      <Text style={s.tableCell}>{fmtShort(a.createdAt)}</Text>
                    </View>

                    {/* Amount */}
                    <View style={{ flex: COLS[2].flex }}>
                      <Text style={s.tableCellBold}>UGX {fmt(a.amountUgx)}</Text>
                    </View>

                    {/* Fee */}
                    <View style={{ flex: COLS[3].flex }}>
                      <Text style={[s.tableCell, { color: C.greenDark }]}>
                        UGX {fmt(a.feeUgx)}
                      </Text>
                    </View>

                    {/* Total repayment */}
                    <View style={{ flex: COLS[4].flex }}>
                      <Text style={s.tableCellBold}>UGX {fmt(a.totalRepaymentUgx)}</Text>
                    </View>

                    {/* Due date */}
                    <View style={{ flex: COLS[5].flex }}>
                      <Text style={s.tableCell}>{a.repaymentDateLabel}</Text>
                    </View>

                    {/* Status */}
                    <View style={{ flex: COLS[6].flex }}>
                      <View style={[s.pill, { backgroundColor: done ? C.greenPill : C.blueBg }]}>
                        <Text style={[s.pillText, { color: done ? C.greenDark : C.blue }]}>
                          {done ? 'Paid' : 'Active'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Totals bar */}
              <View style={s.totalsBar} wrap={false}>
                {/* Label takes flex 2 */}
                <View style={{ flex: COLS[0].flex }}>
                  <Text style={s.totalsLabel}>
                    Totals  ({advances.length} advance{advances.length !== 1 ? 's' : ''})
                  </Text>
                </View>
                {/* Date — empty */}
                <View style={{ flex: COLS[1].flex }} />
                {/* Amount total */}
                <View style={{ flex: COLS[2].flex }}>
                  <Text style={s.totalsValue}>UGX {fmt(totalAdvanced)}</Text>
                </View>
                {/* Fees total */}
                <View style={{ flex: COLS[3].flex }}>
                  <Text style={s.totalsValueWhite}>UGX {fmt(totalFees)}</Text>
                </View>
                {/* Repayment total */}
                <View style={{ flex: COLS[4].flex }}>
                  <Text style={s.totalsValue}>UGX {fmt(totalRepayment)}</Text>
                </View>
                {/* Due date, status — empty */}
                <View style={{ flex: COLS[5].flex + COLS[6].flex }} />
              </View>
            </>
          )}
        </View>

        {/* ── Footer — fixed on every page ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>
            Verified by Ministry of Finance · Digitally Signed · GovPay Uganda © {year}
          </Text>
          <Text
            style={s.footerRight}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  );
}

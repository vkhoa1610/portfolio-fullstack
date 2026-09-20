"use client";

import { useGetExpenseByIdQuery, useSubmitExpenseMutation } from "@/ducks/expenses";
import styles from "./detail/detail-shared.module.css";
import PageHeader from "@/components/layout/PageHeader";
import hdrStyles from "@/components/layout/PageHeader.module.css";
import ExpenseDetailBody from "./detail/ExpenseDetailBody";
import { fmtDate, fmtAmount, TYPE_ICON, STATUS_LABEL, STATUS_ICON, COUNTRY_LABEL } from "./detail/detail-builders";

// ── Main component ────────────────────────────────────────
export default function ExpenseDetailView({ id }: { id: number }) {
  const { data: expense, isLoading } = useGetExpenseByIdQuery(id);
  const [submitExpense, { isLoading: isSubmitting }] = useSubmitExpenseMutation();

  if (isLoading) {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }
  if (!expense) {
    return (
      <p style={{ textAlign: "center", color: "#767586", padding: "4rem 0" }}>
        Expense not found.
      </p>
    );
  }

  const typeLabel =
    expense.type === "RECEIPT" ? "Receipt" :
    expense.type === "PER_DIEM" ? "Per Diem" : "Mileage";

  const badges = [
    { icon: TYPE_ICON[expense.type], label: typeLabel },
    { icon: STATUS_ICON[expense.status], label: STATUS_LABEL[expense.status] },
    ...(expense.type === "PER_DIEM" && expense.countryCode
      ? [{ icon: "location_on", label: COUNTRY_LABEL[expense.countryCode] ?? expense.countryCode }]
      : expense.receiptDate
      ? [{ icon: "calendar_today", label: fmtDate(expense.receiptDate) }]
      : []),
  ];

  const handleSubmit = async () => {
    await submitExpense(expense.id).unwrap();
  };

  return (
    <div>
      <PageHeader
        title={expense.title ?? `${typeLabel} #${expense.id}`}
        badges={badges}
        backLabel="My Expenses"
        backHref="/my-expenses"
        totalLabel="Total Reimbursement"
        totalValue={fmtAmount(expense.amount, expense.currency)}
        actions={
          expense.status === "DRAFT" ? (
            <button
              className={hdrStyles.btnSolid}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit for Approval"}
            </button>
          ) : undefined
        }
      />

      <ExpenseDetailBody expense={expense} />
    </div>
  );
}

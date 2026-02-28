import ExpenseDetailView from "@/components/expenses/expense-detail-view";

export default function MyExpenseDetailPage({ params }: { params: { id: string } }) {
  return <ExpenseDetailView id={parseInt(params.id)} />;
}

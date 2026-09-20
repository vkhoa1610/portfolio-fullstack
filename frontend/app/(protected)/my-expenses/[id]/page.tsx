import ExpenseDetailView from "@/components/expenses/expense-detail-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MyExpenseDetailPage({ params }: Props) {
  const { id } = await params;
  return <ExpenseDetailView id={parseInt(id)} />;
}

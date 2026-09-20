import ExpenseReviewView from "@/components/expenses/expense-review-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MyExpenseReviewPage({ params }: Props) {
  const { id } = await params;
  return <ExpenseReviewView id={parseInt(id)} />;
}

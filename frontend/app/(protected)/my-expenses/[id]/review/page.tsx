import ExpenseReviewView from "@/components/expenses/expense-review-view";

export default function MyExpenseReviewPage({ params }: { params: { id: string } }) {
  return <ExpenseReviewView id={parseInt(params.id)} />;
}

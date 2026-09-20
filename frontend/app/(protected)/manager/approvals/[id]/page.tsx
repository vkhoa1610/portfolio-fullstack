import ApprovalDetailView from "@/components/manager/approval-detail-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApprovalDetailPage({ params }: Props) {
  const { id } = await params;
  return <ApprovalDetailView id={parseInt(id)} />;
}

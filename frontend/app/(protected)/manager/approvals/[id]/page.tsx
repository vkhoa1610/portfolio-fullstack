import ApprovalDetailView from "@/components/manager/approval-detail-view";

export default function ApprovalDetailPage({ params }: { params: { id: string } }) {
  return <ApprovalDetailView id={parseInt(params.id)} />;
}

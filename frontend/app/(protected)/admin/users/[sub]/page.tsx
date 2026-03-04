import AdminUserDetailView from "@/components/admin/admin-user-detail-view";

interface Props {
  params: Promise<{ sub: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { sub } = await params;
  return <AdminUserDetailView sub={sub} />;
}

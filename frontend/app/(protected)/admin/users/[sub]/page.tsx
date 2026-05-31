import AdminUserDetailView from "@/components/admin/admin-user-detail-view";

interface Props {
  params: Promise<{ sub: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { sub } = await params;
  // Cognito sub format `auth0|<hex>` — the pipe is URL-encoded as `%7C` in the path.
  // Next.js 15 leaves dynamic params raw, so decode here so downstream comparisons
  // (e.g. matching against API responses) work without surprises.
  return <AdminUserDetailView sub={decodeURIComponent(sub)} />;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen w-full">
      {/* Nơi chứa các màn hình Auth */}
      {children}
    </main>
  );
}

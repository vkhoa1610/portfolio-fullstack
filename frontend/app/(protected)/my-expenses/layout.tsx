import React from "react";

export default function MyExpensesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header Local */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meine Ausgaben (My Expenses)</h2>
          <p className="text-sm text-gray-500">Quản lý và theo dõi các khoản chi tiêu cá nhân.</p>
        </div>
        {/* Action Button sẽ được inject từ Page hoặc để đây nếu luôn cố định */}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
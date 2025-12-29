import React from "react";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Genehmigungen (Approvals)</h2>
          <p className="text-sm text-gray-500">Xem xét và phê duyệt yêu cầu từ nhân viên.</p>
        </div>
        <div className="flex gap-2">
           <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Team Budget: 85%</span>
        </div>
      </div>
      {children}
    </div>
  );
}
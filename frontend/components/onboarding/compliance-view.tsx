"use client";

import React, { useState } from "react";
import { Lock, Shield, ArrowRight } from "lucide-react";
import { AdCard, AdButton, AdCheckbox } from "@/common";

export default function ComplianceView() {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const canProceed = checked1 && checked2;

  return (
    <AdCard className="flex max-h-[90vh] w-full max-w-[500px] flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-success-50 text-success-700 inline-flex h-10 w-10 items-center justify-center rounded-full">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Datenschutz</h1>
        </div>
        <p className="text-sm text-neutral-500">
          Để tiếp tục, vui lòng đọc và đồng ý với các quy định bảo mật.
        </p>
      </div>

      {/* Scrollable Text Area */}
      <div className="flex-grow overflow-hidden px-8">
        <div className="h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-600 shadow-inner">
          <h3 className="mb-2 font-bold text-neutral-900">1. Xử lý dữ liệu (Datenverarbeitung)</h3>
          <p className="mb-3">
            Chúng tôi xử lý dữ liệu tài chính của bạn theo tiêu chuẩn GDPR nghiêm ngặt. Mọi dữ liệu
            chỉ phục vụ mục đích công việc.
          </p>

          <h3 className="mb-2 font-bold text-neutral-900">2. Máy chủ & Lưu trữ</h3>
          <p className="mb-3">
            Dữ liệu được mã hóa chuẩn AES-256 và lưu trữ tại Frankfurt (AWS eu-central-1), tuân thủ
            luật pháp CHLB Đức.
          </p>

          <h3 className="mb-2 font-bold text-neutral-900">3. Quyền lợi của bạn</h3>
          <p className="mb-3">
            Bạn có quyền truy cập, yêu cầu chỉnh sửa, hoặc xóa dữ liệu cá nhân (Right to be
            forgotten) bất cứ lúc nào thông qua cổng hỗ trợ.
          </p>

          <h3 className="mb-2 font-bold text-neutral-900">4. Bên thứ ba</h3>
          <p>
            Chúng tôi không chia sẻ dữ liệu cho bên thứ ba ngoại trừ các đối tác xử lý thanh toán
            (DATEV/SAP) được liệt kê trong phụ lục.
          </p>
        </div>
      </div>

      {/* Checkbox Section */}
      <div className="z-20 flex-shrink-0 space-y-4 bg-white px-8 py-6">
        <AdCheckbox
          label="Tôi đồng ý với việc xử lý dữ liệu cá nhân theo GDPR."
          checked={checked1}
          onChange={(e) => setChecked1(e.target.checked)}
        />

        <AdCheckbox
          label="Tôi chấp nhận các điều khoản sử dụng (AGBs)."
          checked={checked2}
          onChange={(e) => setChecked2(e.target.checked)}
        />

        {/* Logic Button */}
        <AdButton
          disabled={!canProceed}
          variant="secondary"
          fullWidth
          endIcon={<ArrowRight className="h-4 w-4" />}
          className="mt-2"
        >
          Tiếp tục
        </AdButton>
      </div>

      {/* Compliance Footer */}
      <div className="flex flex-shrink-0 items-center gap-2 border-t border-neutral-100 bg-neutral-50 px-8 py-3">
        <Shield className="text-success-500 h-3.5 w-3.5" />
        <span className="text-xs font-medium text-neutral-500">DSGVO-konform & Verschlüsselt</span>
      </div>
    </AdCard>
  );
}

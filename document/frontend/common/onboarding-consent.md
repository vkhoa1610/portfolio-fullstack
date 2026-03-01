# Onboarding Consent Screen — `/onboarding/compliance`

## Process Flow

```
User xem GDPR + ToS policies
  → Check từng checkbox để đồng ý
  → Submit khi đã đồng ý tất cả
  → Gọi BFF: POST /api/com-006 { policyIds }
  → Thành công → Redirect → /onboarding/profile
```

**Component**: `frontend/components/onboarding/` (compliance screen)
**Hook**: `useSubmitConsentMutation` từ `authApi`

---

## BFF Calls

### POST /api/com-006 — Submit Consent

#### Input gửi lên BFF

| Field     | Required | Type     | Ghi chú                              |
|-----------|----------|----------|--------------------------------------|
| policyIds | ✅       | number[] | ID các policy đã đồng ý              |

#### Output expect từ BFF

| Field         | Required | Type     |
|---------------|----------|----------|
| processStatus | ✅       | number   |
| message       | ✅       | string[] |

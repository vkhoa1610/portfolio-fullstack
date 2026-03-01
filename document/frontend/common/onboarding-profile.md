# Onboarding Profile Screen — `/onboarding/profile`

## Process Flow

```
User chọn ngôn ngữ (dropdown: German, English, Vietnamese, ...)
  → Submit
  → Gọi BFF: POST /api/com-007 { languageCode }
  → Thành công:
      → Refresh session (GET /api/com-004)
      → onboardingStatus sẽ là DONE
      → Redirect → /dashboard
```

**Component**: `frontend/components/onboarding/` (profile/language screen)
**Hook**: `useSubmitProfileMutation` từ `authApi`

---

## BFF Calls

### POST /api/com-007 — Submit Profile

#### Input gửi lên BFF

| Field        | Required | Type   | Ghi chú                      |
|--------------|----------|--------|------------------------------|
| languageCode | ✅       | string | Ví dụ: `de`, `en`, `vi`     |

#### Output expect từ BFF

| Field         | Required | Type     |
|---------------|----------|----------|
| processStatus | ✅       | number   |
| message       | ✅       | string[] |

# POST /api/v1/onboarding/profile

## Process Flow

```
BFF gọi từ com-007 (kèm languageCode)
  → Backend giải mã idToken → lấy cognito_sub
  → UPSERT user_profiles: set language_code, onboarding_status = DONE
  → Trả success
```

---

## API Endpoint

- **Method**: POST
- **Path**: `/api/v1/onboarding/profile`
- **Auth**: Bearer idToken

---

## Input (Request Body)

| Field        | Required | Type   | Ghi chú                  |
|--------------|----------|--------|--------------------------|
| languageCode | ✅       | string | Ví dụ: `de`, `en`, `vi` |

---

## Output (Response)

| Field         | Required | Type     |
|---------------|----------|----------|
| processStatus | ✅       | number   |
| message       | ✅       | string[] |

---

## SQL

```sql
INSERT INTO user_profiles (user_sub, language_code, onboarding_status, created_at)
VALUES (:cognito_sub, :languageCode, 'DONE', NOW())
ON CONFLICT (user_sub) DO UPDATE
  SET language_code = :languageCode,
      onboarding_status = 'DONE',
      updated_at = NOW();
```

**Table:** `user_profiles` — (user_sub, language_code, onboarding_status)

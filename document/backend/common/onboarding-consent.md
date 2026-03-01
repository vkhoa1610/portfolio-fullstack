# POST /api/v1/onboarding/consent

## Process Flow

```
BFF gọi từ com-006 (kèm policyIds, ipAddress, userAgent)
  → Backend giải mã idToken → lấy cognito_sub
  → Validate policyIds tồn tại trong bảng policies
  → Insert vào user_consents (với IP, UA, timestamp)
  → Trả success
```

---

## API Endpoint

- **Method**: POST
- **Path**: `/api/v1/onboarding/consent`
- **Auth**: Bearer idToken

---

## Input (Request Body)

| Field      | Required | Type     | Ghi chú                      |
|------------|----------|----------|------------------------------|
| policyIds  | ✅       | number[] | IDs của policies đồng ý      |
| ipAddress  | ✅       | string   | IP của client                |
| userAgent  | ✅       | string   | User-Agent của client        |

---

## Output (Response)

| Field         | Required | Type     |
|---------------|----------|----------|
| processStatus | ✅       | number   |
| message       | ✅       | string[] |

---

## SQL

```sql
-- Validate policies tồn tại
SELECT id FROM policies WHERE id IN (:policyIds);

-- Insert consent records
INSERT INTO user_consents (user_sub, policy_id, ip_address, user_agent, consented_at)
VALUES (:cognito_sub, :policy_id, :ipAddress, :userAgent, NOW())
ON CONFLICT (user_sub, policy_id) DO UPDATE
  SET consented_at = NOW(), ip_address = :ipAddress, user_agent = :userAgent;
```

**Tables:**
- `policies` — GDPR/ToS documents (versioned)
- `user_consents` — consent records (user_sub, policy_id, ip, ua, timestamp)

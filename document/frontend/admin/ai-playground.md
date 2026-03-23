# Admin — AI Playground

> Màn hình admin để test trực tiếp input/output của AI model (Ollama). Giống Swagger nhưng cho LLM — nhập system prompt + user prompt, xem response của model.

## Route

`/admin/ai-playground`

## Files

| File | Mô tả |
|------|-------|
| `app/(protected)/admin/ai-playground/page.tsx` | Page wrapper |
| `components/admin/ai-playground-view.tsx` | Split-panel UI |
| `ducks/admin/adminApi.ts` | RTK: `useAiPlaygroundChatMutation` → POST adm-017 |

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← AI Playground                        [Reset]             │
├──────────────────────────┬──────────────────────────────────┤
│  System Prompt           │  Output                          │
│  [textarea - fixed h]    │                                  │
│                          │  Model: llama3.2  4523ms         │
│  User Prompt             │                                  │
│  [textarea - flex-1]     │  Based on the expense data...    │
│                          │                                  │
│  [▶ Send to AI]          │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

Height: `calc(100vh - 120px)` — sử dụng toàn bộ viewport.

## State

| State | Mô tả |
|-------|-------|
| `systemPrompt` | System instruction — pre-filled với financial analyst prompt |
| `userPrompt` | User message — pre-filled với sample expense data |
| `result` | `{ response, model, durationMs }` hoặc `{ error, model, durationMs }` |

## Default Prompts

- **System**: "You are a financial analyst specializing in expense management and corporate finance."
- **User**: Sample JSON expense data cho 2026-03

## Error Handling

Khi Ollama offline/chưa start:
- Hiện error message với hướng dẫn start: `docker-compose --profile ai up ollama -d`
- Model name vẫn hiện để debug

## BFF Call

```
POST adm-017/ai-playground/chat
{ systemPrompt, userPrompt }
→ timeout 150s (BFF)
→ returns { response, model, durationMs } or { error, model, durationMs }
```

## Luồng vào màn hình

Sidebar (Admin) → "AI Playground" → `/admin/ai-playground`

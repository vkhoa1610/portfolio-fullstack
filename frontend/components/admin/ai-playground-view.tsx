"use client";

import { useState } from "react";
import { Cpu, Send, RotateCcw, Clock, AlertCircle, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAiPlaygroundChatMutation } from "@/ducks/admin/adminApi";
import MarkdownRenderer from "@/common/markdown-renderer/MarkdownRenderer";

const DEFAULT_SYSTEM_PROMPT =
  `You are a financial analyst assistant. Analyze the following expense report data and write a concise financial summary in Markdown format.\n\nUse these sections:\n## Executive Summary\n## Breakdown by Category\n## Anomalies Detected\n## Recommendations\n\nUse **bold** for key numbers. Use bullet lists where appropriate. Write in English. Be concise and professional.`;

const DEFAULT_USER_PROMPT =
  `Expense data (JSON):\n{\n  "period": "2026-03",\n  "summary": { "totalAmount": 3794.5, "expenseCount": 12, "avgAmount": 316.21 },\n  "byCategory": { "RECEIPT": { "count": 7, "amount": 2969.5 }, "PER_DIEM": { "count": 3, "amount": 760 }, "MILEAGE": { "count": 2, "amount": 165 } },\n  "anomalies": [{ "id": 5, "title": "Software License", "amount": 1500 }]\n}`;

export default function AiPlaygroundView() {
  const router = useRouter();
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_USER_PROMPT);

  const [chat, { isLoading }] = useAiPlaygroundChatMutation();
  const [result, setResult] = useState<{
    response?: string;
    error?: string;
    model: string;
    durationMs: number;
  } | null>(null);

  const handleSend = async () => {
    const res = await chat({ systemPrompt, userPrompt }).unwrap();
    setResult(res);
  };

  const handleReset = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setUserPrompt(DEFAULT_USER_PROMPT);
    setResult(null);
  };

  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin')}
          className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Cpu className="h-6 w-6 text-primary-500" />
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">AI Playground</h2>
          <p className="text-sm text-neutral-500">
            Test the AI model with custom prompts — calls backend → Ollama
          </p>
        </div>
        <button
          onClick={handleReset}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* Split panel */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left: Input */}
        <div className="w-2/5 flex flex-col gap-3 min-h-0">
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <label htmlFor="system-prompt" className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              System Prompt
            </label>
            <textarea
              id="system-prompt"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary-400"
              rows={8}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="System instructions for the model…"
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-h-0">
            <label htmlFor="user-prompt" className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              User Prompt
            </label>
            <textarea
              id="user-prompt"
              className="w-full h-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary-400"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Your message to the model…"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={isLoading || !userPrompt.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Waiting for model…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </button>
        </div>

        {/* Right: Output */}
        <div className="flex-1 flex flex-col border rounded-lg overflow-hidden bg-white">
          {/* Toolbar */}
          <div className="flex items-center gap-3 border-b bg-gray-50 px-4 py-2 text-xs text-neutral-500">
            <span className="font-medium text-neutral-700">Output</span>
            {result && (
              <>
                <span className="rounded bg-primary-100 px-2 py-0.5 text-primary-700 font-mono">
                  {result.model}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {(result.durationMs / 1000).toFixed(1)}s
                </span>
                {result.error && (
                  <span className="ml-auto flex items-center gap-1 text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Model error
                  </span>
                )}
              </>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {isLoading && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                  <p className="text-sm text-neutral-500">
                    Generating response… (may take 10–60s)
                  </p>
                </div>
              </div>
            )}

            {!isLoading && result?.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Model Error</p>
                    <p className="mt-1 text-sm text-red-600 font-mono">{result.error}</p>
                    <p className="mt-2 text-xs text-red-500">
                      Check that Ollama is running: <code>npm run docker:ai:on</code>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && result?.response && (
              <MarkdownRenderer markdown={result.response} />
            )}

            {!isLoading && !result && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Cpu className="mx-auto mb-3 h-10 w-10 text-neutral-200" />
                  <p className="text-sm text-neutral-400">
                    Write a prompt and click <strong>Send</strong> to test the model.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

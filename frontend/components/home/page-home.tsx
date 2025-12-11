"use client";
import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { increment } from "@/ducks/counterSlice";
import { RootState } from "@/ducks/store";
import { useCallApi1Query } from "@/ducks/apiSlice";

export default function PageHome() {
  const dispatch = useDispatch();
  const count = useSelector((state: RootState) => state.counter.value);

  // useMemo
  const computedValue = useMemo(() => count * 2, [count]);

  // Call API (GET) với query param userId = count
  const { data, isLoading, isError, error } = useCallApi1Query({ userId: count });

  return (
    <div className="rounded-md border p-4 shadow-md">
      <h2 className="mb-2 text-lg font-bold">Redux Counter: {count}</h2>
      <p>Computed value (x2): {computedValue}</p>

      <button
        onClick={() => dispatch(increment())}
        className={`mt-4 rounded px-4 py-2 text-white ${isLoading ? "bg-gray-400" : "bg-blue-500"}`}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "+ Increment"}
      </button>

      {isError && (
        <p className="mt-2 text-red-500">
          ❌ API Error: {typeof error === "object" ? JSON.stringify(error) : String(error)}
        </p>
      )}
      {data && <p className="mt-2 text-green-500">✅ API Response: {JSON.stringify(data)}</p>}
    </div>
  );
}

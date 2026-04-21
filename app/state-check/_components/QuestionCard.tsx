"use client";

import * as React from "react";
import type { Question, QuestionOptionId } from "../_lib/types";

export function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: Question;
  value?: QuestionOptionId;
  onChange: (next: QuestionOptionId) => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-5 py-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
          {question.title}
        </h2>
        {value ? (
          <span className="text-[11px] text-gray-500 shrink-0">回答済み</span>
        ) : (
          <span className="text-[11px] text-gray-400 shrink-0">未回答</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {question.options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={[
                "w-full text-left rounded-xl border px-4 py-3",
                "transition-colors active:scale-[0.99]",
                "focus:outline-none focus:ring-2 focus:ring-gray-300",
                selected
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
              ].join(" ")}
              aria-pressed={selected}
            >
              <div className="text-sm sm:text-base leading-relaxed">
                {opt.label}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}


"use client";

import { useMemo, useState } from "react";
import { Check, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteAutofillMemory, updateAutofillMemory } from "@/lib/actions/autofill-memory";
import { cn } from "@/lib/utils";

export type MemoryAnswer = {
  id: string;
  questionLabel: string;
  answer: string;
  kind: string;
  contextKey: string | null;
  updatedAt: string;
};

function scopeName(contextKey: string | null) {
  if (!contextKey) return "跨企业复用";
  try { return new URL(contextKey).hostname; } catch { return "当前企业"; }
}

export function AutofillMemoryCard({ initial }: { initial: MemoryAnswer[] }) {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? null);
  const [draft, setDraft] = useState({ questionLabel: initial[0]?.questionLabel ?? "", answer: initial[0]?.answer ?? "", shareAcrossCompanies: !initial[0]?.contextKey });
  const [saving, setSaving] = useState(false);
  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const filtered = useMemo(() => rows.filter((row) => `${row.questionLabel} ${row.answer}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);

  function select(row: MemoryAnswer) {
    setSelectedId(row.id);
    setDraft({ questionLabel: row.questionLabel, answer: row.answer, shareAcrossCompanies: !row.contextKey });
  }

  async function save() {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const res = await updateAutofillMemory(selected.id, draft);
      if (!res.ok) return void toast.error(res.message);
      const contextKey = draft.shareAcrossCompanies ? null : selected.contextKey;
      setRows((previous) => previous.map((row) => row.id === selected.id
        ? { ...row, questionLabel: draft.questionLabel.trim(), answer: draft.answer.trim(), contextKey, updatedAt: new Date().toISOString() }
        : row));
      toast.success("回答已更新，下次填充会使用新版");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected) return;
    const res = await deleteAutofillMemory(selected.id);
    if (!res.ok) return void toast.error(res.message);
    const next = rows.filter((row) => row.id !== selected.id);
    setRows(next);
    setSelectedId(next[0]?.id ?? null);
    setDraft({ questionLabel: next[0]?.questionLabel ?? "", answer: next[0]?.answer ?? "", shareAcrossCompanies: !next[0]?.contextKey });
    toast.success("已从回答库删除");
  }

  return (
    <Card id="answer-memory" className="scroll-mt-6 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">网申回答库</CardTitle>
        <p className="text-sm text-muted-foreground">这里保存你亲自写过、修改过或确认过的开放题回答。可随时改写；标为跨企业复用后，相似问题会优先用这份答案。</p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 px-5 py-8 text-center text-sm text-muted-foreground">还没有记住的回答。在网申浏览器填完开放题后，点「记住本页回答」。</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="min-w-0 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索问题或回答" className="pl-9" />
              </div>
              <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                {filtered.map((row) => (
                  <button key={row.id} type="button" onClick={() => select(row)} className={cn("w-full rounded-xl border p-3 text-left transition-colors", selectedId === row.id ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/35 hover:bg-muted/50")}>
                    <span className="block truncate text-sm font-medium">{row.questionLabel}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{row.answer}</span>
                    <span className="mt-2 block text-[11px] text-muted-foreground">{scopeName(row.contextKey)} · {new Date(row.updatedAt).toLocaleDateString("zh-CN")}</span>
                  </button>
                ))}
                {filtered.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">没有匹配的回答</p>}
              </div>
              <p className="text-xs text-muted-foreground">共 {rows.length} 条回答</p>
            </div>
            {selected && (
              <div className="min-w-0 space-y-4 rounded-2xl border border-border/60 bg-background/30 p-4 sm:p-5">
                <div>
                  <label htmlFor="memory-question" className="mb-1.5 block text-xs font-medium text-muted-foreground">问题</label>
                  <Input id="memory-question" value={draft.questionLabel} onChange={(event) => setDraft((current) => ({ ...current, questionLabel: event.target.value }))} />
                </div>
                <div>
                  <label htmlFor="memory-answer" className="mb-1.5 block text-xs font-medium text-muted-foreground">我的回答</label>
                  <Textarea id="memory-answer" rows={8} value={draft.answer} onChange={(event) => setDraft((current) => ({ ...current, answer: event.target.value }))} />
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={draft.shareAcrossCompanies} disabled={!selected.contextKey} onChange={(event) => setDraft((current) => ({ ...current, shareAcrossCompanies: event.target.checked }))} />
                  <span><span className="font-medium">跨企业复用</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{selected.contextKey ? "开启后，相似问题在其他企业也会优先使用这份回答。请先检查答案中有没有公司名或岗位专属内容。" : "这条已是通用回答；若不想继续复用，可以删除它。"}</span></span>
                </label>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
                  <ConfirmDeleteButton trigger={<Button type="button" size="sm" variant="ghost" className="text-destructive"><Trash2 className="size-4" />删除回答</Button>} title="删除这条网申回答？" description="删除后，下次遇到类似问题不会再复用它。" onConfirm={remove} />
                  <Button type="button" size="sm" disabled={saving || !draft.questionLabel.trim() || !draft.answer.trim()} onClick={save}><Check className="size-4" />{saving ? "保存中…" : "保存修改"}</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

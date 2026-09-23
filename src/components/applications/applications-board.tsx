"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, CalendarClock, ChevronRight, Clock3, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/stage-labels";
import { addStageUpdate } from "@/lib/actions/applications";
import { StageDateDialog } from "@/components/applications/stage-date-dialog";
import { windowStatus } from "@/lib/todos";
import { applicationStageStyle } from "@/lib/application-stage-style";
import { cn } from "@/lib/utils";
import type { ApplicationStage } from "@prisma/client";

export type BoardApplication = {
  id: string;
  companyName: string;
  title: string;
  currentStage: ApplicationStage;
  appliedDate: string;
  currentStageDate: string;
  nextDeadline: string | null;
  nextDeadlineEnd: string | null;
  /** Verbatim wording from the company's portal, via 网申进度同步. */
  portalStatus?: string | null;
};

/**
 * The live pipeline, one column per stage. A table sorted by date answers
 * "what did I apply to"; it does not answer "where am I stuck", which is the
 * question that actually matters mid-season — thirteen things sitting in
 * 简历筛选中 is visible at a glance here and invisible in a list.
 *
 * Terminal stages (rejected / accepted / declined) are folded into one
 * collapsed column: they're the majority of rows by the end of a season and
 * would otherwise push the active pipeline off-screen.
 */
const ACTIVE_STAGES: ApplicationStage[] = STAGE_ORDER.filter(
  (s) => !["REJECTED", "ACCEPTED", "DECLINED"].includes(s)
);

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

export function ApplicationsBoard({
  applications,
}: {
  applications: BoardApplication[];
}) {
  const [moving, setMoving] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<ApplicationStage | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{
    app: BoardApplication;
    stage: ApplicationStage;
  } | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<ApplicationStage, BoardApplication[]>();
    for (const stage of STAGE_ORDER) map.set(stage, []);
    for (const app of applications) map.get(app.currentStage)?.push(app);
    return map;
  }, [applications]);

  const closed = applications.filter((a) =>
    ["REJECTED", "ACCEPTED", "DECLINED"].includes(a.currentStage)
  );

  async function advance(app: BoardApplication, stage: ApplicationStage) {
    setMoving(app.id);
    try {
      await addStageUpdate(app.id, { stage });
      toast.success(`${app.companyName} → ${STAGE_LABELS[stage]}`);
    } catch {
      toast.error("更新失败，请重试");
    } finally {
      setMoving(null);
    }
  }

  function handleDrop(stage: ApplicationStage) {
    setDropTarget(null);
    if (!draggingId) return;
    const app = applications.find((a) => a.id === draggingId);
    setDraggingId(null);
    if (!app || app.currentStage === stage) return;
    setPendingDrop({ app, stage });
  }

  if (applications.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-border/80 bg-card/55 px-6 py-12 text-center backdrop-blur-sm">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10"><Send className="size-6" /></span>
        <h3 className="mt-5 text-base font-semibold">从第一份投递开始</h3>
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">添加投递记录后，这里会按阶段整理你的机会与下一步计划。</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <div className="flex snap-x gap-4 overflow-x-auto pb-5">
        {ACTIVE_STAGES.map((stage) => {
          const items = byStage.get(stage) ?? [];
          const next = ACTIVE_STAGES[ACTIVE_STAGES.indexOf(stage) + 1];
          const tone = applicationStageStyle(stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(stage);
              }}
              onDragLeave={() => setDropTarget((cur) => (cur === stage ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(stage);
              }}
              className={cn(
                "w-[17.5rem] shrink-0 snap-start rounded-[1.4rem] border border-border/65 bg-card/35 p-2.5 backdrop-blur-md transition-all duration-200",
                dropTarget === stage && "border-primary/60 bg-primary/5 ring-2 ring-primary/15"
              )}
            >
              <div className="flex items-center justify-between px-2.5 pb-3 pt-1.5">
                <span className="flex items-center gap-2.5 text-sm font-semibold">
                  <span className={cn("size-2 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.55)]", tone.dot)} />
                  {STAGE_LABELS[stage]}
                </span>
                <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs tabular-nums text-muted-foreground ring-1 ring-border/50">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border/80 bg-background/35 px-3 py-10 text-center text-xs text-muted-foreground">
                    {dropTarget === stage ? "松手移到这个阶段" : "暂无记录"}
                  </p>
                ) : (
                  items.map((app) => {
                    const stalled = daysSince(app.currentStageDate);
                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingId(app.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDropTarget(null);
                        }}
                        className={cn(
                          "group rounded-2xl border border-border/65 bg-card/90 p-3.5 shadow-[0_3px_12px_-8px_rgba(0,0,0,0.28)] transition-all duration-200 ease-(--ease-apple) hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_10px_25px_-14px_rgba(0,0,0,0.35)] active:cursor-grabbing",
                          draggingId === app.id ? "opacity-40" : "cursor-grab"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-sm font-semibold text-primary ring-1 ring-primary/10">
                            {app.companyName.slice(0, 1)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <Link href={`/applications/${app.id}`} className="group/link flex items-start justify-between gap-1 text-sm font-semibold leading-5 hover:text-primary">
                              <span className="truncate">{app.companyName}</span>
                              <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                            </Link>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{app.title}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] tabular-nums text-muted-foreground">
                          <span>投递 {app.appliedDate.slice(5, 10).replace("-", "/")}</span>
                          <span className={cn("flex items-center gap-1", stalled >= 14 && "font-medium text-amber-700 dark:text-amber-400")}>
                            <Clock3 className="size-3" />
                            {stalled === 0 ? "今天更新" : `停留 ${stalled} 天`}
                          </span>
                        </div>
                        {app.portalStatus && (
                          <p className="mt-2 truncate rounded-lg bg-muted/65 px-2 py-1.5 text-[11px] text-muted-foreground" title={`官网显示：${app.portalStatus}`}>
                            官网进度 · {app.portalStatus}
                          </p>
                        )}
                        {app.nextDeadline && (
                          <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                            <CalendarClock className="mt-0.5 size-3.5 shrink-0" />
                            {
                              windowStatus(
                                new Date(app.nextDeadline),
                                app.nextDeadlineEnd ? new Date(app.nextDeadlineEnd) : null
                              ).note
                            }
                          </p>
                        )}
                        {next && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-3 h-7 w-full justify-between rounded-lg bg-muted/55 px-2.5 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            disabled={moving === app.id}
                            onClick={() => advance(app, next)}
                          >
                            {moving === app.id ? "更新中..." : `推进到${STAGE_LABELS[next]}`}
                            <ChevronRight className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        </div>
        {/* Mobile only: on desktop the columns' own width makes "there's more"
            obvious, but on a narrow screen only ~2 columns fit and nothing
            else hints that 笔试/一面/Offer etc. are sitting off-screen. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent sm:hidden" />
      </div>

      {closed.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-card/65 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setShowClosed((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm"
          >
            <span className="font-medium">已结束（{closed.length}）</span>
            <span className="text-xs text-muted-foreground">
              {showClosed ? "收起" : "展开"}
            </span>
          </button>
          {showClosed && (
            <div className="flex flex-wrap gap-2 border-t p-3">
              {closed.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {app.companyName} · {STAGE_LABELS[app.currentStage]}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {applications.length > 0 && closed.length === applications.length && (
        <p className="text-sm text-muted-foreground">
          所有投递都已结束，看板上没有在进行中的了。
        </p>
      )}

      {pendingDrop && (
        <StageDateDialog
          applicationId={pendingDrop.app.id}
          companyName={pendingDrop.app.companyName}
          stage={pendingDrop.stage}
          onOpenChange={(open) => {
            if (!open) setPendingDrop(null);
          }}
          onDone={() => setPendingDrop(null)}
        />
      )}
    </div>
  );
}

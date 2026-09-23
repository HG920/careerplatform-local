import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { AddApplicationDialog } from "@/components/applications/add-application-dialog";
import { ApplicationsView } from "@/components/applications/applications-view";
import { PortalSyncButton } from "@/components/applications/portal-sync-button";

export default async function ApplicationsPage() {
  const user = await requireUser();

  const [applications, resumeVersions, portalCount] = await Promise.all([
    db.application.findMany({
      where: { userId: user.id },
      include: {
        company: true,
        // Only the entry matching the application's current stage is still
        // relevant to "what's next" — earlier stages' deadlines are history.
        // Deliberately NOT `orderBy: enteredAt desc, take: 1`: the very
        // first history row (APPLIED) stores enteredAt as a date-only value
        // parsed at UTC midnight, while every later row stores the real
        // instant of the update — for a same-day application from UTC+8,
        // that date-only midnight can sort *after* a same-day real
        // timestamp, so "latest by enteredAt" can silently pick the wrong
        // row. Matching on stage directly sidesteps the comparison.
        stageHistory: {
          select: { stage: true, nextDeadline: true, nextDeadlineEnd: true },
        },
      },
      orderBy: { appliedDate: "desc" },
    }),
    db.resumeVersion.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, isDefault: true },
      orderBy: { createdAt: "desc" },
    }),
    db.applicationPortal.count(),
  ]);

  const defaultResumeVersionId =
    resumeVersions.find((r) => r.isDefault)?.id ?? null;

  return (
    <div className="mx-auto max-w-[110rem] space-y-7">
      <div className="relative overflow-hidden rounded-[1.8rem] border border-border/65 bg-card/75 px-5 py-6 shadow-[0_18px_55px_-42px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-7 sm:py-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
              APPLICATION SPACE
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">投递记录</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">从发出申请到收到 Offer，把每一次进展收在同一个清晰的工作台。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <PortalSyncButton configuredCount={portalCount} />
          <AddApplicationDialog
            resumeVersions={resumeVersions}
            defaultResumeVersionId={defaultResumeVersionId}
          />
          </div>
        </div>
      </div>

      <ApplicationsView
        applications={applications.map((a) => {
          const currentEntry = a.stageHistory.find((h) => h.stage === a.currentStage);
          return {
            ...a,
            appliedDate: a.appliedDate.toISOString(),
            currentStageDate: a.currentStageDate.toISOString(),
            nextDeadline: currentEntry?.nextDeadline?.toISOString() ?? null,
            nextDeadlineEnd: currentEntry?.nextDeadlineEnd?.toISOString() ?? null,
          };
        })}
      />
    </div>
  );
}

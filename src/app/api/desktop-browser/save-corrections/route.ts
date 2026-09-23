import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const bodySchema = z.object({
  resumeVersionId: z.string().min(1),
  contextKey: z.string().max(300).nullable(),
  answers: z.array(z.object({
    questionLabel: z.string().trim().min(2).max(500),
    answer: z.string().trim().min(1).max(10000),
    answerId: z.string().optional(),
  })).min(1),
});

function companySpecific(label: string): boolean {
  return /公司|企业|岗位|职位|雇主|贵司|加入我们|选择我们|why (?:us|our|this company)|our company|this role/i.test(label);
}

/**
 * Store answers explicitly written or corrected by the user. These have
 * priority over AI drafts on future pages; generic questions are shared
 * across portals, while company-specific questions stay on one origin.
 */
export async function POST(request: Request) {
  const user = await requireUser();

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "请求格式不对" }, { status: 400 });
  }

  const { resumeVersionId, contextKey, answers } = parsed.data;
  const resume = await db.resumeVersion.findFirst({ where: { id: resumeVersionId, userId: user.id }, select: { id: true } });
  if (!resume) return NextResponse.json({ error: "选的简历不存在" }, { status: 400 });

  let saved = 0;
  for (const item of answers) {
    const scope = companySpecific(item.questionLabel) ? contextKey : null;
    if (companySpecific(item.questionLabel) && !scope) continue;
    const existing = item.answerId
      ? await db.autofillAnswer.findFirst({ where: { id: item.answerId, userId: user.id }, select: { id: true } })
      : await db.autofillAnswer.findFirst({
          where: { userId: user.id, questionLabel: item.questionLabel, contextKey: scope, kind: "essay", confirmed: true },
          select: { id: true },
        });
    if (existing) {
      await db.autofillAnswer.update({
        where: { id: existing.id },
        data: { answer: item.answer, questionLabel: item.questionLabel, contextKey: scope, kind: "essay", confirmed: true },
      });
    } else {
      await db.autofillAnswer.create({
        data: { userId: user.id, resumeVersionId, questionLabel: item.questionLabel, answer: item.answer, contextKey: scope, kind: "essay", confirmed: true },
      });
    }
    saved++;
  }

  return NextResponse.json({ saved });
}

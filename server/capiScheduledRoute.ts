import type { Request, Response } from "express";
import { runDailyCapiMonitor } from "./capiMonitor";
import { sdk } from "./_core/sdk";

export async function handleCapiDailySchedule(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req as any);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });

    const result = await runDailyCapiMonitor();
    return res.json({ ...result, taskUid: user.taskUid, checkedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message, checkedAt: new Date().toISOString() });
  }
}

import "server-only";
import { prisma } from "@/lib/prisma";
import { SETTING_DEFS, type SettingKey, type SettingsMap } from "@/lib/system-settings-defs";

export async function getAllSettings(): Promise<SettingsMap> {
  const rows = await prisma.systemSetting.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const map = {} as SettingsMap;
  for (const def of SETTING_DEFS) {
    map[def.key] = byKey.get(def.key) ?? "";
  }
  return map;
}

export async function updateSettings(values: Partial<SettingsMap>) {
  const entries = Object.entries(values) as [SettingKey, string][];
  for (const [key, value] of entries) {
    const def = SETTING_DEFS.find((d) => d.key === key);
    if (!def) continue;
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value, description: def.label },
      update: { value },
    });
  }
  return getAllSettings();
}

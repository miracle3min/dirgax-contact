import { query, queryOne } from './db';

export interface Credential {
  id: number;
  user_id: number;
  description: string;
  final_key: string;
  token: string;
  client_device_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Legacy interface for API compatibility
export interface LegacyCredential {
  id: number;
  description: string;
  finalKey: string;
  token: string;
  clientDeviceId: string;
  deleted?: boolean;
}

function toLegacy(c: Credential): LegacyCredential {
  return {
    id: c.id,
    description: c.description,
    finalKey: c.final_key,
    token: c.token,
    clientDeviceId: c.client_device_id,
    deleted: !c.is_active,
  };
}

export async function getCredentials(userId?: number): Promise<LegacyCredential[]> {
  const rows = userId
    ? await query<Credential>('SELECT * FROM credentials WHERE user_id = $1 AND is_active = true ORDER BY id', [userId])
    : await query<Credential>('SELECT * FROM credentials WHERE is_active = true ORDER BY id');
  return rows.map(toLegacy);
}

export async function getCredentialById(id: number): Promise<LegacyCredential | null> {
  const row = await queryOne<Credential>('SELECT * FROM credentials WHERE id = $1', [id]);
  return row ? toLegacy(row) : null;
}

export async function addCredential(
  userId: number,
  data: { description: string; finalKey: string; token: string; clientDeviceId: string }
): Promise<LegacyCredential> {
  const row = await queryOne<Credential>(
    `INSERT INTO credentials (user_id, description, final_key, token, client_device_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, data.description, data.finalKey, data.token, data.clientDeviceId]
  );
  if (!row) throw new Error('Failed to add credential');
  return toLegacy(row);
}

export async function updateCredential(
  id: number,
  data: Partial<{ description: string; finalKey: string; token: string; clientDeviceId: string }>
): Promise<LegacyCredential> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  if (data.description !== undefined) { sets.push(`description = $${idx++}`); vals.push(data.description); }
  if (data.finalKey !== undefined) { sets.push(`final_key = $${idx++}`); vals.push(data.finalKey); }
  if (data.token !== undefined) { sets.push(`token = $${idx++}`); vals.push(data.token); }
  if (data.clientDeviceId !== undefined) { sets.push(`client_device_id = $${idx++}`); vals.push(data.clientDeviceId); }
  sets.push(`updated_at = NOW()`);
  vals.push(id);

  const row = await queryOne<Credential>(
    `UPDATE credentials SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    vals
  );
  if (!row) throw new Error('Credential not found');
  return toLegacy(row);
}

export async function deleteCredential(id: number): Promise<void> {
  await query('UPDATE credentials SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
}

// Settings helpers
export interface UserSetting {
  setting_key: string;
  setting_value: string;
}

export async function getUserSettings(userId: number): Promise<Record<string, string>> {
  const rows = await query<UserSetting>(
    'SELECT setting_key, setting_value FROM settings WHERE user_id = $1',
    [userId]
  );
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.setting_key] = row.setting_value;
  }
  return result;
}

export async function setUserSetting(userId: number, key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO settings (user_id, setting_key, setting_value)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, setting_key)
     DO UPDATE SET setting_value = $3, updated_at = NOW()`,
    [userId, key, value]
  );
}

export async function deleteUserSetting(userId: number, key: string): Promise<void> {
  await query('DELETE FROM settings WHERE user_id = $1 AND setting_key = $2', [userId, key]);
}

// Keep backward compat
export function isUsingDatabase(): boolean {
  return true;
}

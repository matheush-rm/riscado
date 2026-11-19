import * as SecureStore from 'expo-secure-store';

const KEY = 'github-token';

/** OAuth App client id (device flow enabled). Override with EXPO_PUBLIC_GITHUB_CLIENT_ID. */
export const CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ?? '';

export const getToken = () => SecureStore.getItemAsync(KEY);
export const setToken = (t: string) => SecureStore.setItemAsync(KEY, t);
export const clearToken = () => SecureStore.deleteItemAsync(KEY);

export type DeviceCode = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

async function post<T>(url: string, body: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub: HTTP ${res.status}`);
  return res.json();
}

export async function startDeviceFlow(): Promise<DeviceCode> {
  if (!CLIENT_ID) throw new Error('Client ID do GitHub nao configurado no build. Use um token pessoal.');
  const r = await post<DeviceCode & { error_description?: string }>('https://github.com/login/device/code', {
    client_id: CLIENT_ID,
    scope: 'repo',
  });
  if (!r.device_code) throw new Error(r.error_description ?? 'Falha ao iniciar login');
  return r;
}

/** Polls until user authorizes. Resolves token. Rejects on expiry/denial/abort. */
export async function pollDeviceFlow(code: DeviceCode, signal: AbortSignal): Promise<string> {
  let interval = code.interval;
  const deadline = Date.now() + code.expires_in * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval * 1000));
    if (signal.aborted) throw new Error('cancelado');
    const r = await post<{ access_token?: string; error?: string; interval?: number }>(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        device_code: code.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      },
    );
    if (r.access_token) return r.access_token;
    if (r.error === 'slow_down') interval = r.interval ?? interval + 5;
    else if (r.error !== 'authorization_pending') throw new Error(r.error ?? 'erro no login');
  }
  throw new Error('codigo expirou');
}

import { decodeBase64, encodeBase64 } from './base64';

const API = 'https://api.github.com';

export class GithubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const isConflict = (e: unknown) => e instanceof GithubError && (e.status === 409 || e.status === 422);

export type Ctx = { token: string; repo: string; branch?: string };

async function req<T>(ctx: Pick<Ctx, 'token'>, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${ctx.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Cache-Control': 'no-cache',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = (await res.json()).message ?? msg;
    } catch {}
    throw new GithubError(res.status, msg || `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const enc = (p: string) => p.split('/').map(encodeURIComponent).join('/');
const ref = (ctx: Ctx) => (ctx.branch ? `?ref=${encodeURIComponent(ctx.branch)}` : '');

export async function getUser(token: string) {
  return req<{ login: string }>({ token }, '/user');
}

export async function getRepo(ctx: Ctx) {
  return req<{ full_name: string; default_branch: string; permissions?: { push: boolean } }>(
    ctx,
    `/repos/${ctx.repo}`,
  );
}

export type RemoteFile = { path: string; sha: string; content: string };

export async function getFile(ctx: Ctx, path: string): Promise<RemoteFile | null> {
  try {
    const r = await req<{ sha: string; content: string; path: string }>(
      ctx,
      `/repos/${ctx.repo}/contents/${enc(path)}${ref(ctx)}`,
    );
    return { path: r.path, sha: r.sha, content: decodeBase64(r.content ?? '') };
  } catch (e) {
    if (e instanceof GithubError && e.status === 404) return null;
    throw e;
  }
}

export async function putFile(ctx: Ctx, path: string, content: string, sha: string | undefined, message: string) {
  const r = await req<{ content: { sha: string } }>(ctx, `/repos/${ctx.repo}/contents/${enc(path)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      ...(sha ? { sha } : {}),
      ...(ctx.branch ? { branch: ctx.branch } : {}),
    }),
  });
  return r.content.sha;
}

export async function deleteFile(ctx: Ctx, path: string, sha: string, message: string) {
  await req(ctx, `/repos/${ctx.repo}/contents/${enc(path)}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha, ...(ctx.branch ? { branch: ctx.branch } : {}) }),
  });
}

export async function listDir(ctx: Ctx, folder: string): Promise<{ name: string; path: string; type: string }[]> {
  try {
    const r = await req<unknown>(ctx, `/repos/${ctx.repo}/contents/${enc(folder)}${ref(ctx)}`);
    return Array.isArray(r) ? r : [];
  } catch (e) {
    if (e instanceof GithubError && e.status === 404) return [];
    throw e;
  }
}

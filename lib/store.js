// Dual-mode persistence:
//  • Locally (no BLOB_READ_WRITE_TOKEN) → plain JSON files under ./data
//  • On Vercel (token present)          → Vercel Blob storage (PRIVATE access)
//
// PRIVATE access: blobs are NOT publicly reachable by URL. Every read is an
// authenticated server-side `get` using the store token, and binary assets
// (the signature image) are streamed to the browser through our own API
// route — the browser never receives a blob URL. This matters because the
// data includes salaries and bank account numbers.

import fs from "fs";
import path from "path";

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const DATA_DIR = path.join(process.cwd(), "data");
const BLOB_PREFIX = "data/";
const ACCESS = "private";

async function blobGet(name) {
  const { get } = await import("@vercel/blob");
  // useCache:false → always read fresh from origin (read-after-write safety).
  return get(BLOB_PREFIX + name, { access: ACCESS, useCache: false });
}

async function blobPut(name, body, contentType) {
  const { put } = await import("@vercel/blob");
  await put(BLOB_PREFIX + name, body, {
    access: ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
}

// ── JSON ──
export async function readJson(name, fallback) {
  if (useBlob) {
    const res = await blobGet(name);
    if (!res || res.statusCode !== 200) return fallback;
    try {
      return JSON.parse(await new Response(res.stream).text());
    } catch {
      return fallback;
    }
  }
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf-8"));
  } catch {
    return fallback;
  }
}

export async function writeJson(name, value) {
  if (useBlob) {
    await blobPut(name, JSON.stringify(value, null, 2), "application/json");
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(value, null, 2), "utf-8");
}

// ── Binary (e.g. the signature image) ──
export async function readBinary(name) {
  if (useBlob) {
    const res = await blobGet(name);
    if (!res || res.statusCode !== 200) return null;
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  }
  try {
    return fs.readFileSync(path.join(DATA_DIR, name));
  } catch {
    return null;
  }
}

export async function writeBinary(name, bytes, contentType) {
  if (useBlob) {
    await blobPut(name, bytes, contentType);
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, name), bytes);
}

export async function deleteBinary(name) {
  if (useBlob) {
    const { del } = await import("@vercel/blob");
    try {
      await del(BLOB_PREFIX + name);
    } catch {
      /* already gone */
    }
    return;
  }
  try {
    fs.unlinkSync(path.join(DATA_DIR, name));
  } catch {
    /* already gone */
  }
}

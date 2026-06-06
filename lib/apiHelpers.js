import { NextResponse } from "next/server";
import { isPersistentStorageReady } from "./store";

// Returns a 503 response if the server can't persist writes (e.g. deployed on
// Vercel without a Blob store connected), otherwise null.
export function storageGuard() {
  if (!isPersistentStorageReady()) {
    return NextResponse.json(
      {
        error:
          "Storage isn't configured on the server. Create a Vercel Blob store, connect it to this project, then redeploy.",
      },
      { status: 503 }
    );
  }
  return null;
}

// Logs the error and returns a 500 with a human message plus the real detail.
export function serverError(err, message = "Something went wrong.") {
  console.error(err);
  return NextResponse.json({ error: message, detail: String(err?.message || err) }, { status: 500 });
}

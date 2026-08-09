import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { requireAdmin } from "@/lib/get-session";

const f = createUploadthing();

export const uploadRouter = {
  // Only used for candidate photos today — gated to admins the same way every
  // other write path in the app is, since this endpoint is reachable directly
  // regardless of which page "hosts" the upload widget.
  candidatePhoto: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      try {
        const user = await requireAdmin();
        return { userId: user.id };
      } catch {
        throw new UploadThingError("Forbidden: admin access required");
      }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

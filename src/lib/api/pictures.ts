/**
 * Profile pictures and agency logos.
 *
 * The browser shrinks the chosen file to a square 512 px JPEG BEFORE sending it (a phone photo is several MB;
 * the result is usually well under 100 KB), so uploads are fast on slow connections and far below the server's 2 MB
 * limit. The server still checks the real bytes; this is a convenience, not the security boundary.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { http } from "./client";
import { loadSessionUser, requireAgencyId } from "./session-store";

export const PICTURE_INPUT_ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const OUTPUT_SIZE = 512;

/** Centre-crops to a square and re-encodes as JPEG. Throws a plain-English Error for unusable files. */
export async function preparePicture(file: File, background = "#ffffff"): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Please choose a JPEG, PNG or WebP picture.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("That picture is too large. Please choose one under 15 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That file could not be read as a picture. Please try another one.");
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process the picture.");
  ctx.fillStyle = background; // transparent PNGs get a clean backdrop instead of black
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Your browser could not process the picture.");
  return blob;
}

/** Pictures show in the top bar, member lists and more: refresh everything that carries one. */
function useAfterChange() {
  const queryClient = useQueryClient();
  return async () => {
    await loadSessionUser();
    await queryClient.invalidateQueries();
  };
}

export function useMyPicture() {
  const done = useAfterChange();
  return {
    upload: useMutation({
      mutationFn: (blob: Blob) => http("PUT", "/api/me/avatar", undefined, { binaryBody: { blob, contentType: "image/jpeg" } }),
      onSuccess: done,
    }),
    remove: useMutation({ mutationFn: () => http("DELETE", "/api/me/avatar"), onSuccess: done }),
  };
}

/** `agencyId` defaults to the signed-in agency administrator's own agency; platform staff pass the agency they are viewing. */
export function useAgencyLogo(agencyId?: string) {
  const done = useAfterChange();
  const id = () => agencyId ?? requireAgencyId();
  return {
    upload: useMutation({
      mutationFn: (blob: Blob) => http("PUT", `/api/agencies/${id()}/logo`, undefined, { binaryBody: { blob, contentType: "image/jpeg" } }),
      onSuccess: done,
    }),
    remove: useMutation({ mutationFn: () => http("DELETE", `/api/agencies/${id()}/logo`), onSuccess: done }),
  };
}

import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { uploadImageToSanity, uploadFileToSanity } from "@/lib/sanity";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) || "image";

  if (!file) return apiError("No file provided");

  const isImage = type === "image";
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
  const allowedTypes = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES;

  if (file.size > maxSize) {
    return apiError(`File too large (max ${maxSize / 1024 / 1024}MB)`);
  }

  if (!allowedTypes.includes(file.type)) {
    return apiError(`File type not allowed. Allowed: ${allowedTypes.join(", ")}`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const assetId = isImage
    ? await uploadImageToSanity(buffer, file.name, file.type)
    : await uploadFileToSanity(buffer, file.name, file.type);

  return apiSuccess({ assetId });
}

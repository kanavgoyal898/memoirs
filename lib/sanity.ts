import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || "fallback-id";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "production";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

export const publicSanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: true,
});

const builder = createImageUrlBuilder(publicSanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export async function uploadImageToSanity(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const asset = await sanityClient.assets.upload("image", file, {
    filename,
    contentType,
  });
  return asset._id;
}

export async function uploadFileToSanity(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const asset = await sanityClient.assets.upload("file", file, {
    filename,
    contentType,
  });
  return asset._id;
}

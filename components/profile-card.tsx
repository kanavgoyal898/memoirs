"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/sanity";
import { truncate } from "@/lib/utils";

interface ProfileCardProps {
  collegeEmail: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  quote: string;
  index: number;
}

export function ProfileCard({
  collegeEmail,
  firstName,
  lastName,
  profileImage,
  quote,
  index,
}: ProfileCardProps) {
  const imgUrl = profileImage
    ? urlFor(profileImage).width(400).height(400).fit("crop").url()
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: "6px 6px 0px #000" }}
      className="border-2 border-black bg-white shadow-[4px_4px_0px_#000] transition-shadow cursor-pointer"
    >
      <Link href={`/profile/${encodeURIComponent(collegeEmail)}`} className="block">
        <div className="aspect-square overflow-hidden border-b-2 border-black bg-neutral-100 relative">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={`${firstName} ${lastName}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl font-black text-neutral-300 select-none">
                {firstName[0]}{lastName[0]}
              </span>
            </div>
          )}
        </div>
        <div className="p-4 overflow-hidden">
          <p className="font-black text-base leading-tight truncate">
            {firstName} {lastName}
          </p>
          <p className="text-xs text-neutral-500 mt-1 font-medium truncate">{collegeEmail}</p>
          {quote && (
            <p className="text-sm mt-3 text-neutral-700 italic border-l-2 border-black pl-2 break-words line-clamp-3">
              {truncate(quote, 80)}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

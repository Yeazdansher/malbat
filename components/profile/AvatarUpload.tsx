"use client";

import { useRef, useState, useTransition } from "react";

import Avatar from "@/components/Avatar";
import { removeAvatar, uploadAvatar } from "@/app/profile/actions";
import { MAX_IMAGE_BYTES, validateImageFile } from "@/lib/storage/images";

type AvatarUploadProps = {
  avatarUrl: string | null;
  initials: string;
};

export default function AvatarUpload({
  avatarUrl,
  initials,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [localError, setLocalError] = useState("");

  return (
    <div className="flex flex-col items-center">
      <Avatar
        url={avatarUrl}
        initials={initials}
        sizeClassName="h-28 w-28"
        textClassName="text-4xl font-bold text-white"
      />

      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          event.target.value = "";

          const validated = validateImageFile(file);
          if (!validated.ok) {
            setLocalError(validated.error);
            return;
          }

          setLocalError("");
          const formData = new FormData();
          formData.set("avatar", validated.file);
          startTransition(() => {
            void uploadAvatar(formData);
          });
        }}
      />

      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="group relative flex flex-col items-center">
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            title={`JPEG, PNG oder WebP · max. ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB`}
            className="text-green-700 hover:underline disabled:opacity-60"
          >
            {pending
              ? "Wird gespeichert…"
              : avatarUrl
                ? "Profilbild ändern"
                : "Profilbild hochladen"}
          </button>
          <p className="pointer-events-none absolute top-full mt-1 hidden whitespace-nowrap text-center text-xs text-gray-500 group-hover:block">
            JPEG, PNG oder WebP · max.{" "}
            {Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB
          </p>
        </div>

        {avatarUrl && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setLocalError("");
              startTransition(() => {
                void removeAvatar();
              });
            }}
            className="text-sm text-red-600 hover:underline disabled:opacity-60"
          >
            Profilbild entfernen
          </button>
        )}
      </div>

      {localError && (
        <p className="mt-2 text-center text-sm text-red-600">{localError}</p>
      )}
    </div>
  );
}

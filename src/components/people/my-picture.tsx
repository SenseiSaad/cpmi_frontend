"use client";

import { Avatar, AgencyMark } from "@/components/ui/avatar";
import { PictureEditor } from "@/components/ui/picture-editor";
import { useAgencyLogo, useMyPicture } from "@/lib/api/pictures";
import { useSession } from "@/lib/auth/session";

/** The signed-in person's own picture; it shows in the top bar, member lists and reports. */
export function MyPicture() {
  const { user } = useSession();
  const { upload, remove } = useMyPicture();
  if (!user) return null;
  return (
    <PictureEditor
      preview={<Avatar first={user.firstName} last={user.lastName} size="xl" src={user.avatarUrl} />}
      title="Your picture"
      hint="A square photo works best. JPEG, PNG or WebP. It is resized for you and shown next to your name."
      hasPicture={!!user.avatarUrl}
      onUpload={(blob) => upload.mutateAsync(blob)}
      onRemove={() => remove.mutateAsync()}
    />
  );
}

/**
 * An agency's logo. Its own administrators and platform staff can change it, and either can replace what the
 * other set. Pass `agencyId` + `logoUrl` when platform staff look at an agency; omit them for your own agency.
 */
export function AgencyLogoEditor({ agencyId, name, logoUrl }: { agencyId?: string; name?: string; logoUrl?: string | null }) {
  const { user } = useSession();
  const { upload, remove } = useAgencyLogo(agencyId);
  const shownName = name ?? user?.agency?.displayName ?? "Agency";
  const shownLogo = agencyId ? logoUrl : user?.agency?.logoUrl;
  return (
    <PictureEditor
      preview={<AgencyMark name={shownName} src={shownLogo} size="xl" />}
      title="Agency logo"
      hint="Shown next to the agency's name for everyone in it. JPEG, PNG or WebP; a square logo on a plain background looks best."
      hasPicture={!!shownLogo}
      onUpload={(blob) => upload.mutateAsync(blob)}
      onRemove={() => remove.mutateAsync()}
    />
  );
}

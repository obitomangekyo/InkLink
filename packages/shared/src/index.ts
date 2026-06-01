export const productName = "InkLink";

export const boardVisibilityOptions = ["public", "unlisted", "invite-only", "private"] as const;

export type BoardVisibility = (typeof boardVisibilityOptions)[number];

export type UserPresence = {
  id: string;
  displayName: string;
  color: string;
  isGuest: boolean;
};

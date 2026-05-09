import { classNames } from "src/shared/lib";

import { getContactInitials } from "../../model/contact.helpers";

type AvatarSize = "sm" | "md" | "lg";

interface ContactAvatarProps {
  firstName: string;
  lastName: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function ContactAvatar({
  firstName,
  lastName,
  size = "md",
  className,
}: ContactAvatarProps) {
  const initials = getContactInitials({ firstName, lastName });

  return (
    <div
      className={classNames(
        "flex shrink-0 items-center justify-center rounded-full",
        "bg-primary/10 text-primary font-semibold select-none",
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

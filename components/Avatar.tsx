type AvatarProps = {
  url: string | null | undefined;
  initials: string;
  sizeClassName: string;
  textClassName?: string;
  roundedClassName?: string;
};

export default function Avatar({
  url,
  initials,
  sizeClassName,
  textClassName = "font-semibold text-white",
  roundedClassName = "rounded-full",
}: AvatarProps) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={`${sizeClassName} ${roundedClassName} object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClassName} ${roundedClassName} items-center justify-center bg-green-700 ${textClassName}`}
    >
      {initials}
    </div>
  );
}

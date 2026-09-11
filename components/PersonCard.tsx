"use client";

type PersonCardProps = {
  firstName: string;
  lastName: string;
  gender: "male" | "female" | "unknown";
  age: number;
  isDeceased: boolean;

  onOpenDetails: () => void;
  onOpenRelationship: () => void;
  onOpenParents?: () => void;
  onOpenSiblings?: () => void;
  hasParents?: boolean;
  canEdit?: boolean;
};

export default function PersonCard({
  firstName,
  lastName,
  gender,
  age,
  isDeceased,
  onOpenDetails,
  onOpenRelationship,
  onOpenParents,
  onOpenSiblings,
  hasParents = false,
  canEdit = true,
}: PersonCardProps) {
  return (
    <div className="relative w-[270px] rounded-md border border-gray-300 bg-white p-4 shadow-sm">

      {canEdit && !hasParents && (
        <button
          type="button"
          className="nodrag nopan nowheel absolute z-20 left-1/2 top-0 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-base leading-none hover:bg-green-100"
          title="Eltern hinzufügen"
          aria-label="Eltern hinzufügen"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpenParents?.();
          }}
        >
          👨‍👩‍👧‍👦
        </button>
      )}

      {canEdit && (
        <>
          <button
            type="button"
            className="nodrag nopan nowheel absolute z-20 left-0 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-base leading-none hover:bg-green-100"
            title="Geschwister hinzufügen"
            aria-label="Geschwister hinzufügen"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenSiblings?.();
            }}
          >
            👥
          </button>

          <button
            type="button"
            className="nodrag nopan nowheel absolute z-20 right-0 top-1/2 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-base leading-none hover:bg-green-100"
            title="Partner hinzufügen"
            aria-label="Partner hinzufügen"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenRelationship();
            }}
          >
            👩‍❤️‍👨
          </button>
        </>
      )}

      <div className="flex gap-3">

        <div className="flex h-14 w-14 items-center justify-center rounded bg-green-700 text-lg font-bold text-white">
          {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
        </div>

        <div className="flex-1">

          <div className="flex items-center gap-2">

            <span className="text-xl">
              {gender === "male"
                ? "♂"
                : gender === "female"
                ? "♀"
                : "?"}
            </span>

            <h3 className="font-semibold leading-5">
              {firstName} {lastName}
            </h3>

          </div>

          <div className="mt-3 flex items-center gap-2 text-gray-600">

            <span className="text-lg">
              {isDeceased ? "✝" : "🎂"}
            </span>

            <span>{age} Jahre</span>

          </div>

        </div>

      </div>

      <div className="mt-5">

        <button
          onClick={onOpenDetails}
          className="w-full rounded border border-gray-300 py-2 text-sm transition hover:bg-gray-100"
        >
          Weitere Details
        </button>

      </div>

    </div>
  );
}
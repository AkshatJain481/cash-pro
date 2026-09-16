import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder shown until the app is running in the browser. */
export function ScreenSkeleton() {
  return (
    <div className="grid gap-3 @4xl/main:grid-cols-3 @4xl/main:gap-5" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-[212px] rounded-3xl @4xl/main:col-span-2 @4xl/main:h-[250px]" />
      <div className="grid grid-cols-2 gap-2 @4xl/main:gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[66px] rounded-2xl bg-card @4xl/main:h-auto" />
        ))}
      </div>
      <Skeleton className="h-[150px] rounded-2xl bg-card @4xl/main:col-span-3" />
      <Skeleton className="h-[180px] rounded-2xl bg-card @4xl/main:col-span-2" />
      <Skeleton className="h-[180px] rounded-2xl bg-card" />
    </div>
  );
}

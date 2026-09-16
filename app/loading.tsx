import { BrandMark } from "@/components/cash-pro/brand";
import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <BrandMark className="size-14 animate-pulse" />
      <Spinner className="text-muted-foreground" />
    </div>
  );
}

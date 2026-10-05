import { Suspense } from "react";
import { ScheduleClient } from "@/components/ScheduleClient";
import { ScheduleSkeleton } from "@/components/StatesUI";

export const dynamic = "force-dynamic";

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleSkeleton />}>
      <ScheduleClient />
    </Suspense>
  );
}

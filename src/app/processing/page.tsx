import { Factory } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";
import ProcessingWorkspace, {
  type GradingSessionRow,
  type InwardSlipRow,
  type PackingSessionRow
} from "./_components/ProcessingWorkspace";

export const dynamic = "force-dynamic";

export default async function ProcessingPage() {
  const supabase = createServerAnonSupabaseClient();
  const [{ data: inwardRows }, { data: gradingRows }, { data: packingRows }] = (await Promise.all([
    supabase
      .from("inward_slips")
      .select("*")
      .eq("company_id", demoSession.company.id)
      .order("datetime_in", { ascending: false })
      .limit(500),
    supabase
      .from("grading_sessions")
      .select("*")
      .eq("company_id", demoSession.company.id)
      .order("grading_date", { ascending: false })
      .limit(500),
    supabase
      .from("packing_sessions")
      .select("*")
      .eq("company_id", demoSession.company.id)
      .order("packing_date", { ascending: false })
      .limit(500)
  ])) as [
    { data: InwardSlipRow[] | null },
    { data: GradingSessionRow[] | null },
    { data: PackingSessionRow[] | null }
  ];

  return (
    <AppShell
      eyebrow="Processing"
      title="Processing Workspace"
      subtitle="Inward, grading, and packing."
      action={
        <div className="secondary-inline">
          <Factory size={17} />
          INWARDDATA
        </div>
      }
    >
      <ProcessingWorkspace
        gradingRows={gradingRows ?? []}
        inwardRows={inwardRows ?? []}
        packingRows={packingRows ?? []}
      />
    </AppShell>
  );
}

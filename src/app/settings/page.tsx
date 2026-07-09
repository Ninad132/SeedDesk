import { Settings } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { demoSession } from "@/lib/session";
import { createServerAnonSupabaseClient } from "@/lib/supabase/server";

type CompanySettingsRow = {
  allow_negative_stock: boolean;
  currency_code: string;
  invoice_prefix: string;
};

type CompanyRow = {
  address: string | null;
  id: string;
  name: string;
  phone: string | null;
  seed_license_number: string | null;
};

export default async function SettingsPage() {
  const fallbackCompany = demoSession.company;
  const supabase = createServerAnonSupabaseClient();
  const { data: company } = (await supabase
    .from("companies")
    .select("id,name,address,phone,seed_license_number")
    .eq("id", fallbackCompany.id)
    .maybeSingle()) as { data: CompanyRow | null };
  const { data: settings } = (await supabase
    .from("company_settings")
    .select("invoice_prefix,currency_code,allow_negative_stock")
    .eq("company_id", fallbackCompany.id)
    .maybeSingle()) as { data: CompanySettingsRow | null };

  const displayCompany = {
    address: company?.address ?? fallbackCompany.address,
    invoicePrefix: settings?.invoice_prefix ?? fallbackCompany.invoicePrefix,
    name: company?.name ?? fallbackCompany.name,
    phone: company?.phone ?? fallbackCompany.phone,
    seedLicenseNumber: company?.seed_license_number ?? fallbackCompany.seedLicenseNumber
  };

  return (
    <AppShell eyebrow="Settings" title="Company settings" subtitle="Company profile and preferences.">
      <article className="panel">
        <div className="panel-heading">
          <Settings size={19} />
          <h3>Company details</h3>
        </div>
        <dl className="details-list">
          <div>
            <dt>Company</dt>
            <dd>{displayCompany.name}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{displayCompany.address}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{displayCompany.phone}</dd>
          </div>
          <div>
            <dt>SEED LIC NO</dt>
            <dd>{displayCompany.seedLicenseNumber}</dd>
          </div>
          <div>
            <dt>Invoice prefix</dt>
            <dd>{displayCompany.invoicePrefix}</dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>{settings?.currency_code ?? "INR"}</dd>
          </div>
          <div>
            <dt>Allow negative stock</dt>
            <dd>{settings?.allow_negative_stock ? "Yes" : "No"}</dd>
          </div>
        </dl>
      </article>
    </AppShell>
  );
}

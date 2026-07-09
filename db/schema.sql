create extension if not exists "uuid-ossp";

create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  legal_name text,
  address text,
  phone text,
  seed_license_number text,
  default_language text not null default 'en' check (default_language in ('en', 'hi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_settings (
  company_id uuid primary key references companies(id) on delete cascade,
  invoice_prefix text not null default 'VS',
  next_invoice_number integer not null default 1,
  currency_code text not null default 'INR',
  allow_negative_stock boolean not null default false,
  show_hindi_invoice_labels boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text unique,
  phone text,
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff')),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  village text,
  mobile text,
  opening_balance numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_company_name_idx on customers(company_id, name);
create index if not exists customers_company_mobile_idx on customers(company_id, mobile);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  crop text not null default 'Wheat',
  variety_name text not null,
  display_name text not null,
  default_packing_kg numeric(8,2) not null default 40,
  default_rate numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_company_display_idx on products(company_id, display_name);

create table if not exists seed_lots (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  inward_slip_id uuid,
  grading_session_id uuid,
  packing_session_id uuid,
  lot_number text not null,
  seed_class text,
  packing_kg numeric(8,2) not null default 40,
  rate numeric(12,2) not null default 0,
  opening_bags numeric(12,2) not null default 0,
  current_bags numeric(12,2) not null default 0,
  hold_bags numeric(12,2) not null default 0,
  source_state text,
  received_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, product_id, lot_number, packing_kg)
);

create index if not exists seed_lots_company_stock_idx on seed_lots(company_id, current_bags);

create or replace view seed_lot_availability as
select
  sl.company_id,
  sl.id as seed_lot_id,
  p.crop,
  p.variety_name,
  p.display_name,
  sl.lot_number,
  sl.seed_class,
  sl.packing_kg,
  sl.rate,
  sl.opening_bags,
  sl.current_bags,
  sl.hold_bags,
  greatest(sl.current_bags - sl.hold_bags, 0) as available_bags,
  (greatest(sl.current_bags - sl.hold_bags, 0) * sl.packing_kg) / 100 as available_quintal,
  ((greatest(sl.current_bags - sl.hold_bags, 0) * sl.packing_kg) / 100) * sl.rate as available_value,
  case
    when greatest(sl.current_bags - sl.hold_bags, 0) <= 0 then 'sold_out'
    when greatest(sl.current_bags - sl.hold_bags, 0) <= 10 then 'low_stock'
    else 'healthy'
  end as stock_status,
  sl.source_state,
  sl.inward_slip_id,
  sl.grading_session_id,
  sl.packing_session_id
from seed_lots sl
join products p on p.id = sl.product_id;

create table if not exists purchases (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  purchase_date date not null,
  supplier_name text,
  notes text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_items (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  purchase_id uuid not null references purchases(id) on delete cascade,
  seed_lot_id uuid not null references seed_lots(id) on delete restrict,
  bags numeric(12,2) not null,
  packing_kg numeric(8,2) not null,
  quantity_quintal numeric(12,2) generated always as ((bags * packing_kg) / 100) stored,
  rate numeric(12,2) not null default 0,
  amount numeric(12,2) generated always as (((bags * packing_kg) / 100) * rate) stored
);

create table if not exists stock_adjustments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  seed_lot_id uuid not null references seed_lots(id) on delete restrict,
  adjustment_date date not null,
  adjustment_type text not null check (adjustment_type in ('add', 'remove', 'hold', 'release')),
  bags numeric(12,2) not null check (bags > 0),
  reason text not null,
  notes text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

create index if not exists stock_adjustments_company_date_idx on stock_adjustments(company_id, adjustment_date desc);
create index if not exists stock_adjustments_lot_idx on stock_adjustments(seed_lot_id);

create table if not exists inward_slips (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  slip_no integer not null,
  truck_no text,
  first_wt numeric(12,2) not null default 0,
  datetime_in timestamptz,
  second_wt numeric(12,2) not null default 0,
  datetime_out timestamptz,
  net_wt numeric(12,2) not null default 0,
  material_name text not null,
  supplier_name text not null,
  bags numeric(12,2) not null default 0,
  bag_size numeric(8,2) not null default 0,
  bag_wt numeric(12,2) not null default 0,
  wgt_bag numeric(12,4) not null default 0,
  bouncing numeric(12,4) not null default 0,
  net_weight_qtl numeric(12,4) not null default 0,
  moisture numeric(8,2),
  germination numeric(8,2),
  remark text,
  rate numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  cheque_amount numeric(12,2) not null default 0,
  cash_amount numeric(12,2) not null default 0,
  seed_type text not null default 'VS' check (seed_type in ('VS', 'TL')),
  purchase_id uuid references purchases(id) on delete set null,
  seed_lot_id uuid references seed_lots(id) on delete set null,
  shift text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, slip_no)
);

create index if not exists inward_slips_company_date_idx on inward_slips(company_id, datetime_in desc);
create index if not exists inward_slips_company_supplier_variety_idx on inward_slips(company_id, supplier_name, material_name);

create table if not exists grading_sessions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  inward_slip_id uuid references inward_slips(id) on delete cascade,
  grading_date date not null,
  supplier_name text not null,
  variety text not null,
  weight_receipt numeric(12,4) not null default 0,
  graded_bags numeric(12,2) not null default 0,
  graded_bag_size numeric(8,2) not null default 0,
  graded_quantity numeric(12,4) not null default 0,
  graded_loose numeric(12,4) not null default 0,
  total_graded numeric(12,4) not null default 0,
  undersize numeric(12,4) not null default 0,
  us_bags numeric(12,2) not null default 0,
  undersize_percent numeric(8,4) not null default 0,
  final_graded numeric(12,4) not null default 0,
  location text,
  difference numeric(12,4) not null default 0,
  moisture numeric(8,2),
  germination numeric(8,2),
  remark text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists grading_sessions_company_date_idx on grading_sessions(company_id, grading_date desc);
create index if not exists grading_sessions_company_supplier_variety_idx on grading_sessions(company_id, supplier_name, variety);
create index if not exists grading_sessions_inward_slip_idx on grading_sessions(inward_slip_id);

create table if not exists packing_sessions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  inward_slip_id uuid references inward_slips(id) on delete cascade,
  grading_session_id uuid references grading_sessions(id) on delete cascade,
  packing_date date not null,
  supplier_name text not null,
  variety text not null,
  graded_input numeric(12,4) not null default 0,
  packed_quantity_before numeric(12,4) not null default 0,
  remaining_quantity numeric(12,4) not null default 0,
  no_of_bags numeric(12,2) not null default 0,
  packing_bag_size numeric(8,2) not null default 0,
  packing_quantity numeric(12,4) not null default 0,
  packing_loose numeric(12,4) not null default 0,
  ghamsi numeric(12,4) not null default 0,
  total_packed numeric(12,4) not null default 0,
  difference numeric(12,4) not null default 0,
  moisture numeric(8,2),
  germination numeric(8,2),
  lot_no text,
  seed_type text not null default 'VS' check (seed_type in ('VS', 'TL')),
  rate numeric(12,2) not null default 0,
  seed_lot_id uuid references seed_lots(id) on delete set null,
  location text,
  remark text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists packing_sessions_company_date_idx on packing_sessions(company_id, packing_date desc);
create index if not exists packing_sessions_company_supplier_variety_idx on packing_sessions(company_id, supplier_name, variety);
create index if not exists packing_sessions_inward_slip_idx on packing_sessions(inward_slip_id);
create index if not exists packing_sessions_grading_session_idx on packing_sessions(grading_session_id);

create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  invoice_number integer not null,
  invoice_prefix text not null default 'VS',
  invoice_date date not null,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  village text,
  mobile text,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  due_amount numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'final', 'cancelled')),
  notes text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, invoice_prefix, invoice_number)
);

create index if not exists invoices_company_date_idx on invoices(company_id, invoice_date desc);
create index if not exists invoices_company_customer_idx on invoices(company_id, customer_id);

create table if not exists invoice_items (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  seed_lot_id uuid references seed_lots(id) on delete restrict,
  item_name text not null,
  bags numeric(12,2) not null,
  packing_kg numeric(8,2) not null,
  quantity_quintal numeric(12,2) generated always as ((bags * packing_kg) / 100) stored,
  rate numeric(12,2) not null,
  amount numeric(12,2) generated always as (((bags * packing_kg) / 100) * rate) stored
);

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  payment_date date not null,
  amount numeric(12,2) not null,
  mode text not null check (mode in ('cash', 'bank', 'card', 'credit_adjustment')),
  reference text,
  notes text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

create index if not exists payments_company_date_idx on payments(company_id, payment_date desc);

create or replace view sale_sheet_rows as
select
  i.company_id,
  i.invoice_number as "Invoice no",
  i.customer_name as "Customer name",
  i.village as "Village",
  i.mobile as "Mobile No",
  i.notes as "remark",
  ii.item_name as "Lot No",
  ii.bags as "Bags",
  ii.packing_kg as "Weight",
  ii.quantity_quintal as "Quantity",
  ii.rate as "Rate",
  ii.amount as "Amount",
  i.subtotal as "TOTAL BILL AMOUT",
  i.discount_amount as "Discoumt",
  i.grand_total as "GRAND TOTAL",
  coalesce(pay.card_pay, 0) as "Card Pay",
  coalesce(pay.cash_taken, 0) as "CASH TAKEN",
  i.due_amount as "Difference",
  i.invoice_date as "Date"
from invoices i
join invoice_items ii on ii.invoice_id = i.id
left join (
  select
    invoice_id,
    sum(case when mode in ('bank', 'card') then amount else 0 end) as card_pay,
    sum(case when mode = 'cash' then amount else 0 end) as cash_taken
  from payments
  group by invoice_id
) pay on pay.invoice_id = i.id;

create or replace view customer_balances as
with invoice_totals as (
  select
    company_id,
    customer_id,
    sum(grand_total) as grand_total
  from invoices
  where status = 'final'
  group by company_id, customer_id
),
payment_totals as (
  select
    company_id,
    customer_id,
    sum(amount) as paid_total
  from payments
  group by company_id, customer_id
)
select
  c.company_id,
  c.id as customer_id,
  c.name as "Customer name",
  c.village as "Village",
  c.mobile as "Mobile No",
  c.opening_balance as "Opening Difference",
  coalesce(i.grand_total, 0) as "GRAND TOTAL",
  coalesce(p.paid_total, 0) as "Received",
  c.opening_balance + coalesce(i.grand_total, 0) - coalesce(p.paid_total, 0) as "Difference"
from customers c
left join invoice_totals i on i.customer_id = c.id and i.company_id = c.company_id
left join payment_totals p on p.customer_id = c.id and p.company_id = c.company_id;

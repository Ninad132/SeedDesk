insert into companies (
  id,
  name,
  legal_name,
  address,
  phone,
  seed_license_number,
  default_language
) values (
  '00000000-0000-0000-0000-000000000001',
  'Vasundhara Seeds',
  'Vasundhara Seeds',
  '52, Rajaswa Colony, Tanki Path, Freeganj, Ujjain, Madhya Pradesh',
  '0734-2530547, 9425332517',
  '1178',
  'en'
) on conflict (id) do update set
  name = excluded.name,
  legal_name = excluded.legal_name,
  address = excluded.address,
  phone = excluded.phone,
  seed_license_number = excluded.seed_license_number,
  default_language = excluded.default_language,
  updated_at = now();

insert into company_settings (
  company_id,
  invoice_prefix,
  next_invoice_number,
  currency_code,
  allow_negative_stock,
  show_hindi_invoice_labels
) values (
  '00000000-0000-0000-0000-000000000001',
  'VS',
  1,
  'INR',
  false,
  true
) on conflict (company_id) do update set
  invoice_prefix = excluded.invoice_prefix,
  next_invoice_number = excluded.next_invoice_number,
  currency_code = excluded.currency_code,
  allow_negative_stock = excluded.allow_negative_stock,
  show_hindi_invoice_labels = excluded.show_hindi_invoice_labels,
  updated_at = now();

insert into app_users (
  id,
  company_id,
  name,
  email,
  role,
  preferred_language
) values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'Vasundhara Admin',
  'admin@vasundharaseeds.local',
  'owner',
  'en'
) on conflict (id) do update set
  company_id = excluded.company_id,
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  preferred_language = excluded.preferred_language,
  updated_at = now();

insert into products (
  id,
  company_id,
  crop,
  variety_name,
  display_name,
  default_packing_kg,
  default_rate
) values
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    'Wheat',
    'GW-513',
    'GW-513',
    40,
    5500
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000001',
    'Wheat',
    'HI-1650 (Pusa Ojaswi)',
    'HI-1650 (Pusa Ojaswi)',
    40,
    5500
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    'Gram',
    'JKG 5 Kabuli',
    'JKG 5 Kabuli',
    40,
    12000
  )
on conflict (id) do update set
  company_id = excluded.company_id,
  crop = excluded.crop,
  variety_name = excluded.variety_name,
  display_name = excluded.display_name,
  default_packing_kg = excluded.default_packing_kg,
  default_rate = excluded.default_rate,
  updated_at = now();

insert into seed_lots (
  id,
  company_id,
  product_id,
  lot_number,
  seed_class,
  packing_kg,
  rate,
  opening_bags,
  current_bags,
  hold_bags,
  source_state
) values
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000201',
    'MAR-25-12-763-20 (CI)',
    'CI',
    40,
    5500,
    300,
    300,
    0,
    'MP'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000202',
    'MAR-25-12-763-40 (FII)',
    'FII',
    40,
    5500,
    162,
    150,
    5,
    'MP'
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000203',
    '40KG',
    'TL',
    40,
    12000,
    48,
    6,
    0,
    'GJ'
  )
on conflict (id) do update set
  company_id = excluded.company_id,
  product_id = excluded.product_id,
  lot_number = excluded.lot_number,
  seed_class = excluded.seed_class,
  packing_kg = excluded.packing_kg,
  rate = excluded.rate,
  opening_bags = excluded.opening_bags,
  current_bags = excluded.current_bags,
  hold_bags = excluded.hold_bags,
  source_state = excluded.source_state,
  updated_at = now();

insert into customers (
  id,
  company_id,
  name,
  village,
  mobile,
  opening_balance,
  notes
) values
  (
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000001',
    'DINESH RAGHUWANSHI',
    'KAKARAYI',
    '9977096885',
    0,
    'VS'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000001',
    'SARANG',
    'HUH',
    '21212',
    2000,
    'Credit-vs'
  ),
  (
    '00000000-0000-0000-0000-000000000403',
    '00000000-0000-0000-0000-000000000001',
    'RAJESH PATIDAR',
    'UJJAIN',
    '9425332517',
    0,
    'BANK-VS'
  )
on conflict (id) do update set
  company_id = excluded.company_id,
  name = excluded.name,
  village = excluded.village,
  mobile = excluded.mobile,
  opening_balance = excluded.opening_balance,
  notes = excluded.notes,
  updated_at = now();

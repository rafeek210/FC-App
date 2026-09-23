-- Profiles: extends Supabase's built-in auth.users with app-specific role/status
create type user_role as enum ('admin', 'trainer', 'client');
create type user_status as enum ('active', 'inactive');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  status user_status not null default 'active',
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

-- Clients: extended profile info, one-to-one with a client-role profile
create table clients (
  id uuid primary key references profiles(id) on delete cascade,
  client_code text unique not null,
  dob date,
  joining_date date not null default current_date,
  joined_via text,
  primary_contact text,
  whatsapp_contact text,
  secondary_contact text,
  email text,
  fitness_goal text,
  health_conditions text,
  remarks text
);

-- Plans: master subscription plan templates
create type plan_status as enum ('active', 'inactive', 'open', 'closed');
create type plan_applicability as enum ('new', 'existing', 'new_and_existing');

create table plans (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  plan_type text,
  duration_days int not null,
  amount numeric(10,2),
  status plan_status not null default 'active',
  applicability plan_applicability not null default 'new_and_existing',
  allowed_leave_days int not null default 0,
  remarks text,
  created_at timestamptz not null default now()
);

-- Client subscriptions: individual instances of a plan assigned to a client
create table client_subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  plan_id uuid not null references plans(id),
  start_date date not null,
  end_date date not null,
  extended_days int not null default 0,
  extension_reason text,
  status plan_status not null default 'active',
  created_at timestamptz not null default now()
);

-- Sessions: daily session slots posted by trainers
create table sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  session_time time not null,
  zoom_link text,
  trainer_id uuid references profiles(id),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Attendance: logged when a client clicks Join
create table attendance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  session_id uuid not null references sessions(id),
  attendance_date date not null,
  joined_at timestamptz not null default now(),
  unique (client_id, session_id)
);

-- Leave applications
create type leave_status as enum ('pending', 'approved', 'rejected');

create table leave_applications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  client_subscription_id uuid not null references client_subscriptions(id),
  leave_date date not null,
  applied_date date not null default current_date,
  reason text,
  status leave_status not null default 'pending'
);

-- Progress logs: weight/water tracking from the client dashboard
create table progress_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  log_date date not null default current_date,
  weight_kg numeric(5,2),
  waist_cm numeric(5,2),
  water_ml int,
  unique (client_id, log_date)
);

drop table "pairing_grant";

create table "pairing_grant" (
  "pin_hash" text primary key not null,
  "issued_by" text references "device" ("id") on delete cascade,
  "expires_at" integer not null,
  "failed_attempts" integer not null default 0
);

create index "pairing_grant_issued_by" on "pairing_grant" ("issued_by");

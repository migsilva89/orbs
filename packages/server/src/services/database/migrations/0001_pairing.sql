create table "device" (
  "id" text primary key not null,
  "name" text not null,
  "token_hash" text not null unique,
  "created_at" integer not null
);

create table "pairing_grant" (
  "token_hash" text primary key not null,
  "issued_by" text references "device" ("id") on delete cascade,
  "expires_at" integer not null
);

create index "pairing_grant_issued_by" on "pairing_grant" ("issued_by");

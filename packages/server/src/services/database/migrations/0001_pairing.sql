create table "device" (
  "id" text primary key not null,
  "name" text not null,
  "tokenHash" text not null unique,
  "createdAt" integer not null
);

create table "pairingGrant" (
  "tokenHash" text primary key not null,
  "issuedBy" text references "device" ("id") on delete cascade,
  "expiresAt" integer not null
);

create index "pairingGrant_issuedBy" on "pairingGrant" ("issuedBy");

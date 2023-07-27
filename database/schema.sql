set client_min_messages to warning;

-- DANGER: this is NOT how to do it in the real world.
-- `drop schema` INSTANTLY ERASES EVERYTHING.
drop schema "public" cascade;

create schema "public";

CREATE TABLE "public"."users" (
	"userId" serial NOT NULL,
	"username" TEXT NOT NULL,
	"password" TEXT NOT NULL,
	"followable" BOOLEAN NOT NULL DEFAULT 'true',
	CONSTRAINT "users_pk" PRIMARY KEY ("userId")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "public"."favorites" (
	"favoritesId" serial NOT NULL,
	"userId" integer NOT NULL,
	"artId" integer NOT NULL,
	"description" TEXT DEFAULT NULL,
	"timeAdded" TIMESTAMP NOT NULL DEFAULT now(),
	CONSTRAINT "favorites_pk" PRIMARY KEY ("favoritesId")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "public"."followers" (
	"followersId" serial NOT NULL,
	"userId" integer NOT NULL,
	"followedUserId" integer NOT NULL,
	CONSTRAINT "followers_pk" PRIMARY KEY ("followersId")
) WITH (
  OIDS=FALSE
);

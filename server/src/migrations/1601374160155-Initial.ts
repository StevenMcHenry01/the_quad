import {MigrationInterface, QueryRunner} from "typeorm";

export class Initial1601374160155 implements MigrationInterface {
    name = 'Initial1601374160155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "upvote" ("value" integer NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, CONSTRAINT "PK_802ac6b9099f86aa24eb22d9c05" PRIMARY KEY ("userId", "postId"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "username" character varying NOT NULL, "email" character varying NOT NULL, "totalPoints" integer NOT NULL DEFAULT 0, "password" character varying NOT NULL, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sub_forum" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "UQ_f4e5622c2cee2bf80e283666717" UNIQUE ("name"), CONSTRAINT "PK_6f37c16e9a156012f375c6da156" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "body" character varying NOT NULL, "points" integer NOT NULL DEFAULT 0, "opId" integer NOT NULL, "subId" integer NOT NULL, "originalPosterId" integer, "subForumId" integer, CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "upvote" ADD CONSTRAINT "FK_3abd9f37a94f8db3c33bda4fdae" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "upvote" ADD CONSTRAINT "FK_efc79eb8b81262456adfcb87de1" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_0c03be8e0ff64efa23835248d07" FOREIGN KEY ("originalPosterId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_e8a8de49b621f493ea12f80d4e2" FOREIGN KEY ("subForumId") REFERENCES "sub_forum"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_e8a8de49b621f493ea12f80d4e2"`);
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_0c03be8e0ff64efa23835248d07"`);
        await queryRunner.query(`ALTER TABLE "upvote" DROP CONSTRAINT "FK_efc79eb8b81262456adfcb87de1"`);
        await queryRunner.query(`ALTER TABLE "upvote" DROP CONSTRAINT "FK_3abd9f37a94f8db3c33bda4fdae"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "sub_forum"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "upvote"`);
    }

}

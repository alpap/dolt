import { expect, it, afterAll, beforeAll } from "vitest";
import mysql, { ConnectionOptions } from "mysql2/promise";
import { Dolt } from "../src/Dolt";
import { ulid } from "ulid";
import { table } from "console";

const access: ConnectionOptions = {
  user: "root",
  database: "",
  password: "",
  host: "localhost",
  port: 3306,
};

let conn: mysql.Connection;
let dolt: Dolt;

beforeAll(async () => {
  conn = await mysql.createConnection(access);
  await conn.ping();
  expect(conn).toBeDefined();
});

it.sequential("create database", async () => {
  dolt = new Dolt(conn);
  await dolt.CreateDatabase("test");
  await dolt.CreateDatabase("test2");
  await dolt.CreateDatabase("test3");
  await dolt.CreateDatabase("test4");
  const databases = await dolt.ListDatabases();
  expect(databases).toContain("test");
  expect(databases).toContain("test2");
  expect(databases).toContain("test3");
  expect(databases).toContain("test4");
});

it("drop database", async () => {
  await dolt.CreateDatabase("test432");
  await dolt.DropDatabase("test432");
  const databases = await dolt.ListDatabases();
  expect(databases).not.toContain("test432");
});

it.sequential("list dataabses", async () => {
  const databases = await dolt.ListDatabases();
  expect(databases).toContain("test");
  expect(databases).toContain("test2");
  expect(databases).toContain("test3");
  expect(databases).toContain("test4");
});

// it.sequential("clone database", async () => {
//   await dolt.CloneDatabase({
//     from: "test4",
//     to: "test5",
//     branch: "main",
//     remote: "origin",
//     depth: 1,
//   });
//   const databases = await dolt.ListDatabases();
//   expect(databases).toContain("test5");
// });

it.sequential("add", async () => {
  conn.query("USE test2;");
  const table = ulid();
  await conn.query(`CREATE TABLE ${table} (id INT);`);
  await dolt.Add([table]);
  const sha = await dolt.Commit("message");
  expect(sha.length).greaterThan(3);
});

it.sequential("reset hard", async () => {
  conn.query("USE test2;");
  const table = ulid();
  await conn.query(`CREATE TABLE ${table} (id INT);`);
  await conn.query(`INSERT INTO ${table} (id) VALUES (1);`);
  await dolt.Add([table]);
  const sha = await dolt.Commit("message");
  await conn.query(`INSERT INTO ${table} (id) VALUES (3);`);
  let out = await conn.query(`SELECT * FROM ${table};`);
  expect(JSON.stringify(out[0])).toBe(
    JSON.stringify([
      {
        id: 1,
      },
      {
        id: 3,
      },
    ])
  );
  await dolt.Reset(sha, { hard: true });
  out = await conn.query(`SELECT * FROM ${table};`);
  expect(JSON.stringify(out[0])).toBe(
    JSON.stringify([
      {
        id: 1,
      },
    ])
  );
});

// it.sequential("revert", async () => {
//   conn.query("USE test2;");
//   const table = "test" + randomInt(100000);
//   await conn.query(`CREATE TABLE ${table} (id INT);`);
//   await conn.query(`INSERT INTO ${table} (id) VALUES (1);`);
//   await dolt.Add([table]);
//   const sha = await dolt.Commit("message");
//   await conn.query(`INSERT INTO ${table} (id) VALUES (3);`);
//   let out = await conn.query(`SELECT * FROM ${table};`);
//   const sha2 = await dolt.Commit("message", { all: true });
//   expect(JSON.stringify(out[0])).toBe(
//     JSON.stringify([
//       {
//         id: 1,
//       },
//       {
//         id: 3,
//       },
//     ])
//   );
//   await dolt.Revert("HEAD~1");
//   out = await conn.query(`SELECT * FROM ${table};`);
//   console.log("out[0] secccond :>> ", out[0]);
//   expect(JSON.stringify(out[0])).toBe(
//     JSON.stringify([
//       // needs fixing i am still missing
//       {
//         id: 1,
//       },
//     ])
//   );
// });

it.sequential("commit", async () => {
  conn.query("USE test2;");
  await conn.query(`CREATE TABLE ${ulid()} (id INT);`);
  const sha = await dolt.Commit("commit", { all: true });
  expect(sha.length).greaterThan(3);
});

it.sequential("tag", async () => {
  conn.query("USE test2;");
  const table = ulid();
  await conn.query(`CREATE TABLE ${table} (id INT);`);
  await conn.query(`INSERT INTO ${table} (id) VALUES (1);`);
  await dolt.Add([table]);
  const sha = await dolt.Commit("commit", { all: true });
  const res = await dolt.Tag(ulid(), sha, { message: "message" });
  expect(res).toBe(true);
});

it.sequential("tag", async () => {
  conn.query("USE test2;");
  const table = ulid();
  await conn.query(`CREATE TABLE ${table} (id INT);`);
  await conn.query(`INSERT INTO ${table} (id) VALUES (1);`);
  await dolt.Add([table]);
  const sha = await dolt.Commit("commit", { all: true });
  const res = await dolt.Tag(table, sha, { message: "message" });
  await dolt.DeleteTag(table);
  expect(res);
});

it("undrop", async () => {
  await dolt.CreateDatabase("test21");
  const dbs = await dolt.ListDatabases();
  expect(dbs).toContain("test21");
  await dolt.DropDatabase("test21");
  const dbs2 = await dolt.ListDatabases();
  expect(dbs2).not.toContain("test21");
  await dolt.Undrop("test21");
  const dbs3 = await dolt.ListDatabases();
  expect(dbs3).toContain("test21");
});

// find a good test
// it.sequential("update column tag", async () => {
//   await dolt.CreateDatabase("test21");
//   const dbs = await dolt.ListDatabases();
// });

// according to the examples this should fail but it succeeds???
it("verify constraints", async () => {
  const database = ulid();
  await dolt.CreateDatabase(database);
  await conn.query(`USE ${database};`);
  await conn.query(`CREATE TABLE parent (pk int PRIMARY KEY);`);
  await conn.query(`CREATE TABLE child (
    pk int PRIMARY KEY,
    parent_fk int,
    FOREIGN KEY (parent_fk) REFERENCES parent(pk));
    `);
  await conn.query(`SET dolt_force_transaction_commit = ON; `);
  await conn.query(`SET FOREIGN_KEY_CHECKS = OFF; `);
  await conn.query(`INSERT INTO PARENT VALUES (1); `);
  await conn.query(`INSERT INTO CHILD VALUES (1, -1);  `);

  let res = await dolt.VerifyConstraints();
  expect(res).toBe(false);
  res = await dolt.VerifyConstraints("parent");
  expect(res).toBe(false);
  res = await dolt.VerifyConstraints("child");
  expect(res).toBe(false);
});

afterAll(async () => {
  await conn.end();
});

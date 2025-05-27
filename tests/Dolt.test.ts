import { expect, it, afterAll } from "vitest";
import mysql, { ConnectionOptions } from "mysql2/promise";
import { Dolt } from "../src/Dolt";

const access: ConnectionOptions = {
  user: "root",
  database: "",
  password: "",
  host: "localhost",
  port: 3306,
};

let conn: mysql.Connection;
let dolt: Dolt;

it("connect to dolt", async () => {
  conn = await mysql.createConnection(access);
  await conn.ping();
  expect(conn).toBeDefined();
});

it("create database", async () => {
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
  await dolt.DropDatabase("test");
  const databases = await dolt.ListDatabases();
  expect(databases).not.toContain("test");
});

it("list dataabses", async () => {
  const databases = await dolt.ListDatabases();
  expect(databases).toContain("test2");
  expect(databases).toContain("test3");
  expect(databases).toContain("test4");
});

// it("clone database", async () => {
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

// it("commit", async () => {
//   await dolt.Commit("commit", false);
//   const databases = await dolt.ListDatabases();
//   expect(databases).toContain("test2");
//   expect(databases).toContain("test3");
//   expect(databases).toContain("test4");
// });

afterAll(async () => {
  await conn.end();
});

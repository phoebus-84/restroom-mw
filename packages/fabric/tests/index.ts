import anyTest, { TestFn } from "ava";
import bodyParser from "body-parser";
import express from "express";
import supertest, { SuperTest, Test } from "supertest";

const test = anyTest as TestFn<{ app: SuperTest<Test> }>;

process.env.ZENCODE_DIR = "./test/fixtures";
const zencode = require("../../core/src/index");
const fabric = require("../src/index");

test.before(async (t) => {
  const app = express();
  app.use(bodyParser.json());
  app.use(fabric.default);
  app.use("/*", zencode.default);
  t.context.app = supertest(app);
});

test.serial("Include fabric middleware but do not use fabric statements", async (t) => {
  const { app } = t.context;
  var res = await app.post("/fabric_no_step");
  t.is(res.status, 200, res.text);
});

test.serial("Read stored data", async (t) => {
  const { app } = t.context;
  var res = await app.post("/fabric_retrieve");
  t.is(res.status, 200, res.text);
  t.is(res.body.hash1, "YF8PGoaiaGQxIWROwpJxlUXNXx+FWyQgjM4BsMozER8=");
  t.is(res.body.hash2, "5Nn7QdfYc4n3VgBKIe4bPba+yaW1nmGyifAB2vTzdCA=");
});

test.serial("Store data", async (t) => {
  const { app } = t.context;
  var res = await app.post("/fabric_store");
  t.is(res.status, 200, res.text);
  t.is(typeof res.body.myTag, "string");
});

test.serial("Missing step", async (t) => {
  const { app } = t.context;
  var res = await app.post("/fabric_missing_step");
  t.is(res.status, 500, res.text);
  t.is(typeof res.body.exception, "string");
  t.is(res.body.exception.includes("One step is missing"), true);
});

test.serial("Init ledger, read&write and re-read", async (t) => {
  const { app } = t.context;
  var res = await app.post("/fabric_init");
  t.is(res.status, 200, res.text);
  t.is(res.body.exception, undefined);
  t.is(res.body.length, 0);

  const res1 = await app.post("/fabric_read_write");
  t.is(res1.status, 200, res1.text);
  t.is(res1.body.hash, "waS8LuZEWge+Y7k+zsG3cd58iw/o+vNKGS52U+fxeP0=");

  const res2 = await app.post("/fabric_read_write");
  t.is(res2.status, 200, res2.text);
  t.is(res2.body.hash, "PDHNX7wMa1zl8A9jBqSsEtMqxpPNVZqoEpTl28+odfg=");
});

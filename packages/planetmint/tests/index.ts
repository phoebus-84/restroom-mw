import anyTest, { TestFn } from "ava";
import bodyParser from "body-parser";
import express from "express";
import supertest, { SuperTest, Test } from "supertest";

const test = anyTest as TestFn<{ app: SuperTest<Test> }>;

process.env.ZENCODE_DIR = "./test/fixtures";
const zencode = require("../../core/src/index");
const planetmint = require("../src/index");

test.before(async (t) => {
  const app = express();
  app.use(bodyParser.json());
  app.use(planetmint.default);
  app.use("/*", zencode.default);
  t.context.app = supertest(app);
});

test("Store the signed tx of an asset", async (t) => {
  const { app } = t.context;
  const asset = {city: "Berlin", temperature: "22"};
  const res = await app.post("/planetmint_store_asset")
    .send({keys: {}, data: {asset}});
  t.is(res.status, 200, res.text);
  t.is(typeof res.body.txid, "string");
  t.is(res.body.txid.length, 64);
  console.log(`{ 'txid': ${res.body.txid} }`);
  const resRetrieve = await app.post("/planetmint_retrieve")
    .send({keys: {}, data: {"txid": res.body.txid}});
  t.is(res.body.hash, resRetrieve.body.hash);
});

test("Store the signed tx of an asset with metadata", async (t) => {
  const { app } = t.context;
  const res = await app.post("/planetmint_store_asset_metadata");
  t.is(res.status, 200, res.text);
  t.is(typeof res.body.txid, "string");
  t.is(res.body.txid.length, 64);
  console.log(`{ 'txid': ${res.body.txid} }`);
});

// Test network looks not persisten, we can only read
// what we store, joined with the "store test"
test.skip("Retrieve a zenroom object", async (t) => {
  const hash = "X3Ngi92hcL98N9SelgXAVu1SM8SXI18KZhFKTq4oyzo="
  const { app } = t.context;
  const res = await app.post("/planetmint_retrieve");
  t.is(res.status, 200, res.text);
  t.is(res.body.hash, hash);
});

test("Retrieve object that doesn't exist", async (t) => {
  const { app } = t.context;
  const res = await app.post("/planetmint_retrieve_no_exist");
  t.is(res.status, 500, res.text);
});

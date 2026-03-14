/**
 * Express server — TypeScript clone of the fake_info PHP project.
 *
 * Endpoints (all GET):
 *   /cpr
 *   /name-gender
 *   /name-gender-dob
 *   /cpr-name-gender
 *   /cpr-name-gender-dob
 *   /address
 *   /phone
 *   /person[?n=<1-100>]
 */
import express, { Request, Response, NextFunction } from "express";
import { FakeInfo } from "./src/FakeInfo";
import dotenv from "dotenv";
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

// Common headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Accept-version", "v1");
  next();
});

// Only GET is allowed
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Incorrect HTTP method" });
    return;
  }
  next();
});

app.get("/cpr", async (_req: Request, res: Response) => {
  const person = await FakeInfo.create();
  res.json({ CPR: person.getCpr() });
});

app.get("/name-gender", async (_req: Request, res: Response) => {
  const person = await FakeInfo.create();
  res.json(person.getFullNameAndGender());
});

app.get("/name-gender-dob", async (_req: Request, res: Response) => {
  const person = await FakeInfo.create();
  res.json(person.getFullNameGenderAndBirthDate());
});

app.get("/cpr-name-gender", async (_req: Request, res: Response) => {
  const person = await FakeInfo.create();
  res.json(person.getCprFullNameAndGender());
});

app.get("/cpr-name-gender-dob", async (_req: Request, res: Response) => {
  const person = await FakeInfo.create();
  res.json(person.getCprFullNameGenderAndBirthDate());
});

app.get("/address", async (_req: Request, res: Response) => {
  const person = await FakeInfo.create();
  res.json(person.getAddress());
});

app.get("/phone", async (_req: Request, res: Response) => {
  const person = await FakeInfo.create();
  res.json({ phoneNumber: person.getPhoneNumber() });
});

app.get("/person", async (req: Request, res: Response) => {
  const nParam = req.query.n;
  let numPersons: number;

  if (nParam === undefined) {
    numPersons = 1;
  } else {
    const parsed = parseInt(String(nParam), 10);
    numPersons = Math.abs(isNaN(parsed) ? 0 : parsed);
  }

  if (numPersons === 0) {
    res.status(400).json({ error: "Incorrect GET parameter value" });
    return;
  }

  if (numPersons === 1) {
    const person = await FakeInfo.create();
    res.json(person.getFakePerson());
  } else if (numPersons >= 2 && numPersons <= 100) {
    const persons = await FakeInfo.getFakePersons(numPersons);
    res.json(persons);
  } else {
    res.status(400).json({ error: "Incorrect GET parameter value" });
  }
});

// Catch-all 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Incorrect API endpoint" });
});

app.listen(PORT, () => {
  console.log(`fake_info server running on port ${PORT}`);
});

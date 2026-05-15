import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import { EJSON } from "bson";
import mongoose from "mongoose";
import { User } from "../src/modules/users/users.model.js";
import { Subject } from "../src/modules/subjects/subjects.model.js";
import { Topic } from "../src/modules/topics/topics.model.js";
import { Session } from "../src/modules/sessions/sessions.model.js";
import { Block } from "../src/modules/blocks/blocks.model.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, "../seed/demo-data.json");

const models = {
  users: User,
  subjects: Subject,
  topics: Topic,
  sessions: Session,
  blocks: Block,
};

const order = ["users", "subjects", "topics", "sessions", "blocks"];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from .env");
    process.exit(1);
  }

  const raw = EJSON.parse(readFileSync(seedPath, "utf8"));
  const { meta, ...collections } = raw;

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  for (const key of order) {
    const docs = collections[key];
    if (!docs?.length) continue;

    const Model = models[key];
    const ids = docs.map((d) => d._id);

    await Model.deleteMany({ _id: { $in: ids } });
    await Model.insertMany(docs, { ordered: true });

    console.log(`  ${key}: ${docs.length} document(s)`);
  }

  console.log("\nDemo data ready.");
  if (meta?.login) {
    console.log(`  Email:    ${meta.login.userEmail}`);
    console.log(`  Password: ${meta.login.userPassword}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

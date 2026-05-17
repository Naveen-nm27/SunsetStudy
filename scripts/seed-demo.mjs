import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { EJSON } from "bson";
import mongoose from "mongoose";
import { getMongoDbName, getMongoUri } from "../src/config/env.js";
import { User } from "../src/modules/users/users.model.js";
import { Subject } from "../src/modules/subjects/subjects.model.js";
import { Topic } from "../src/modules/topics/topics.model.js";
import { Session } from "../src/modules/sessions/sessions.model.js";
import { Block } from "../src/modules/blocks/blocks.model.js";

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
  const uri = getMongoUri();
  const dbName = getMongoDbName(uri);

  const raw = EJSON.parse(readFileSync(seedPath, "utf8"));
  const { meta, ...collections } = raw;

  await mongoose.connect(uri, dbName ? { dbName } : {});
  console.log(`Connected to MongoDB (database: ${dbName ?? mongoose.connection.db?.databaseName})`);

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

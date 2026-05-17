import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../../.env");

dotenv.config({ path: envPath });

export const getMongoUri = () => {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Add it to .env (e.g. MONGODB_URI=mongodb://localhost:27017/sunsetstudy)"
    );
  }
  return uri;
};

/** Database name from the URI path (e.g. .../sunsetstudy → sunsetstudy). */
export const getMongoDbName = (uri = getMongoUri()) => {
  try {
    const normalized = uri.replace(/^mongodb(\+srv)?:\/\//, "https://");
    const pathname = new URL(normalized).pathname;
    const name = pathname.replace(/^\//, "").split("/").filter(Boolean)[0];
    return name || undefined;
  } catch {
    return undefined;
  }
};

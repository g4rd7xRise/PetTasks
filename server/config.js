import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  port: process.env.PORT || "4000",
  jwkSecret: process.env.JWT_SECRET || "dev_secret_key_change_me",
  dbPath: process.env.DB_PATH || path.join(process.cwd(), "data.sqlite"),
};

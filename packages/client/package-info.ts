import fs from "fs";
import packageJson from "./package.json";

const packageName = packageJson.name;
const packageVersion = packageJson.version;

const content = `
export const packageName = () => "${packageName}";
export const packageVersion = () => "${packageVersion}";
`;

fs.writeFileSync("src/__metadata.ts", content);

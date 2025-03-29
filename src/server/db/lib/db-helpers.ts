import { readdirSync } from "node:fs";
import { resolve } from "node:path";

export function findSqliteFile() {
	const d1Path = resolve(process.cwd(), "./.wrangler/state/v3/d1");
	const dbFile = readdirSync(d1Path, {
		encoding: "utf-8",
		recursive: true,
	}).find((f) => f.endsWith(".sqlite"));

	if (!dbFile) {
		throw new Error(`.sqlite file not found in ${d1Path}`);
	}

	const filePath = resolve(d1Path, dbFile);

	return filePath;
}

import m0000 from "./0000_ambiguous_forgotten_one.sql";
import m0001 from "./0001_new_dreadnoughts.sql";
import m0002 from "./0002_high_reavers.sql";
import journal from "./meta/_journal.json";

export default {
	journal,
	migrations: {
		m0000,
		m0001,
		m0002,
	},
};

import m0000 from "./0000_round_rawhide_kid.sql";
import m0001 from "./0001_many_magneto.sql";
import journal from "./meta/_journal.json";

export default {
	journal,
	migrations: {
		m0000,
		m0001,
	},
};

import m0000 from "./0000_blue_mentor.sql";
import m0001 from "./0001_chubby_alex_power.sql";
import m0002 from "./0002_clumsy_rockslide.sql";
import m0003 from "./0003_wandering_killer_shrike.sql";
import journal from "./meta/_journal.json";

export default {
	journal,
	migrations: {
		m0000,
		m0001,
		m0002,
		m0003,
	},
};

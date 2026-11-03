import { ping, type Db } from '../db/database.js';

export interface HealthService {
	/** True when the database answers. */
	isDatabaseUp(): Promise<boolean>;
}

export function createHealthService(db: Db): HealthService {
	return { isDatabaseUp: () => ping(db) };
}

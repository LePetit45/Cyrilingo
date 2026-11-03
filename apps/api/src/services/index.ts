import type { Db } from '../db/database.js';
import { createHealthService, type HealthService } from './health.js';

/** Every service, built once at start and handed to the HTTP routes and the MCP tools. */
export interface Services {
	health: HealthService;
}

export function createServices(db: Db): Services {
	return { health: createHealthService(db) };
}

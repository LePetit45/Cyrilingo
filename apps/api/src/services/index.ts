import type { Config } from '../config.js';
import type { Db } from '../db/database.js';
import { createAccountService, type AccountService } from './account.js';
import { createAuthService, type AuthService } from './auth.js';
import { createHealthService, type HealthService } from './health.js';
import { createLoginAttempts } from './login-attempts.js';

/** Every service, built once at start and handed to the HTTP routes and the MCP tools. */
export interface Services {
	health: HealthService;
	auth: AuthService;
	account: AccountService;
	/** Which optional features are on, from the configuration. */
	features: { readAloud: boolean; google: boolean };
}

export function createServices(
	db: Db,
	config: Pick<Config, 'google' | 'azureSpeech'> = { google: null, azureSpeech: null },
	now?: () => Date
): Services {
	return {
		health: createHealthService(db),
		auth: createAuthService({ db, loginAttempts: createLoginAttempts(), now }),
		account: createAccountService(db),
		features: { readAloud: config.azureSpeech !== null, google: config.google !== null }
	};
}

/** More than this many failed sign-ins from one IP within the window are refused (AC-20). */
export const MAX_FAILED_SIGN_INS = 10;
export const FAILED_SIGN_IN_WINDOW_MS = 15 * 60 * 1000;

/** More than this many accounts created from one IP within the window are refused (AC-26). */
export const MAX_SIGN_UPS = 5;
export const SIGN_UP_WINDOW_MS = 60 * 60 * 1000;

/**
 * Events per IP over a sliding window (failed sign-ins, sign-ups), kept in memory: one API
 * process serves the app, and a restart forgetting them is acceptable.
 */
export interface IpLimit {
	/** True when this IP already reached the limit within the window. */
	isBlocked(ip: string, now: Date): boolean;
	record(ip: string, now: Date): void;
}

export function createIpLimit({ max, windowMs }: { max: number; windowMs: number }): IpLimit {
	const events = new Map<string, number[]>();

	const recent = (ip: string, now: Date) => {
		const since = now.getTime() - windowMs;
		const times = (events.get(ip) ?? []).filter((time) => time > since);
		if (times.length) events.set(ip, times);
		else events.delete(ip);
		return times;
	};

	return {
		isBlocked: (ip, now) => recent(ip, now).length >= max,
		record: (ip, now) => events.set(ip, [...recent(ip, now), now.getTime()])
	};
}

/** Failed sign-ins (AC-20). */
export const createLoginAttempts = () =>
	createIpLimit({ max: MAX_FAILED_SIGN_INS, windowMs: FAILED_SIGN_IN_WINDOW_MS });

/** Accounts created (AC-26). */
export const createSignUpLimit = () =>
	createIpLimit({ max: MAX_SIGN_UPS, windowMs: SIGN_UP_WINDOW_MS });

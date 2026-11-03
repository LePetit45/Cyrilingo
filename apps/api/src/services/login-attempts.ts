/** More than this many failed sign-ins from one IP within the window are refused (AC-20). */
export const MAX_FAILED_SIGN_INS = 10;
export const FAILED_SIGN_IN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Failed sign-ins per IP over a sliding window, kept in memory: one API process serves the app,
 * and a restart forgetting them is acceptable.
 */
export interface LoginAttempts {
	/** True when this IP already failed too often within the window. */
	isBlocked(ip: string, now: Date): boolean;
	recordFailure(ip: string, now: Date): void;
}

export function createLoginAttempts(): LoginAttempts {
	const failures = new Map<string, number[]>();

	const recent = (ip: string, now: Date) => {
		const since = now.getTime() - FAILED_SIGN_IN_WINDOW_MS;
		const times = (failures.get(ip) ?? []).filter((time) => time > since);
		if (times.length) failures.set(ip, times);
		else failures.delete(ip);
		return times;
	};

	return {
		isBlocked: (ip, now) => recent(ip, now).length >= MAX_FAILED_SIGN_INS,
		recordFailure: (ip, now) => failures.set(ip, [...recent(ip, now), now.getTime()])
	};
}

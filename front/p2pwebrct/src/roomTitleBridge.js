/** sessionStorage: название до JOIN (создатель комнаты). */
export const PENDING_TITLE_SESSION_PREFIX = 'munchkin_pending_room_title:';
/** localStorage: id комнаты → отображаемое имя (подстраховка списка, если сервер отстаёт). */
export const ROOM_TITLE_MAP_KEY = 'munchkin_room_title_by_id';
/** Query в URL при переходе в комнату после создания. */
export const ROOM_TITLE_QUERY = 'rn';

function sanitizeTitle(s) {
	return String(s || '')
		.trim()
		.replace(/[\u0000-\u001F\u007F]/g, '')
		.slice(0, 48);
}

export function rememberRoomTitleForClient(roomId, title) {
	const id = String(roomId || '').trim();
	const t = sanitizeTitle(title);
	if (!id || !t) {
		return;
	}
	try {
		sessionStorage.setItem(PENDING_TITLE_SESSION_PREFIX + id, t);
	} catch {
		// ignore
	}
	try {
		const raw = localStorage.getItem(ROOM_TITLE_MAP_KEY);
		const m = raw ? JSON.parse(raw) : {};
		if (typeof m !== 'object' || m === null) {
			throw new Error('bad map');
		}
		m[id] = t;
		localStorage.setItem(ROOM_TITLE_MAP_KEY, JSON.stringify(m));
	} catch {
		try {
			localStorage.setItem(ROOM_TITLE_MAP_KEY, JSON.stringify({ [id]: t }));
		} catch {
			// ignore
		}
	}
	if (typeof window !== 'undefined') {
		window.__munchkinPendingRoomTitles = window.__munchkinPendingRoomTitles || {};
		window.__munchkinPendingRoomTitles[id] = t;
	}
}

/**
 * Название для первого JOIN (приоритет: URL ?rn= → window → sessionStorage).
 * После чтения очищает query и sessionStorage для этой комнаты.
 */
export function consumeRoomTitleForJoin(roomId) {
	const id = String(roomId || '').trim();
	if (!id) {
		return '';
	}
	let t = '';
	if (typeof window !== 'undefined') {
		try {
			const sp = new URLSearchParams(window.location.search);
			const q = sp.get(ROOM_TITLE_QUERY);
			if (q) {
				t = decodeURIComponent(q.replace(/\+/g, '%20'));
			}
		} catch {
			// ignore
		}
		if (!sanitizeTitle(t) && window.__munchkinPendingRoomTitles && window.__munchkinPendingRoomTitles[id]) {
			t = String(window.__munchkinPendingRoomTitles[id]);
			try {
				delete window.__munchkinPendingRoomTitles[id];
			} catch {
				// ignore
			}
		}
	}
	if (!sanitizeTitle(t)) {
		try {
			t = sessionStorage.getItem(PENDING_TITLE_SESSION_PREFIX + id) || '';
		} catch {
			t = '';
		}
	}
	const out = sanitizeTitle(t);
	if (out) {
		try {
			sessionStorage.removeItem(PENDING_TITLE_SESSION_PREFIX + id);
		} catch {
			// ignore
		}
		try {
			const u = new URL(window.location.href);
			if (u.searchParams.has(ROOM_TITLE_QUERY)) {
				u.searchParams.delete(ROOM_TITLE_QUERY);
				const next = u.pathname + (u.search ? u.search : '') + (u.hash || '');
				window.history.replaceState({}, '', next);
			}
		} catch {
			// ignore
		}
	}
	return out;
}

export function getStoredRoomTitleForList(roomId) {
	const id = String(roomId || '').trim();
	if (!id) {
		return '';
	}
	try {
		const raw = localStorage.getItem(ROOM_TITLE_MAP_KEY);
		const m = raw ? JSON.parse(raw) : {};
		if (m && typeof m === 'object' && m[id]) {
			return sanitizeTitle(m[id]);
		}
	} catch {
		// ignore
	}
	return '';
}

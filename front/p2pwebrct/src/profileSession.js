/**
 * Профиль игрока в рамках вкладки: sessionStorage + токен вкладки (как у JOIN в useWebRTC).
 * localStorage для имён общий между вкладками — при игре в несколько вкладок на одном ПК
 * все «игроки» перетирали одно и то же имя.
 */

export function playerTokenStorageKey(scopeId) {
	return `munchkin_player_token:${scopeId || "global"}`;
}

export function getOrCreateTabPlayerToken(scopeId) {
	const key = playerTokenStorageKey(scopeId);
	try {
		const existing = sessionStorage.getItem(key);
		if (existing) {
			return existing;
		}
		const created =
			window.crypto && typeof window.crypto.randomUUID === "function"
				? window.crypto.randomUUID()
				: `${String(Date.now())}-${String(Math.random()).slice(2)}`;
		sessionStorage.setItem(key, created);
		return created;
	} catch {
		return window.crypto && typeof window.crypto.randomUUID === "function"
			? window.crypto.randomUUID()
			: `${String(Date.now())}-${String(Math.random()).slice(2)}`;
	}
}

export function getProfileStorageScopeIdFromLocation() {
	try {
		const m = String(window.location?.pathname || "").match(/\/room\/([^/]+)/);
		return m && m[1] ? m[1] : "global";
	} catch {
		return "global";
	}
}

function profileNameKey(scopeId) {
	const id = scopeId || "global";
	const t = getOrCreateTabPlayerToken(id);
	return `munchkin.profile.name.v1:${id}:${t}`;
}

function profileGenderKey(scopeId) {
	const id = scopeId || "global";
	const t = getOrCreateTabPlayerToken(id);
	return `munchkin.profile.gender.v1:${id}:${t}`;
}

function normalizeGenderStored(raw) {
	const g = String(raw || "").trim();
	const gl = g.toLowerCase();
	if (gl === "male") {
		return "Male";
	}
	if (gl === "female") {
		return "Female";
	}
	return "";
}

/**
 * @param {string} [scopeId] — id комнаты или "global" (главное меню)
 * @returns {{ name: string, gender: "Male" | "Female" | "" }}
 */
export function readTabProfile(scopeId) {
	const id = scopeId || "global";
	let name = "";
	let gender = "";
	try {
		name = (sessionStorage.getItem(profileNameKey(id)) || "").trim();
		gender = normalizeGenderStored(sessionStorage.getItem(profileGenderKey(id)));
	} catch {
		// ignore
	}
	if ((!name || !gender) && id === "global") {
		try {
			const ln = (localStorage.getItem("munchkin.playerName") || "").trim();
			const lg = normalizeGenderStored(localStorage.getItem("munchkin.playerGender"));
			if (!name && ln) {
				name = ln;
			}
			if (!gender && lg) {
				gender = lg;
			}
		} catch {
			// ignore
		}
	}
	return { name, gender };
}

/**
 * @param {string} [scopeId]
 * @param {string} name
 * @param {string} gender — "Male" | "Female"
 */
export function writeTabProfile(scopeId, name, gender) {
	const id = scopeId || "global";
	const n = String(name || "").trim();
	const g = gender === "Male" || gender === "Female" ? gender : "";
	try {
		sessionStorage.setItem(profileNameKey(id), n);
		sessionStorage.setItem(profileGenderKey(id), g);
	} catch {
		// ignore
	}
	if (id === "global") {
		try {
			if (n) {
				localStorage.setItem("munchkin.playerName", n);
			}
			if (g) {
				localStorage.setItem("munchkin.playerGender", g);
			}
		} catch {
			// ignore
		}
	}
}

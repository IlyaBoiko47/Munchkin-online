import { readTabProfile, writeTabProfile, getProfileStorageScopeIdFromLocation } from "./profileSession.js";

/**
 * Модалка «имя + пол». В комнате — отдельное хранилище на вкладку (sessionStorage + токен),
 * чтобы несколько вкладок на одном ПК не делили одно имя.
 * @param {{
 *   onApply?: (p: { name: string, gender: string }) => void;
 *   roomEntryPrompt?: boolean;
 *   storageScopeId?: string; // id комнаты или "global"; по умолчанию — из URL (/room/:id)
 * }} [options]
 */
export function hidePlayerProfileModal() {
	const existing = document.getElementById("player-profile-modal");
	if (existing) {
		existing.remove();
	}
}

export function openPlayerProfileModal(options = {}) {
	const onApply = typeof options.onApply === "function" ? options.onApply : null;

	hidePlayerProfileModal();

	const modal = document.createElement("div");
	modal.id = "player-profile-modal";
	modal.className = "wizard-taming-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-title";
	title.textContent = "Выбери имя и пол";
	const desc = document.createElement("div");
	desc.className = "wizard-taming-desc";
	desc.textContent = "Имя будет отображаться в сообщениях игры.";

	const storageScopeId =
		typeof options.storageScopeId === "string" && options.storageScopeId.trim()
			? options.storageScopeId.trim()
			: getProfileStorageScopeIdFromLocation();

	// roomEntryPrompt: окно при входе в комнату — подставляем сохранённые имя/пол этой вкладки / с сервера.
	const { name: tabName, gender: tabGender } = readTabProfile(storageScopeId);
	const storedName = tabName || "";
	const storedGenderNorm = tabGender === "Male" || tabGender === "Female" ? tabGender : "";

	const nameInput = document.createElement("input");
	nameInput.type = "text";
	nameInput.placeholder = "Имя игрока";
	nameInput.value = storedName;
	nameInput.maxLength = 18;
	nameInput.style.alignSelf = "center";
	nameInput.style.width = "min(520px, 88%)";
	nameInput.style.padding = "10px 12px";
	nameInput.style.fontSize = "22px";
	nameInput.style.borderRadius = "10px";
	nameInput.style.border = "2px solid rgba(255,255,255,0.22)";
	nameInput.style.background = "rgba(40, 44, 58, 0.95)";
	nameInput.style.color = "#fff";

	const genderWrap = document.createElement("div");
	genderWrap.style.display = "flex";
	genderWrap.style.justifyContent = "center";
	genderWrap.style.gap = "16px";
	genderWrap.style.flexWrap = "wrap";
	genderWrap.style.marginTop = "6px";

	const makeGenderBtn = (value, label) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.textContent = label;
		btn.dataset.gender = value;
		btn.style.padding = "8px 14px";
		btn.style.fontSize = "20px";
		btn.style.borderRadius = "10px";
		btn.style.border = "2px solid rgba(255, 255, 255, 0.24)";
		btn.style.background = "rgba(40, 44, 58, 0.95)";
		btn.style.color = "#fff";
		btn.style.cursor = "pointer";
		if (storedGenderNorm === value) {
			btn.classList.add("is-selected");
			btn.style.borderColor = "#8fd2ff";
			btn.style.boxShadow = "0 0 0 3px rgba(143, 210, 255, 0.32)";
		}
		return btn;
	};

	const maleBtn = makeGenderBtn("Male", "Мужской");
	const femaleBtn = makeGenderBtn("Female", "Женский");
	let selectedGender = storedGenderNorm === "Male" || storedGenderNorm === "Female" ? storedGenderNorm : "";

	const selectGender = (g) => {
		selectedGender = g;
		[maleBtn, femaleBtn].forEach((b) => {
			const isSel = b.dataset.gender === g;
			b.style.borderColor = isSel ? "#8fd2ff" : "rgba(255, 255, 255, 0.24)";
			b.style.boxShadow = isSel ? "0 0 0 3px rgba(143, 210, 255, 0.32)" : "";
		});
		applyBtn.disabled = !canApply();
	};

	maleBtn.addEventListener("click", () => selectGender("Male"));
	femaleBtn.addEventListener("click", () => selectGender("Female"));
	genderWrap.appendChild(maleBtn);
	genderWrap.appendChild(femaleBtn);

	const canApply = () => {
		const n = String(nameInput.value || "").trim();
		return n.length > 0 && (selectedGender === "Male" || selectedGender === "Female");
	};

	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-apply-btn";
	applyBtn.textContent = "Подтвердить";
	applyBtn.disabled = !canApply();

	nameInput.addEventListener("input", () => {
		applyBtn.disabled = !canApply();
	});

	applyBtn.addEventListener("click", () => {
		const name = String(nameInput.value || "").trim();
		if (!name || !(selectedGender === "Male" || selectedGender === "Female")) {
			return;
		}
		writeTabProfile(storageScopeId, name, selectedGender);
		if (onApply) {
			onApply({ name, gender: selectedGender });
		}
		try {
			window.dispatchEvent(new CustomEvent("munchkin:playerProfileStorageUpdated"));
		} catch {
			// ignore
		}
		hidePlayerProfileModal();
	});

	panel.appendChild(title);
	panel.appendChild(desc);
	panel.appendChild(nameInput);
	panel.appendChild(genderWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
}

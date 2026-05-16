/** Точка входа страницы обучения (tutorial_board.html). window.__TUTORIAL_BOARD задаётся в HTML. */
import './game.js';
import './card-block.js';
import './увеличение карточек во время игры.js';
import { setupTutorialScene } from './tutorial-board.js';

function runTutorial() {
	setupTutorialScene();
	// game.js initialize() может временно отключить зоны — включаем снова
	setTimeout(() => {
		import('./tutorial-runtime.js').then(({ configureTutorialGameState }) => {
			configureTutorialGameState();
		});
	}, 1200);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', runTutorial);
} else {
	runTutorial();
}

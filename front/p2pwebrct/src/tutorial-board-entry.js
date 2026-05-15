/** Точка входа страницы обучения (tutorial_board.html). window.__TUTORIAL_BOARD задаётся в HTML до этого скрипта. */
import './card-block.js';
import './увеличение карточек во время игры.js';
import { setupTutorialScene } from './tutorial-board.js';

function runTutorial() {
	setupTutorialScene();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', runTutorial);
} else {
	runTutorial();
}

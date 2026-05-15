const path = require('path');

/** Dev-сервер: статические .html из public/ и SPA для /lobby и /room */
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const mainEntry = webpackConfig.entry;
      webpackConfig.entry = {
        main: mainEntry,
        'tutorial-board': path.resolve(__dirname, 'src/tutorial-board-entry.js'),
      };
      const prevFilename = webpackConfig.output.filename;
      webpackConfig.output.filename = (pathData) => {
        if (pathData.chunk && pathData.chunk.name === 'tutorial-board') {
          return 'static/js/tutorial-board.bundle.js';
        }
        if (typeof prevFilename === 'function') {
          return prevFilename(pathData);
        }
        return prevFilename;
      };
      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {    devServerConfig.historyApiFallback = {
      disableDotRule: true,
      rewrites: [
        { from: /^\/$/, to: '/home.html' },
        { from: /^\/home\.html$/, to: '/home.html' },
        { from: /^\/start_of_play\.html$/, to: '/start_of_play.html' },
        { from: /^\/packs\.html$/, to: '/packs.html' },
        { from: /^\/1pack\.html$/, to: '/1pack.html' },
        { from: /^\/1cards\.html$/, to: '/1cards.html' },
        { from: /^\/menu_settings\.html$/, to: '/menu_settings.html' },
        { from: /^\/game_board\.html$/, to: '/game_board.html' },
        { from: /^\/tutorial_board\.html$/, to: '/tutorial_board.html' },
        { from: /^\/lobby/, to: '/index.html' },
        { from: /^\/room\//, to: '/index.html' },
        { from: /./, to: '/index.html' },
      ],
    };
    return devServerConfig;
  },
};

const config = require("./webpack.config.js");

let dir =
    "C:/Users/jvalentine/iCloudDrive/iCloud~md~obsidian/The Price of Revenge/.obsidian/plugins/obsidian-block-drag";
module.exports = {
    ...config,
    mode: "development",
    devtool: "inline-source-map",
    output: {
        ...config.output,
        path: dir
    },
    watchOptions: {
        ignored: ["styles.css", "*.js", "**/node_modules"]
    }
};

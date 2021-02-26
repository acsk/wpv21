"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUpdates = exports.welcomeScreen = void 0;
var boxen = require("boxen");
var chalk = require("chalk");
var latest_version_1 = require("latest-version");
var semver_1 = require("../utils/semver");
var version = require('../../package.json').version;
// Global
var welcomeShown = false;
var updatesChecked = false;
function welcomeScreen() {
    if (welcomeShown) {
        return;
    }
    welcomeShown = true;
    console.log("\n     \n    \u2590\u2588  \u2588\u2588  \u2588\u2591\u2590\u2588\u2580\u2580\u2580\u2591\u2590\u2588     \u2584\u2588\u2580\u2580\u2588\u2584 \u2584\u2588\u2580\u2580\u2588\u2584 \u2590\u2588\u2588   \u2588\u2588\u258C \u2593\u2588\u2580\u2580\u2580\u2591\n     \u2588\u258C\u2590\u2588\u2588\u2584\u2593\u2588 \u2590\u2588\u2584\u2584\u2584 \u2590\u2588    \u2590\u2588      \u2588\u2592  \u2590\u2588\u2584\u2590\u2588\u2580\u258C \u2590\u258C\u2588\u258C \u2593\u2588\u2584\u2584\u2584\n     \u2590\u2588\u2588 \u2590\u2588\u2588\u2591 \u2590\u2588    \u2590\u2588    \u2590\u2588\u2584  \u2584\u2580 \u2588\u258C  \u2590\u2588 \u2590\u2588 \u2588\u2593\u2588 \u2588\u258C \u2588\u2588\n      \u2580\u2580  \u2580\u2580  \u2580\u2580\u2580\u2580\u2580\u2591\u2590\u2580\u2580\u2580\u2580\u2580  \u2580\u2580\u2580\u2580   \u2580\u2580\u2580\u2580  \u2590\u2580  \u2580  \u2580\u2580 \u2580\u2580\u2580\u2580\u2580\n                                   \u2584\n      \u2584\u2584\u2591          \u2584 \u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584 \u2588\u2588         \u2584\u2584       \u2584\u2584\u2584\u2584      \u2591\n      \u2591\u2588\u2588\u2584        \u2588\u2588 \u2588\u2588\u2588\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2588\u258C \u2588\u2588\u2588\u258C       \u2588\u2588\u2584  \u2584\u2584\u2588\u2580\u2580\u2580\u2580\u2580\u2580\u2588\u2584   \u2593\u2588\u2584           \u2584\u2588\u2591\n       \u2591\u2588\u2588\u2584     \u2591\u2588\u2588\u2580 \u2588\u2588\u2588           \u2588\u2588\u2580\u2588\u2588\u2584     \u2588\u2588\u2584 \u2584\u2588\u2591        \u2580\u2588\u2584 \u2593\u2588\u2588\u2588\u2584      \u2591\u2588\u2588\u2588\u2588\u2591\n         \u2588\u2588\u258C   \u2584\u2588\u2588\u2591 \u2584\u2588\u2588\u2588\u2584\u2584\u2584\u2584       \u2588\u2588  \u2593\u2588\u2588\u2584   \u2588\u2588\u2584\u2590\u2588           \u2590\u2588 \u2593\u2588\u258C\u2580\u2588\u2588\u2584  \u2584\u2588\u2588\u2588\u2591\u2588\u2588\u2591\n          \u2588\u2588\u258C \u2584\u2588\u2588\u2591  \u2580\u2588\u2588\u2588\u2580\u2580\u2580\u2580       \u2588\u2588   \u2590\u2588\u2588\u258C  \u2588\u2588\u2584\u2590\u2588           \u2590\u2588\u2591\u2593\u2588\u258C  \u2580\u2588\u2588\u2588\u2588\u2588\u2591  \u2588\u2588\u2591\n           \u2593\u2588\u2588\u2588\u2588     \u2588\u2588\u2588           \u2588\u2588     \u2580\u2588\u2588\u2584\u2588\u2588\u2584 \u2588\u258C          \u2588\u2588 \u2593\u2588\u258C    \u2580\u2588\u2591    \u2588\u2588\u2591\n            \u2580\u2588\u2588      \u2588\u2588\u2588        \u2588\u258C \u2588\u2588       \u2580\u2588\u2588\u2588\u2584  \u2580\u2588\u2584     \u2584\u2584\u2588\u2580  \u2593\u2588\u258C           \u2588\u2588\u2591\n             \u2580       \u2580\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u258C \u2588\u2588        \u2591\u2588\u2588\u2584    \u2580\u2580\u2588\u2588\u2588\u2580\u2580\u2591    \u2580\u2588\u258C           \u2593\u2588\u2591\n                                              \u2580\u2591                                   \n");
}
exports.welcomeScreen = welcomeScreen;
function checkUpdates(spinnies) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!updatesChecked) return [3 /*break*/, 2];
                    spinnies.add('venom-version-spinner', {
                        text: 'Checking for updates',
                    });
                    return [4 /*yield*/, checkVenomVersion(spinnies)];
                case 1:
                    _a.sent();
                    updatesChecked = true;
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
exports.checkUpdates = checkUpdates;
/**
 * Checs for a new versoin of venom and logs
 */
function checkVenomVersion(spinnies) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    spinnies.update('venom-version-spinner', { text: 'Checking for updates...' });
                    return [4 /*yield*/, latest_version_1.default('venom-bot').then(function (latest) {
                            if (semver_1.upToDate(version, latest)) {
                                spinnies.succeed('venom-version-spinner', { text: "You're up to date" });
                            }
                            else {
                                spinnies.succeed('venom-version-spinner', {
                                    text: 'There is a new version available',
                                });
                                logUpdateAvailable(version, latest);
                            }
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Logs a boxen of instructions to update
 * @param current
 * @param latest
 */
function logUpdateAvailable(current, latest) {
    // prettier-ignore
    var newVersionLog = "There is a new version of " + chalk.bold("Venom") + " " + chalk.gray(current) + " \u279C  " + chalk.bold.green(latest) + "\n" +
        "Update your package by running:\n\n" +
        (chalk.bold('\>') + " " + chalk.blueBright('npm update venom-bot'));
    console.log(boxen(newVersionLog, { padding: 1 }));
    console.log("For more info visit: " + chalk.underline('https://github.com/orkestral/venom/blob/master/Update.md') + "\n");
}
//# sourceMappingURL=welcome.js.map
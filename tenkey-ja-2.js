// @ts-check

/**
 * キーコードを子音に変換
 * @param {string} keycode 
 */
function keyCodeToSiin(keycode) {
    switch (keycode) {
        case "Numpad7": return "a";
        case "Numpad8": return "k";
        case "Numpad9": return "s";
        case "Numpad4": return "t";
        case "Numpad5": return "n";
        case "Numpad6": return "h";
        case "Numpad1": return "m";
        case "Numpad2": return "y";
        case "Numpad3": return "r";
        case "Numpad0":
        case "NumpadDecimal": return "w";
        case "NumpadEnter": return "-";
        case "KeyQ": return "a";
        case "KeyW": return "k";
        case "KeyE": return "s";
        case "KeyA": return "t";
        case "KeyS": return "n";
        case "KeyD": return "h";
        case "KeyZ": return "m";
        case "KeyX": return "y";
        case "KeyC": return "r";
        case "KeyV": return "w";
        case "Enter": return "-";
    }
}

/** @type {{[type: string]: string}} */
const siinToTopKana = {
    a: "あいうえお",
    k: "かきくけこ",
    s: "さしすせそ",
    t: "たちつてと",
    n: "なにぬねの",
    h: "はひふへほ",
    m: "まみむめも",
    y: "やゆよ",
    r: "らりるれろ",
    w: "わをん",
};

/**
 * 子音個数をかなに
 * @param {string} siin 
 * @param {number} count 
 */
function siinToKana(siin, count) {
    const index = (count - 1) % siinPressGroupMaxCount(siin);
    return siinToTopKana[siin][index];
}

/** @type {string[]} */
const allSiinPresses = [];

/**
 * キー押下時に子音を追加
 * @param {string} siin 
 */
function processSiinPress(siin) {
    const previousSiin = allSiinPresses[allSiinPresses.length - 1];
    if (siin !== "-" && siin !== previousSiin) allSiinPresses.push("-");
    allSiinPresses.push(siin);
}

/**
 * 子音が変わるごとにグループ化
 * @param {string[]} siins 
 */
function siinsToKanas(siins) {
    if (!siins.length) return "";
    
    /** @type {string | undefined} */
    let currentSiin;
    let currentSiinCount = 0;
    /** @type {string[]} */
    const chars = [];
    for (const siin of siins) {
        if (siin === "-") {
            if (currentSiin != null) {
                chars.push(siinToKana(currentSiin, currentSiinCount));
                currentSiin = undefined;
                currentSiinCount = 0;
            }
        } else {
            currentSiin = siin;
            ++currentSiinCount;
        }
    }
    if (currentSiin != null) {
        chars.push(siinToKana(currentSiin, currentSiinCount));
    }
    return chars.join("");
}

/**
 * 最大連続子音数
 * @param {string} siin 
 */
function siinPressGroupMaxCount(siin) {
    if (siin === "y" || siin === "w") return 3;
    return 5;
}

/** @type {SpeechSynthesisUtterance | undefined} */
let msg;

let speakCalled = false;
/** @type {string} */
let speakChars;

function speak(str) {
    speakCalled = true;
    speakChars = str;
}

setInterval(() => {
    if (!speakCalled || !msg || typeof speechSynthesis === "undefined" || speechSynthesis.speaking) return;
    speakCalled = false;
    msg.text = speakChars[speakChars.length - 1];
    speechSynthesis.speak(msg);
}, 250);

function getVoice() {
    msg = new SpeechSynthesisUtterance();
    const voices = speechSynthesis.getVoices();
    const voice = voices.find((voice) => /^ja/.test(voice.lang));
    if (!voice) {
        msg = undefined;
        return;
    }
    msg.voice = voice;
    msg.rate = 0.5;
    msg.volume = 1;
    msg.pitch = 1;
    msg.lang = "ja-JP";
}

window.addEventListener("DOMContentLoaded", () => {
    if (typeof speechSynthesis !== "undefined") {
        speechSynthesis.onvoiceschanged = getVoice;
        getVoice();
    }
    const fontSizeElem = /** @type {HTMLInputElement} */ (document.getElementById("fontSize"));
    const minTimeDiffElem = /** @type {HTMLInputElement} */ (document.getElementById("minTimeDiff"));
    fontSizeElem.addEventListener("change", applySettingFromInput);
    fontSizeElem.addEventListener("input", applySettingFromInput);
    minTimeDiffElem.addEventListener("change", applySettingFromInput);
    minTimeDiffElem.addEventListener("input", applySettingFromInput);
    applySetting(loadSetting(), true);
});

/** @typedef {{fontSize: string; minTimeDiff: string}} Setting */

/** @return {Setting} */
function loadSetting() {
    return {
        fontSize: localStorage.getItem("fontSize") || "20",
        minTimeDiff: localStorage.getItem("minTimeDiff") || "600",
    };
}

/**
 * @param {Setting} setting 
 */
function saveSetting(setting) {
    localStorage.setItem("fontSize", setting.fontSize);
    localStorage.setItem("minTimeDiff", setting.minTimeDiff);
}

/** @return {Setting} */
function getSetting() {
    const fontSizeElem = /** @type {HTMLInputElement} */ (document.getElementById("fontSize"));
    const minTimeDiffElem = /** @type {HTMLInputElement} */ (document.getElementById("minTimeDiff"));
    return {
        fontSize: fontSizeElem.value,
        minTimeDiff: minTimeDiffElem.value,
    };
}

/**
 * 
 * @param {Setting} setting 
 * @param {boolean} showInput 
 */
function applySetting(setting, showInput = false) {
    const charsElem = document.getElementById("chars");
    charsElem.style.fontSize = setting.fontSize + "px";
    minTimeDiff = Number(setting.minTimeDiff);

    saveSetting(setting);
    showSetting(setting, showInput);
}

function applySettingFromInput() {
    applySetting(getSetting());
}

/**
 * 
 * @param {Setting} setting 
 * @param {boolean} showInput 
 */
function showSetting(setting, showInput = false) {
    const fontSizeElem = /** @type {HTMLInputElement} */ (document.getElementById("fontSize"));
    const minTimeDiffElem = /** @type {HTMLInputElement} */ (document.getElementById("minTimeDiff"));
    const fontSizeDisplayElem = document.getElementById("fontSizeDisplay");
    const minTimeDiffDisplayElem = document.getElementById("minTimeDiffDisplay");
    if (showInput) {
        fontSizeElem.value = setting.fontSize;
        minTimeDiffElem.value = setting.minTimeDiff;
    }
    fontSizeDisplayElem.textContent = setting.fontSize;
    minTimeDiffDisplayElem.textContent = setting.minTimeDiff;
}

const keypressed = {};
/** @type {number} */
let minTimeDiff;

window.addEventListener("keydown", (event) => {
    const siin = keyCodeToSiin(event.code);
    if (!siin) return;
    const time = new Date().getTime();
    const previousTime = keypressed[siin];
    const timeDiff = time - (previousTime || 0);
    keypressed[siin] = time;
    if (timeDiff < minTimeDiff) return;
    processSiinPress(siin);
    if (siin === "-") return;
    const chars = siinsToKanas(allSiinPresses);
    const charsElem = document.getElementById("chars");
    charsElem.textContent = "";

    for (const char of chars) {
        const charElem = document.createElement("span");
        charElem.textContent = char;
        charElem.className = "char";
        charsElem.appendChild(charElem);
    }

    speak(chars);
});

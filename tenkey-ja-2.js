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
/** @type {SpeechSynthesisVoice[] | undefined} */
let voices;

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
    msg.text = speakChars[speakChars.length - 1] + "ー";
    speechSynthesis.speak(msg);
}, 250);

function getVoice() {
    msg = new SpeechSynthesisUtterance();
    const _voices = speechSynthesis.getVoices();
    if (!_voices) return;
    voices = _voices;
    showSetting(loadSetting(), true);
    setVoice(getSetting().voice);
    msg.rate = 0.5;
    msg.volume = 1;
    msg.pitch = 1;
    msg.lang = "ja-JP";
}

function setVoice(name = "") {
    if (!voices || !msg) return;
    if (!name) {
        const voice = voices.find((voice) => /^ja/.test(voice.lang));
        if (!voice) return;
        msg.voice = voice;
    } else {
        const voice = voices.find((voice) => voice.name === name);
        if (!voice) return;
        msg.voice = voice;
    }
}

window.addEventListener("DOMContentLoaded", () => {
    if (typeof speechSynthesis !== "undefined") {
        speechSynthesis.onvoiceschanged = getVoice;
        getVoice();
    }
    const fontSizeElem = /** @type {HTMLInputElement} */ (document.getElementById("fontSize"));
    const minTimeDiffElem = /** @type {HTMLInputElement} */ (document.getElementById("minTimeDiff"));
    const voiceElem = /** @type {HTMLSelectElement} */ (document.getElementById("voice"));
    fontSizeElem.addEventListener("change", applySettingFromInput);
    fontSizeElem.addEventListener("input", applySettingFromInput);
    minTimeDiffElem.addEventListener("change", applySettingFromInput);
    minTimeDiffElem.addEventListener("input", applySettingFromInput);
    voiceElem.addEventListener("change", applySettingFromInput);
    voiceElem.addEventListener("input", applySettingFromInput);
    applySetting(loadSetting(), true);
});

/** @typedef {{fontSize: string; minTimeDiff: "1" | "", voice: string}} Setting */

/** @return {Setting} */
function loadSetting() {
    return {
        fontSize: localStorage.getItem("fontSize") || "20",
        minTimeDiff: /** @type {"1" | ""} */ localStorage.getItem("minTimeDiff") ? "1" : "",
        voice: /** @type {"1" | ""} */ localStorage.getItem("voice") || "",
    };
}

/**
 * @param {Setting} setting 
 */
function saveSetting(setting) {
    localStorage.setItem("fontSize", setting.fontSize);
    localStorage.setItem("minTimeDiff", setting.minTimeDiff);
    localStorage.setItem("voice", setting.voice);
}

/** @return {Setting} */
function getSetting() {
    const fontSizeElem = /** @type {HTMLInputElement} */ (document.getElementById("fontSize"));
    const minTimeDiffElem = /** @type {HTMLInputElement} */ (document.getElementById("minTimeDiff"));
    const voiceElem = /** @type {HTMLSelectElement} */ (document.getElementById("voice"));
    return {
        fontSize: fontSizeElem.value,
        minTimeDiff: minTimeDiffElem.checked ? "1" : "",
        voice: voiceElem.value,
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
    useMinTimeDiff = Boolean(setting.minTimeDiff);
    if (voices) setVoice(setting.voice);

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
    const voiceElem = /** @type {HTMLSelectElement} */ (document.getElementById("voice"));
    const fontSizeDisplayElem = document.getElementById("fontSizeDisplay");
    const minTimeDiffDisplayElem = document.getElementById("minTimeDiffDisplay");
    if (showInput) {
        fontSizeElem.value = setting.fontSize;
        minTimeDiffElem.checked = setting.minTimeDiff === "1";
        if (!voiceElem.childElementCount && voices) {
            for (const voice of voices) {
                const optionElem = /** @type {HTMLOptionElement} */ (document.createElement("option"));
                optionElem.textContent = `${voice.name} [${voice.lang}] (${voice.localService ? "local" : "remote"})`;
                optionElem.value = voice.name;
                voiceElem.appendChild(optionElem);
            }
        }
        voiceElem.value = setting.voice;
    }
    fontSizeDisplayElem.textContent = setting.fontSize;
    minTimeDiffDisplayElem.textContent = setting.minTimeDiff ? "ON" : "OFF";
}

const keypressed = {};
/** @type {number} */
const minTimeDiff = 600;
let useMinTimeDiff = true;

window.addEventListener("keydown", (event) => {
    const siin = keyCodeToSiin(event.code);
    if (!siin) return;
    if (useMinTimeDiff) {
        const time = new Date().getTime();
        const previousTime = keypressed[siin];
        const timeDiff = time - (previousTime || 0);
        keypressed[siin] = time;
        if (timeDiff < minTimeDiff) return;
    }
    press(siin);
});

function press(siin) {
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
}
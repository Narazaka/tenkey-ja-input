// @ts-check

/** @typedef {"rs" | "s" | "b" | "-" | "!" | "c"} Type */

/** @type {string | undefined} */
let useKeymap;

/**
 * キーコードを種別に変換
 * @param {string} keycode 
 * @return {Type | undefined}
 */
function keyToType(keycode) {
    switch (useKeymap) {
        case "col+":
            switch (keycode) {
                case "Numpad1": return "rs";
                case "Numpad0": return "s";
                case "NumpadDecimal": return "b";
                case "NumpadEnter": return "-";
                case "Numpad2": return "c";
                case "Numpad3": return "!";
                case "KeyA": return "rs";
            }
            break;
        case "row":
            switch (keycode) {
                case "Numpad4": return "s";
                case "Numpad1": return "b";
                case "Numpad0": return "-";
                case "Numpad2": return "c";
                case "NumpadDecimal": return "!";
            }
            break;
        case "row+":
            switch (keycode) {
                case "Numpad7": return "rs";
                case "Numpad4": return "s";
                case "Numpad1": return "b";
                case "Numpad0": return "-";
                case "Numpad2": return "c";
                case "NumpadDecimal": return "!";
                case "KeyA": return "rs";
            }
            break;
        default: // col
            switch (keycode) {
                case "Numpad0": return "s";
                case "NumpadDecimal": return "b";
                case "NumpadEnter": return "-";
                case "Numpad2": return "c";
                case "Numpad3": return "!";
            }
            break;
    }
    switch (keycode) { // for debug
        case "KeyZ": return "s";
        case "KeyX": return "b";
        case "KeyC": return "-";
        case "KeyS": return "c";
        case "KeyD": return "!";
        case "Enter": return "-";
    }
}

const pressedCharToCharTable = [
    "あいうえお",
    "かきくけこ",
    "さしすせそ",
    "たちつてと",
    "なにぬねの",
    "はひふへほ",
    "まみむめも",
    "やゆよ",
    "らりるれろ",
    "わをん",
];

class PressedChar {
    constructor() {
        this.s = /** @type {number | undefined} */ (undefined);
        this.b = /** @type {number | undefined} */ (undefined);
    }

    nextSiin() {
        this.initialize() || ++this.s;
    }

    nextBoin() {
        this.initialize() || ++this.b;
    }

    backSiin() {
        this.initialize() || --this.s;
    }

    get char() {
        if (this.s == null || this.b == null) return;
        let rowIndex = this.s % pressedCharToCharTable.length;
        if (rowIndex < 0) rowIndex += pressedCharToCharTable.length;
        const row = pressedCharToCharTable[rowIndex];
        let colIndex = this.b % row.length;
        if (colIndex < 0) colIndex += row.length;
        return row[colIndex];
    }

    /** @private */
    initialize() {
        let changed = false;
        if (this.s == null) {
            this.s = 0;
            changed = true;
        }
        if (this.b == null) {
            this.b = 0;
            changed = true;
        }
        return changed;
    }
}

class PressedChars {
    constructor() {
        /** @type {PressedChar[]} */
        this.all = [];
    }

    get latest() { return this.all[this.all.length - 1]; }

    next() {
        this.all.push(new PressedChar());
    }

    get chars() {
        return this.all.map(pc => pc.char).filter(c => c != null);
    }

    clear() {
        this.all = [];
    }
}

const pressedChars = new PressedChars();

class Elem {
    get fontSize() { return /** @type {HTMLInputElement} */ (this.getCache("fontSize")); }
    get minTimeDiff() { return /** @type {HTMLInputElement} */ (this.getCache("minTimeDiff")); }
    get voice() { return /** @type {HTMLSelectElement} */ (this.getCache("voice")); }
    get keymap() { return /** @type {HTMLSelectElement} */ (this.getCache("keymap")); }
    get examples() { return ["row", "row+", "col", "col+"].map(keymap => this.example(keymap)); }
    example(keymap) { return /** @type {HTMLTableElement} */ (this.getCache(`example-${keymap}`)); }
    /**
     * @private
     * @param {string} id 
     * @return {HTMLElement}
     */
    getCache(id) {
        if (!this[`_${id}`]) this[`_${id}`] = document.getElementById(id);
        return this[`_${id}`];
    }
}

const elem = new Elem();

/** @type {SpeechSynthesisUtterance | undefined} */
let msg;
/** @type {SpeechSynthesisVoice[] | undefined} */
let voices;

let speakCalled = false;
/** @type {string[]} */
let speakChars;
let kakutei = false;
let all = false;

function speak(str, isKakutei = false) {
    speakCalled = true;
    speakChars = str;
    kakutei = isKakutei;
}

function speakAll(str) {
    speak(str);
    all = true;
}

setInterval(() => {
    if (!speakCalled || !msg || typeof speechSynthesis === "undefined" || speechSynthesis.speaking) return;
    speakCalled = false;
    if (all) {
        if (speakChars.length) {
            msg.text = speakChars.join("");
        } else {
            msg.text = "文字がないです";
        }
    } else {
        if (speakChars.length) {
            msg.text = speakChars[speakChars.length - 1] + "ー" + (kakutei ? "に確定" : "");
        } else {
            msg.text = "文字がないです";
        }
    }
    all = false;
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
    elem.fontSize.addEventListener("change", applySettingFromInput);
    elem.fontSize.addEventListener("input", applySettingFromInput);
    elem.minTimeDiff.addEventListener("change", applySettingFromInput);
    elem.minTimeDiff.addEventListener("input", applySettingFromInput);
    elem.voice.addEventListener("change", applySettingFromInput);
    elem.voice.addEventListener("input", applySettingFromInput);
    elem.keymap.addEventListener("change", applySettingFromInput);
    elem.keymap.addEventListener("input", applySettingFromInput);
    applySetting(loadSetting(), true);
});

/** @typedef {{fontSize: string; minTimeDiff: "1" | "", voice: string; keymap: string}} Setting */

/** @return {Setting} */
function loadSetting() {
    return {
        fontSize: localStorage.getItem("fontSize") || "20",
        minTimeDiff: /** @type {"1" | ""} */ localStorage.getItem("minTimeDiff") ? "1" : "",
        voice: /** @type {"1" | ""} */ localStorage.getItem("voice") || "",
        keymap: localStorage.getItem("keymap") || "col",
    };
}

/**
 * @param {Setting} setting 
 */
function saveSetting(setting) {
    localStorage.setItem("fontSize", setting.fontSize);
    localStorage.setItem("minTimeDiff", setting.minTimeDiff);
    localStorage.setItem("voice", setting.voice);
    localStorage.setItem("keymap", setting.keymap);
}

/** @return {Setting} */
function getSetting() {
    return {
        fontSize: elem.fontSize.value,
        minTimeDiff: elem.minTimeDiff.checked ? "1" : "",
        voice: elem.voice.value,
        keymap: elem.keymap.value,
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
    useKeymap = setting.keymap;

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
    const fontSizeDisplayElem = document.getElementById("fontSizeDisplay");
    const minTimeDiffDisplayElem = document.getElementById("minTimeDiffDisplay");
    if (showInput) {
        elem.fontSize.value = setting.fontSize;
        elem.minTimeDiff.checked = setting.minTimeDiff === "1";
        if (!elem.voice.childElementCount && voices) {
            for (const voice of voices) {
                const optionElem = /** @type {HTMLOptionElement} */ (document.createElement("option"));
                optionElem.textContent = `${voice.name} [${voice.lang}] (${voice.localService ? "local" : "remote"})`;
                optionElem.value = voice.name;
                elem.voice.appendChild(optionElem);
            }
        }
        elem.voice.value = setting.voice;
        elem.keymap.value = setting.keymap;
    }
    fontSizeDisplayElem.textContent = setting.fontSize;
    minTimeDiffDisplayElem.textContent = setting.minTimeDiff ? "ON" : "OFF";
    for (const example of elem.examples) example.style.display = "none";
    elem.example(setting.keymap).style.display = "table";
}

const keypressed = {};
/** @type {number} */
const minTimeDiff = 600;
let useMinTimeDiff = true;

window.addEventListener("keydown", (event) => {
    const type = keyToType(event.code);
    if (!type) return;
    if (useMinTimeDiff) {
        const time = new Date().getTime();
        const previousTime = keypressed[type];
        const timeDiff = time - (previousTime || 0);
        keypressed[type] = time;
        if (timeDiff < minTimeDiff) return;
    }
    press(type);
});

/**
 * 
 * @param {Type} type 
 */
function press(type) {
    if (!pressedChars.latest) pressedChars.next(); // 初回
    let speaked = false;
    switch (type) {
        case "rs": pressedChars.latest.backSiin(); break;
        case "s": pressedChars.latest.nextSiin(); break;
        case "b": pressedChars.latest.nextBoin(); break;
        case "-": pressedChars.next(); break;
        case "c":
            pressedChars.clear();
            speaked = true;
            speakAll(["クリアします"]);
            break;
        case "!":
            speaked = true;
            speakAll(pressedChars.chars);
            return;
    }
    const chars = pressedChars.chars;
    const charsElem = document.getElementById("chars");
    charsElem.textContent = "";

    for (const char of chars) {
        const charElem = document.createElement("span");
        charElem.textContent = char;
        charElem.className = "char";
        charsElem.appendChild(charElem);
    }

    if (!speaked) speak(chars, type === "-");
}

import { DEBUG } from "./enums";

/**
 * console.log if DEBUG
 */
const debug_log = (() => {
    if(DEBUG) {
        return console.log;
    }
})();

/**
 * console.info if DEBUG
 */
const debug_info = (() => {
    if(DEBUG) {
        return console.info;
    }
})();

/**
 * console.warn if DEBUG
 */
const debug_warn = (() => {
    if(DEBUG) {
        return console.warn;
    }
})();

/**
 * console.groupCollapsed if DEBUG
 */
const debug_group_start = (() => {
    if(DEBUG) {
        return console.groupCollapsed;
    }
})();

/**
 * console.groupEnd if DEBUG
 */
const debug_group_end = (() => {
    if(DEBUG) {
        return console.groupEnd;
    }
})();

export {debug_log, debug_info, debug_warn, debug_group_start, debug_group_end}
import { HighlightType, HIGHLIGHT_TYPE } from "./enums";
import { cleanText, escapeRegex } from "./cleanText";

/**
 * 
 * @param {string} _text the entire text of the page returned from the tagging function
 * @param {funchtion} _mark function to mark the html page
 * @param {funtion} _remove_mark function to remove all marks in the html
 * @returns markContent function
 */
const markContentHelper = (_text, _mark, _remove_mark) => {
    console.groupCollapsed('Text');
    console.info(_text);
    console.groupEnd();

    /**
     * @param {object} context Object containing the context_before, context_after and highlight portions
     * @returns an array where the first item is a boolean if a match was found
     * , the second is the start index of the item found
     * and the last is the end index of the item found
     */
    const textMatching = (context) => {
        cleanText(context);
        console.log(context.highlight);
        const {content_before, highlight, content_after } = context;
        const start = [..._text.matchAll(new RegExp(escapeRegex(highlight), 'g'))];
        if (start.length > 0){
            return [true, start[0]['index'], start[0]['index'] + highlight.length];
        } else {
            return [false];
        }
    };

    /**
     * @param {object} context_array 
     * @param {string} color to highlight the content with
     * @returns an object where succeeds is an array of all the context_array elements matched
     * and fail in an array of all the context_array elements not matched
     */
    const markContent = async (context_array, color) => {
        _remove_mark();
        let succeed = [];
        let fail = [];
        context_array.forEach((context) => {
            const [ found, start, end ] = textMatching(context);
            if (found) {
                _mark(start, end, color);
                succeed.push(context);
            } else {
                fail.push(context);
            }
        });
        return { succeed, fail };
    };
    return markContent;
}

/**
 * Get the markContent function created depending on the HIGHLIGHT_TYPE
 */
const markContent = (() => {
    if (HIGHLIGHT_TYPE === HighlightType.TAGGING_CHAR) {
        const tag = require("./tagEveryChar");
        const mark = require("./markPageChar");
        return markContentHelper(tag.text, mark.markPageChar, mark.removeMarks);
    } else if (HIGHLIGHT_TYPE === HighlightType.TAGGING_WORD) {
        const tag = require("./tagEveryWord");
        const mark = require("./markPageWord");
        return markContentHelper(tag.text, mark.markPageWord, mark.removeMarks);
    } else {
        return undefined;
    }
})();


export { markContent };
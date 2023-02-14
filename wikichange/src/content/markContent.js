import { HighlightType, HIGHLIGHT_TYPE } from "./enums";
import { cleanText, escapeRegex, splitElementNode } from "./cleanText";
import { debug_console } from "./globals";

/**
 * 
 * @param {string} _text the entire text of the page returned from the tagging function
 * @param {funchtion} _mark function to mark the html page
 * @param {funtion} _remove_mark function to remove all marks in the html
 * @returns markContent function
 */
const markContentHelper = (_text, _track, _remove_mark, _apply) => {
    /**
     * Checks if the text found it is the correct one to highlight based
     * on context. This will make it a little slower but much more accurate
     * 
     * @param {string} content_before 
     * @param {string} content_after 
     * @param {integer} index 
     */
    const matchContext = (content_before, content_after, match) => {
        let index = match['index'];
        let afterText = _text.slice(
            index + match[0].length,
            index + match[0].length + content_after.length
        );
        let beforeText = _text.slice(index - content_before.length, index);
        if (afterText.includes(content_after) && beforeText.includes(content_before)) {
            return true;
        }
        return false;
    }

    /**
     * @param {object} context Object containing the context_before, context_after and highlight portions
     * @returns an array where the first item is a boolean if a match was found
     * , the second is the start index of the item found
     * and the last is the end index of the item found
     */
    const textMatching = (context) => {
        context = cleanText(context);
        const {content_before, highlight, content_after} = context;
        const matches = [..._text.matchAll(new RegExp(escapeRegex(highlight), 'g'))];
        // Now we need to highlight the correct segment
        for (let i = 0; i < matches.length; i++) {
            let index = matches[i]['index'];
            if (matchContext(content_before, content_after, matches[i])) {
                return [true, index, index + highlight.length];
            }
        }
        return [false];
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
        let startTime = Date.now();
        context_array.forEach((element) => splitElementNode(element).forEach((context) => {
            const [ found, start, end ] = textMatching(context);
            if (found) {
                _track(start, end);
                succeed.push(context);
            } else {
                fail.push(context);
            }
        }));    
        _apply(color);
        debug_console?.info((Date.now() - startTime)/1000);
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
        return markContentHelper(tag.text, mark.addChars, mark.removeMarks, mark.applyMarks);
    } else if (HIGHLIGHT_TYPE === HighlightType.TAGGING_WORD) {
        const tag = require("./tagEveryWord");
        const mark = require("./markPageWord");
        return markContentHelper(tag.text, mark.addWords, mark.removeMarks, mark.applyMarks);
    } else {
        return undefined;
    }
})();


export { markContent };
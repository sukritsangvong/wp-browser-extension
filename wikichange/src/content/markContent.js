import { HighlightType, HIGHLIGHT_TYPE } from "./enums";
import { cleanText, escapeRegex } from "./cleanText";

const fuzzySeach = (text, textToSearch, startIndex, endIndex, errorAllowed) => {
    if (startIndex < 0 || endIndex > text.length) console.error(`Error: invalid start and end index for fuzzy search.`);
    const textToSearchLen = textToSearch.length;
    const maxDistance = Math.floor(textToSearchLen * errorAllowed) + 1;

    for (let i = startIndex; i < endIndex; i++) {
        let distance = 0;
        for (let j = 0; j < textToSearchLen && i + j < endIndex; j++) {
            if (text[i + j] === textToSearch[j]) {
                distance++;
            }
        }
        if (distance >= textToSearchLen - maxDistance) {
            return i;
        }
    }
    return -1;
};

let isRun = false;
const getHighlightIndex = (text, context) => {
    const { content_before, highlight, content_after } = context;
    let startSearchIndex = 0;
    // if (isRun) return;
    // isRun = true;

    while (true) {
        const startHighlight = fuzzySeach(text, highlight, startSearchIndex, text.length, 0.2);
        const endHighlight = startHighlight + highlight.length;

        if (startHighlight == -1) break;

        if (content_after == "" && content_after == "") return -1;
        const searchRangeForContentBefore = Math.max(0, startHighlight - 2 * content_before.length);
        const searchRangeForContentAfter = Math.min(text.length, endHighlight + 2 * content_after.length);
        const isContentBeforeMatch =
            content_before == "" ||
            fuzzySeach(text, content_before, searchRangeForContentBefore, startHighlight, 0.5) != -1;
        const isContentAfterMatch =
            content_after == "" || fuzzySeach(text, content_after, endHighlight, searchRangeForContentAfter, 0.5) != -1;
        // console.log(context);
        // console.log(text.substring(startHighlight, endHighlight));
        // console.log(text.substring(searchRangeForContentBefore, startHighlight));
        // console.log(text.substring(endHighlight, searchRangeForContentAfter));
        // console.log(isContentBeforeMatch);
        // console.log(isContentAfterMatch);
        if (isContentBeforeMatch && isContentAfterMatch) {
            // console.log("In");
            return startHighlight;
        }

        startSearchIndex = endHighlight;
    }

    return -1;
};

/**
 *
 * @param {string} _text the entire text of the page returned from the tagging function
 * @param {funchtion} _mark function to mark the html page
 * @param {funtion} _remove_mark function to remove all marks in the html
 * @returns markContent function
 */
const markContentHelper = (_text, _mark, _remove_mark) => {
    console.groupCollapsed("Text");
    console.info(_text);
    console.groupEnd();

    /**
     * @param {object} context Object containing the context_before, context_after and highlight portions
     * @returns an array where the first item is a boolean if a match was found
     * , the second is the start index of the item found
     * and the last is the end index of the item found
     */
    const textMatching = (context) => {
        context = cleanText(context);
        const { content_before, highlight, content_after } = context;

        const start = getHighlightIndex(_text, context);

        // const testContext = {
        //     content_before:
        //         ", published by an association of food industries with the goal of promoting pasta in the United States. Rustichello da Pisa writes in his ''Travels that Marco Polo described a food similar to \"lagana\". Jeffrey Steingarten asserts that Arabs introduced pasta in the Emirate of Sicily in the ninth century, mentioning also that traces of pasta have been found in ancient Greece and that Jane Grigson believed the Marco Polo story to have originated in the 1920s or ",
        //     highlight: "1930s",
        //     content_after: " in an advertisement for a Canadian spaghetti company.",
        // };

        // const start = getHighlightIndex(_text, testContext);

        // const start = fuzzySeach(_text, highlight, 0, _text.length);
        // const start = [..._text.matchAll(new RegExp(escapeRegex(highlight), "g"))];
        if (start > 0) {
            return [true, start, start + highlight.length];
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
            const [found, start, end] = textMatching(context);
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
};

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

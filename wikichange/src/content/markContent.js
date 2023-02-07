import { HighlightType, HIGHLIGHT_TYPE } from "./enums";
import { cleanText, escapeRegex } from "./cleanText";

const isOpenParenthesesOrBracketOrQuote = (char) => /[({'"[`]/.test(char);
const isCloseParenthesesOrBracketOrQuote = (char) => /[)}'"]/.test(char);
const isSpace = (char) => /[\s]|\s/.test(char);

const getOffsetBySkippingSpace = (text, i, j, end, offset) => {
    let curOffset = offset;
    while (i + j + offset < end && isSpace(text[i + j + curOffset])) {
        curOffset++;
    }

    return curOffset;
};

const getOffSetBySkippingParentheses = (text, i, j, end, offset) => {
    let curOffset = offset;
    if (isOpenParenthesesOrBracketOrQuote(text[i + j + curOffset])) {
        while (i + j + curOffset + 1 < end && !isCloseParenthesesOrBracketOrQuote(text[i + j + curOffset])) {
            curOffset++;
        }
        curOffset++;
    }

    return curOffset;
};

const getOffSetBySkippingUnwantedText = (text, i, j, end, offset) => {
    let curOffset = offset;
    let checkOffset = null;
    // curOffset = getOffsetBySkippingSpace(text, i, j, end, curOffset);
    // curOffset = getOffSetBySkippingParentheses(text, i, j, end, curOffset);

    while (curOffset != checkOffset) {
        curOffset = getOffsetBySkippingSpace(text, i, j, end, curOffset);
        curOffset = getOffSetBySkippingParentheses(text, i, j, end, curOffset);

        // checks if there is space to skip after parentheses
        checkOffset = getOffsetBySkippingSpace(text, i, j, end, curOffset);
    }

    return curOffset;
};

const fuzzySeach = (text, textToSearch, startIndex, endIndex, errorAllowed) => {
    if (startIndex < 0 || endIndex > text.length) console.error(`Error: invalid start and end index for fuzzy search.`);
    const textToSearchLen = textToSearch.length;
    const maxError = Math.floor(textToSearchLen * errorAllowed) + 1;
    // console.log(text);
    // console.log(textToSearch);
    // console.log(textToSearchLen - maxError);\

    for (let i = startIndex; i < endIndex; i++) {
        let distance = 0;
        let offsetText = 0;
        let offsetTextToSearch = 0;
        for (let j = 0; j + offsetTextToSearch < textToSearchLen && i + j + offsetText < endIndex; j++) {
            // while (i + j + offsetText < endIndex && isSpace(text[i + j + offsetText])) {
            //     offsetText++;
            // }
            // while (j + offsetText < textToSearchLen && isSpace(textToSearch[j + offsetTextToSearch])) {
            //     offsetTextToSearch++;
            // }

            offsetText = getOffSetBySkippingUnwantedText(text, i, j, endIndex, offsetText);
            offsetTextToSearch = getOffSetBySkippingUnwantedText(
                textToSearch,
                0,
                j,
                textToSearchLen,
                offsetTextToSearch
            );

            // console.log(`${text[i + j + offsetText]} ${textToSearch[j + offsetTextToSearch]}`);
            if (text[i + j + offsetText] === textToSearch[j + offsetTextToSearch]) {
                distance++;
            }
        }

        if (distance >= textToSearchLen - maxError - offsetTextToSearch) {
            return i;
        }
    }

    return -1;
};

let isRun = false;
const getHighlightIndex = (text, context, startIndex) => {
    let { content_before, highlight, content_after } = context;

    // cuts down content before and after to at most 100 chars
    content_before = content_before.length > 100 ? content_before.slice(content_before.length - 100) : content_before;
    content_after = content_after.length > 100 ? content_after.slice(content_after.length - 100) : content_after;
    let startSearchIndex = startIndex;
    // if (isRun) return;
    // isRun = true;

    while (true) {
        const startHighlight = fuzzySeach(text, highlight, startSearchIndex, text.length, 0.2);
        const endHighlight = startHighlight + highlight.length;

        if (startHighlight == -1) break;

        if (content_after == "" && content_after == "") return startHighlight;
        const searchRangeForContentBefore = Math.max(0, startHighlight - 1.5 * content_before.length);
        const searchRangeForContentAfter = Math.min(text.length, endHighlight + 1.5 * content_after.length);
        const isContentBeforeMatch =
            content_before == "" ||
            fuzzySeach(text, content_before, searchRangeForContentBefore, startHighlight, 0.6) != -1;
        const isContentAfterMatch =
            content_after == "" || fuzzySeach(text, content_after, endHighlight, searchRangeForContentAfter, 0.6) != -1;
        // console.log(text.substring(startHighlight, endHighlight));
        // console.log(text.substring(searchRangeForContentBefore, startHighlight));
        // console.log(text.substring(endHighlight, searchRangeForContentAfter));
        // console.log(isContentBeforeMatch);
        // console.log(isContentAfterMatch);
        if (isContentBeforeMatch && isContentAfterMatch) {
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
     * 
     {
    "content_before": "",
    "highlight": " (, ; ) is a type of food typically made from an unleavened dough of wheat flour mixed with water or eggs, and formed into sheets or other shapes, then cooked by boiling or baking. Rice flour, or legumes such as beans or lentils, are sometimes used in place of wheat flour to yield a different taste and texture, or as a gluten-free alternative. Pasta is a staple food of Italian cuisine.<!-- Production -->",
    "content_after": ""
}

{
    "content_before": "",
    "highlight": "Pastas are divided into two broad categories: dried () and fresh (). Most dried pasta is produced commercially via an extrusion process, although it can be produced at home. Fresh pasta is traditionally produced by hand, sometimes with the aid of simple machines. Fresh pastas available in grocery stores are produced commercially by large-scale machines.",
    "content_after": ""
}
     */

    /**
     * @param {object} context Object containing the context_before, context_after and highlight portions
     * @returns an array where the first item is a boolean if a match was found
     * , the second is the start index of the item found
     * and the last is the end index of the item found
     */
    const textMatching = (context, curIndex) => {
        // if (isRun) return [false];
        // isRun = true;
        context = cleanText(context);
        const { content_before, highlight, content_after } = context;

        const start = getHighlightIndex(_text, context, curIndex);
        // console.log(start);

        // const bigText = `, published by an association of food industries with the goal of promoting pasta in the  United States . [17] Rustichello da Pisa  writes in his  Travels  that Marco Polo described a food similar to "lagana".  Jeffrey Steingarten  asserts that  Arabs  introduced pasta in the  Emirate of Sicily  in the ninth century, mentioning also that traces of pasta have been found in ancient Greece and that  Jane Grigson  believed the Marco Polo story to have originated in the 1920s or `;
        // const textToSearch = `, published by an association of food industries with the goal of promoting pasta in the United States. Rustichello da Pisa writes in his ''Travels that Marco Polo described a food similar to "lagana". Jeffrey Steingarten asserts that Arabs introduced pasta in the Emirate of Sicily in the ninth century, mentioning also that traces of pasta have been found in ancient Greece and that Jane Grigson believed the Marco Polo story to have originated in the 1920s or `;

        // const start = fuzzySeach(bigText, textToSearch, 0, bigText.length, 0.5);
        // const bigText = `Pasta  ( US :  / ˈ p ɑː s t ə / ,  UK :  / ˈ p æ s t ə / ;  Italian pronunciation:  [ˈpasta] ) is a type of  food  typically made from an  unleavened dough  of  wheat  flour mixed with water or eggs, and formed into sheets or other shapes, then cooked by  boiling  or  baking .  Rice flour , or  legumes  such as beans or  lentils , are sometimes used in place of  wheat flour  to yield a different taste and texture, or as a  gluten-free  alternative. Pasta is a  staple food  of  Italian cuisine .`;
        // const test2 = {
        //     content_before: "",
        //     highlight:
        //         "'''Pasta''' (, ; ) is a type of [[food]] typically made from an [[unleavened]] [[dough]] of [[wheat]] flour mixed with water or eggs, and formed into sheets or other shapes, then cooked by [[boiling]] or [[baking]]. [[Rice flour]], or [[legumes]] such as beans or [[lentils]], are sometimes used in place of [[wheat flour]] to yield a different taste and texture, or as a [[Gluten-free diet|gluten-free]] alternative. Pasta is a [[staple food]] of [[Italian cuisine]].<!-- Production -->",
        //     content_after: "",
        // };

        // const start = getHighlightIndex(bigText, cleanText(test2), curIndex);
        // console.log(start);

        // const start = fuzzySeach(_text, highlight, 0, _text.length, 0.5);
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
        const succeed = [];
        const fail = [];
        let curIndex = 0;
        context_array.forEach((context) => {
            const [found, start, end] = textMatching(context, curIndex);
            if (found) {
                curIndex = end;
                _mark(start, end, color);
                succeed.push(context);
            } else {
                fail.push(context);
            }
        });
        // console.log(succeed);
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

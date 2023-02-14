import { debug_console } from "./globals";

const fetchChangeWithHTML = async (startID, endID) => {
    const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=compare&format=json&fromrev=${startID}&torev=${endID}&prop=diff%7Cids%7Ctitle%7Ctimestamp&formatversion=2`
    );
    const data = await response.json();
    const parser = new DOMParser();

    const document = parser.parseFromString(`<table>${data["compare"]["body"]}</table>`, "text/html");

    let result = [];
    const trsWithAddition = [...document.getElementsByClassName("diff-addedline")];
    trsWithAddition.forEach((tr) => {
        const curDivs = tr.querySelectorAll("div");
        if (curDivs.length === 0) return;
        if (curDivs.length !== 1) debug_console?.error(`Error: Found tr that has more than one div: ${tr}`);

        const curDiv = curDivs[0];
        const inNodes = curDiv.querySelectorAll("ins.diffchange.diffchange-inline");
        if (inNodes.length === 0) {
            // add the entire paragraph
            addJsonToResult(result, "", curDiv.innerText, "");
        } else {
            // add in nodes separately
            const localResult = [];
            curDiv.childNodes.forEach((child, i) => {
                const nodeName = child.nodeName;
                const content = child.textContent;

                if (nodeName == "INS") {
                    const contentBefore =
                        i > 0 && curDiv.childNodes[i - 1].nodeName == "#text"
                            ? curDiv.childNodes[i - 1].textContent
                            : "";
                    const contentAfter =
                        i + 1 < curDiv.childNodes.length && curDiv.childNodes[i + 1].nodeName == "#text"
                            ? curDiv.childNodes[i + 1].textContent
                            : "";

                    addJsonToResult(localResult, contentBefore, content, contentAfter);
                }
            });

            const combinedResult = [];
            localResult.forEach((child) => {
                if (
                    combinedResult.length != 0 &&
                    isOnlyContainsSymbols(child.content_before) &&
                    combinedResult.at(-1).content_after == child.content_before
                ) {
                    const previouslyAddedResult = combinedResult.at(-1);
                    previouslyAddedResult.highlight =
                        previouslyAddedResult.highlight + previouslyAddedResult.content_after + child.highlight;
                    previouslyAddedResult.content_after = child.content_after;
                } else {
                    combinedResult.push(child);
                }
            });
            result.push(...combinedResult);
        }
    });

    result = result
        .map((res) => {
            return {
                content_before: cleanUpContent(res.content_before),
                highlight: cleanUpContent(res.highlight),
                content_after: cleanUpContent(res.content_after),
            };
        })
        .filter((res) => !isOnlyContainsSymbols(res.highlight) && !res.highlight == "");

    return result;
};

/**
 * @param {string} content
 * @returns cleaned up content that has no {{...}}, <ref>...</ref>, <ref>..., and ...</ref>
 */
const cleanUpContent = (content) => {
    return content.replace(/{{.*?}}|<ref.*?<\/ref>/g, "").replace(/<ref.*|.*<\/ref>/g, "");
};

const isOnlyContainsSymbols = (text) => /^[\W\s]+$/.test(text);

const addJsonToResult = (result, contentBefore, highlight, contentAfter) => {
    // don't add to json if highlight is empty or only contains symbols
    if (highlight == "" || isOnlyContainsSymbols(highlight)) return;

    result.push({
        content_before: contentBefore,
        highlight: highlight,
        content_after: contentAfter,
    });
};

/**
 * Fetch the closest revision to the date (in increasing order in time)
 *
 * @param {string} title of a wikipedia article
 * @param {Date} date
 * @returns {int, date} an ID represent the revision and a date of the revision
 */
const fetchRevisionFromDate = async (title, date) => {
    // Try fetch a revision id that comes right after the given date
    let firstTryError = null;
    try {
        const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&titles=${title}&formatversion=2&rvprop=ids%7Ctimestamp&rvlimit=1&rvstart=${date.toISOString()}&rvdir=newer`
        );
        const data = await response.json();
        return [
            data["query"]["pages"][0]["revisions"][0]["revid"],
            new Date(data["query"]["pages"][0]["revisions"][0]["timestamp"]),
        ];
    } catch (err) {
        firstTryError = err;
    }

    // Try fetch with older dates in case there is nothing newer than the given date
    try {
        const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&titles=${title}&formatversion=2&rvprop=ids%7Ctimestamp&rvlimit=1&rvstart=${date.toISOString()}&rvdir=older`
        );
        const data = await response.json();
        return [
            data["query"]["pages"][0]["revisions"][0]["revid"],
            new Date(data["query"]["pages"][0]["revisions"][0]["timestamp"]),
        ];
    } catch (err) {
        debug_console?.error(
            `Error getting revision for newer and older inputs on title:${title} date:${date}\nFirst Try's Error: ${firstTryError}\nError: ${err}`
        );
        return -1;
    }
};

/**
 * @param {string} currentRevisionId of id to be highlighted on
 * @param {string} oldRevisionId of id to be compared to
 * @returns
 */
const getRevisionPageLink = (title, currentRevisionId, oldRevisionId) => {
    return `https://en.wikipedia.org/w/index.php?title=${title}&diff=${currentRevisionId}&oldid=${oldRevisionId}`;
};

export { fetchChangeWithHTML, fetchRevisionFromDate, getRevisionPageLink };

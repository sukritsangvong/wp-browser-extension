const fetchChangeWithHTML = async (startID, endID) => {
    const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=compare&format=json&fromrev=${startID}&torev=${endID}&prop=diff%7Cids%7Ctitle%7Ctimestamp&formatversion=2`
    );
    const data = await response.json();
    const parser = new DOMParser();

    const document = parser.parseFromString(data["compare"]["body"], "text/html");
    const insNodes = document.querySelectorAll("ins.diffchange.diffchange-inline");
    const divsWithInsWithDuplicate = [...insNodes].map((node) => {
        return node.parentElement;
    });

    const allDivs = document.querySelectorAll("div");
    const divsWithNoInsOuts = [...allDivs].filter((curDiv) => {
        return curDiv.querySelectorAll("ins.diffchange.diffchange-inline,del.diffchange.diffchange-inline").length == 0;
    });

    // Removes duplicate divs
    const divsWithIns = divsWithInsWithDuplicate.filter(
        (v, i, a) => a.findIndex((v2) => v2.innerHTML === v.innerHTML) === i
    );

    let result = [];
    divsWithIns.forEach((element) => {
        const localResult = [];
        element.childNodes.forEach((child, i) => {
            const nodeName = child.nodeName;
            const content = child.textContent;

            if (nodeName == "INS") {
                const contentBefore =
                    i > 0 && element.childNodes[i - 1].nodeName == "#text" ? element.childNodes[i - 1].textContent : "";
                const contentAfter =
                    i + 1 < element.childNodes.length && element.childNodes[i + 1].nodeName == "#text"
                        ? element.childNodes[i + 1].textContent
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
    });

    divsWithNoInsOuts.forEach((curDiv) => {
        addJsonToResult(result, "", curDiv.innerText, "");
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
        console.error(
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

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

    // Construct result array of maps
    let contentBefore = null;
    let highlight = null;
    let contentAfter = null;
    const result = [];
    divsWithIns.forEach((element) => {
        element.childNodes.forEach((child) => {
            const nodeName = child.nodeName;
            const content = child.textContent.replaceAll(/(<ref.*?>.*?<\/ref>)/g, "");

            if (nodeName == "#text") {
                if (highlight == null && contentBefore == null) {
                    contentBefore = content;
                } else {
                    contentAfter = content;

                    addJsonToResultAndReset(result, contentBefore, highlight, contentAfter);
                    contentBefore = null;
                    highlight = null;
                    contentAfter = null;
                }
            } else if (nodeName == "INS") {
                if (highlight == null) {
                    highlight = content;
                } else {
                    highlight += ` ${content}`;
                }
            }
        });

        if (contentBefore != null || highlight || contentAfter != null) {
            addJsonToResultAndReset(result, contentBefore, highlight, contentAfter);
            contentBefore = null;
            highlight = null;
            contentAfter = null;
        }
    });

    divsWithNoInsOuts.forEach((curDiv) => {
        addJsonToResultAndReset(result, "", curDiv.innerText, "");
    });
    return result;
};

const addJsonToResultAndReset = (result, contentBefore, highlight, contentAfter) => {
    result.push({
        content_before: contentBefore == null ? "" : contentBefore,
        highlight: highlight,
        content_after: contentAfter == null ? "" : contentAfter,
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

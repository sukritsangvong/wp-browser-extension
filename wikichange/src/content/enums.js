// Values used for timeSeriesService
const WIKI_CREATION_DATE = new Date("2001-01-15"); // 15 January 2001: to fetch data since creation
const WIKI_PAGE_VIEW_DATA_AVAILABLE_DATE = new Date("2015-08-01");

const AggregateType = {
    MONTHLY: "monthly",
    DAILY: "daily",
};

const HighlightType = {
    NODE: 0,
    TAGGING_CHAR: 1,
    TAGGING_WORD: 2,
};

chrome.storage.sync.get({
    highlightColor: '#AFE1AF'
}, function (items) {
    const stylesheet = document.createElement('style');
    stylesheet.innerText = `:root {
        --highlight-color: ${items.highlightColor};
    }`;
    document.head.append(stylesheet);
}); 

// No console.logs when we are not testing
const DEBUG = false;

// Set the default tagging method
const HIGHLIGHT_TYPE = HighlightType.TAGGING_CHAR;

export { WIKI_CREATION_DATE, WIKI_PAGE_VIEW_DATA_AVAILABLE_DATE, AggregateType, HIGHLIGHT_TYPE, HighlightType, DEBUG };

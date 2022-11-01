/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/content/content.js":
/*!********************************!*\
  !*** ./src/content/content.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _enums_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./enums.js */ "./src/content/enums.js");
/* harmony import */ var _timeSeriesService_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./timeSeriesService.js */ "./src/content/timeSeriesService.js");



/* Creates the div for the graph overlay. TODO: create the graph and render it here */
const renderGraphOverlay = () => {
    let graphContainer = document.createElement('div');
    graphContainer.style.cssText = 'width:40%;height:180px;background-color:#E3C2FF;';

    let p = document.createElement('p');
    graphContainer.appendChild(p);
    let text = document.createTextNode('The graph overlay will be here');
    p.appendChild(text);

    let siteSub = document.getElementById('siteSub');
    siteSub.append(graphContainer);
}

// Get wikipedia text, global as we shouldn't get it every time we highlight a word 
let wikiText = document.getElementById('mw-content-text');
let innerHTML = wikiText.innerHTML;

/* Highlights the words that are given */
const highlightPersistentContent = (text, color) => {
    let index = innerHTML.indexOf(text);
    if (index >= 0) { 
        innerHTML = innerHTML.substring(0, index) + `<mark style='background-color: ${color}'>` + innerHTML.substring(index, index + text.length) + '</mark>' + innerHTML.substring(index + text.length);
        wikiText.innerHTML = innerHTML;
    }
}

renderGraphOverlay();


/* The page id can be found as the last part of the link to
 * the wikidata item on the left side of wikipedia pages.
 * If no page id is found throws an error.
 */
const pageId = (() => {
    let wiki_data_url;
    try {
        wiki_data_url = document.getElementById('t-wikibase').getElementsByTagName('a')[0].href;
    } catch {
        throw new Error("'Can't find page id!");
    }
    const wiki_page_id = wiki_data_url.split('/').slice(-1)[0];
    console.info({
        "wiki_data_url": wiki_data_url,
        "wiki_page_id": wiki_page_id
    });
    return(wiki_page_id);
})();

/***/ }),

/***/ "./src/content/enums.js":
/*!******************************!*\
  !*** ./src/content/enums.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AggregateType": () => (/* binding */ AggregateType),
/* harmony export */   "WIKI_CREATION_DATE": () => (/* binding */ WIKI_CREATION_DATE)
/* harmony export */ });
// Values used for timeSeriesService
const WIKI_CREATION_DATE = new Date("2001-01-15"); // 15 January 2001: to fetch data since creation

const AggregateType = {
    MONTHLY: "monthly",
    DAILY: "daily",
};




/***/ }),

/***/ "./src/content/timeSeriesService.js":
/*!******************************************!*\
  !*** ./src/content/timeSeriesService.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getPageRevisionCount": () => (/* binding */ getPageRevisionCount),
/* harmony export */   "getPageViews": () => (/* binding */ getPageViews)
/* harmony export */ });
/* harmony import */ var _enums_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./enums.js */ "./src/content/enums.js");


const formatDateToYYYMMDD = (date) =>
    `${date.getFullYear()}${("0" + (date.getMonth() + 1)).slice(-2)}${("0" + date.getDate()).slice(-2)}`;

const formatYYYYMMDDToDate = (yyyymmdd) =>
    new Date(yyyymmdd.substring(0, 4), yyyymmdd.substring(4, 6) - 1, yyyymmdd.substring(6, 8));

/**
 * Fetches page views information on a given wikipedia title. The response will only include stat since its creation
 * if the startDate comes before the article was created.
 *
 * @param {string} title of a wikipedia article
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} aggregateType of either monthly or daily
 * @return {map} of an item of an array with properties project, article, granularity(aggregateType), timestamp, access, agent, views
 */
const fetchPageViews = async (title, startDate, endDate, aggregateType) => {
    const formattedStartDate = formatDateToYYYMMDD(startDate);
    const formattedEndDate = formatDateToYYYMMDD(endDate);
    const response = await fetch(
        `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${title}/${aggregateType}/${formattedStartDate}/${formattedEndDate}`
    );
    return await response.json();
};

/**
 * Get all the revision objects on a given wikipedia title.
 *
 * The api only gives us at most 20 reivision objects per request. However, it does give us a query to
 * use if there are any older revisions. If older versions of revision exists, we will get
 * {
 *  revisions: [...],
 *  ...
 *  older: 'https://en.wikipedia.org/w/rest.php/v1/page/Jupiter/history?older_than=1103899458',
 *  ...
 * }
 *
 * Thus, we keep calling the endpoint with the given query if the older property exists in the
 * previous request.
 *
 * @param {string} title of a wikipedia article
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns An array containing all revision objects
 */
const fetchPageRevisions = async (title, startDate, endDate) => {
    const response = await fetch(`https://en.wikipedia.org/w/rest.php/v1/page/${title}/history`);
    let curJsonResponse = await response.json();

    let revisions = curJsonResponse.revisions;

    while (curJsonResponse.hasOwnProperty("older")) {
        const localResponse = await fetch(curJsonResponse.older);
        curJsonResponse = await localResponse.json();

        const localRevisions = curJsonResponse.revisions;

        // Stop making requests when requesting passes startDate
        const localLatestTimestamp = new Date(localRevisions[0].timestamp);
        if (localLatestTimestamp < startDate) break;

        revisions.push(...localRevisions);
    }

    // Filters revisions that are in between the given timerange
    return revisions.filter((revisionObject) => {
        const currentTimestamp = new Date(revisionObject.timestamp);
        return startDate <= currentTimestamp && currentTimestamp <= endDate;
    });
};

/**
 * TODO: Subject to change based on what the graph needs
 * @return formated fetchedPageViews as an array of arrays that only contain date object and count
 */
const formatPageViews = (fetchedPageViews) => {
    return Array.from(fetchedPageViews.items).map((pageViewObject) => {
        return [formatYYYYMMDDToDate(pageViewObject.timestamp), pageViewObject.views];
    });
};

/**
 * TODO: Subject to change based on what the graph needs
 * @param {AggregateType} aggregateType
 * @return formated fetchedRevisions as an array of arrays that only contain date object and count
 */
const formatPageRevisions = (fetchedRevisions, aggregateType) => {
    const pageRevisionCountMap = fetchedRevisions
        .map((revisionObject) => {
            const date = new Date(revisionObject.timestamp);
            date.setHours(0, 0, 0, 0); // have date only contains year, month, and day (not time)

            // Set date to 1 to aggregate monthly instead of daily
            if (aggregateType == _enums_js__WEBPACK_IMPORTED_MODULE_0__.AggregateType.MONTHLY) {
                date.setDate(1);
            }

            return date;
        })
        .reduce((accumulator, timestamp) => {
            accumulator[timestamp] = (accumulator[timestamp] ?? 0) + 1;
            return accumulator;
        }, {});

    // Formats into an array of arrays
    return Object.keys(pageRevisionCountMap).map((key) => [key, pageRevisionCountMap[key]]);
};

/**
 * Gets view counts on a given article within a given time range.
 *
 * @param {string} title of a wikipedia article
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {AggregateType} aggregateType an enum that represents string "monthly" or "daily"
 * @returns aggregated array of data of views per day or per month
 */
const getPageViews = async (title, startDate, endDate, aggregateType) => {
    try {
        let result = await fetchPageViews(title, startDate, endDate, aggregateType);
        let formattedResult = formatPageViews(result);
        return formattedResult;
    } catch (err) {
        console.error(
            `Error fetching page views on inputs title:${title} startDate:${startDate} endDate:${endDate} aggregateType:${aggregateType}\nError: ${err.message}`
        );
        return err;
    }
};

/**
 * Get revision counts on a given article within a given time range.
 *
 * @param {string} title of a wikipedia article
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {AggregateType} aggregateType an enum that represents string "monthly" or "daily"
 * @returns aggregated array of data of revision counts per day or per month
 */
const getPageRevisionCount = async (title, startDate, endDate, aggregateType) => {
    try {
        let result = await fetchPageRevisions(title, startDate, endDate);
        let formattedResult = formatPageRevisions(result, aggregateType);
        return formattedResult;
    } catch (err) {
        console.error(
            `Error fetching revision count on inputs title:${title} startDate:${startDate} endDate:${endDate} aggregateType:${aggregateType}\nError: ${err.message}`
        );

        return err;
    }
};




/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	__webpack_require__("./src/content/content.js");
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	__webpack_require__("./src/content/enums.js");
/******/ 	var __webpack_exports__ = __webpack_require__("./src/content/timeSeriesService.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=content.js.map
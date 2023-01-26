import { WIKI_PAGE_VIEW_DATA_AVAILABLE_DATE, AggregateType } from "./enums.js";

const formatDateToYYYYMMDD = (date) =>
    `${date.getFullYear()}${("0" + (date.getMonth() + 1)).slice(-2)}${("0" + date.getDate()).slice(-2)}`;

const formatYYYYMMDDToDate = (yyyymmdd) =>
    new Date(yyyymmdd.substring(0, 4), yyyymmdd.substring(4, 6) - 1, yyyymmdd.substring(6, 8));

// Gets number of days from date1 to date2 (inclusive)
const getDiffDaysBetweenTwoDates = (date1, date2) =>
    Math.ceil(Math.abs(date2.getTime() - date1.getTime()) / (1000 * 3600 * 24) + 1);

const getDatesBetweenTwoDates = (date1, date2) => {
    const currentDate = new Date(date1);
    return new Array(getDiffDaysBetweenTwoDates(date1, date2))
        .fill(0)
        .map(() => new Date(currentDate.setDate(currentDate.getDate() + 1)));
};

const isDateWhenPageViewDataBecameAvailable = (isPageViewTimeSeries, date) => {
    return isPageViewTimeSeries && date < WIKI_PAGE_VIEW_DATA_AVAILABLE_DATE;
};

/**
 * Formats data into Chart.js' input format. If the data is a timeseries for page views, it will
 * set all the y values of the dates before the API started collecting page views' data to null
 */
const formatResponseToTimeseries = (response, startDate, endDate, isPageViewTimeSeries) => {
    const allDates = getDatesBetweenTwoDates(startDate, endDate);
    return {
        x: allDates.map((date) => date.toLocaleDateString()),
        y: allDates.map((date) =>
            isDateWhenPageViewDataBecameAvailable(isPageViewTimeSeries, date)
                ? null
                : response.get(date.toLocaleDateString()) ?? 0
        ),
    };
};

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
    const formattedStartDate = formatDateToYYYYMMDD(startDate);
    const formattedEndDate = formatDateToYYYYMMDD(endDate);
    const response = await fetch(
        `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${title}/${aggregateType}/${formattedStartDate}/${formattedEndDate}`
    );
    return await response.json();
};

/**
 * Get all the revision objects on a given wikipedia title.
 *
 * The api only gives us at most 500 reivision objects per request. However, it does give us a svcontinue to
 * use to get more requests if needed. If older versions of revision exists, we will get
 *
 * {
 *  continue: { rvcontinue: ...},
 *  query: { pages: [ { ... revisions: [], ...} ]}
 *  ...
 * }
 *
 * Thus, we keep calling the endpoint (use rvcontinue instead of rvstart and rvend with the given query if
 * the older property exists in the previous request.
 *
 * @param {string} title of a wikipedia article
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns An array containing all revisions' timestamps
 */
const fetchPageRevisions = async (title, startDate, endDate) => {
    const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&titles=${title}&formatversion=2&rvprop=timestamp&rvslots=*&rvlimit=500&rvstart=${endDate.toISOString()}&rvend=${startDate.toISOString()}`
    );
    let curJsonResponse = await response.json();

    let revisions = curJsonResponse.query.pages[0].revisions;

    while (curJsonResponse.hasOwnProperty("continue")) {
        let continueString = curJsonResponse.continue.rvcontinue;
        const continueResponse = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&titles=${title}&formatversion=2&rvprop=timestamp&rvslots=*&rvlimit=500&rvcontinue=${continueString}`
        );

        curJsonResponse = await continueResponse.json();
        const localRevisions = curJsonResponse.query.pages[0].revisions;
        revisions.push(...localRevisions);
    }

    return revisions;
};

/**
 * @return formated fetchedPageViews as a Map object of localDateString time and page views
 */
const formatPageViews = (fetchedPageViews) => {
    return new Map(
        Array.from(fetchedPageViews.items).map((pageViewObject) => {
            return [formatYYYYMMDDToDate(pageViewObject.timestamp).toLocaleDateString(), pageViewObject.views];
        })
    );
};

/**
 * @param {AggregateType} aggregateType
 * @return formated fetchedRevisions as a Map object of localDateString time and revision count
 */
const formatPageRevisions = (fetchedRevisions, aggregateType) => {
    const pageRevisionCountMap = fetchedRevisions
        .map((revisionObject) => {
            const date = new Date(revisionObject.timestamp);
            date.setHours(0, 0, 0, 0); // have date only contains year, month, and day (not time)

            // Set date to 1 to aggregate monthly instead of daily
            if (aggregateType == AggregateType.MONTHLY) {
                date.setDate(1);
            }

            return date;
        })
        .reduce((accumulator, timestamp) => {
            accumulator[timestamp] = (accumulator[timestamp] ?? 0) + 1;
            return accumulator;
        }, {});

    return new Map(
        Object.keys(pageRevisionCountMap).map((key) => [new Date(key).toLocaleDateString(), pageRevisionCountMap[key]])
    );
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

/**
 * Get view counts on a given article in a timeseries format
 *
 * @param {string} title of a wikipedia article
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns a map of x and y. x contains array of all dates between the given range in a format MM/DD/YYYY and y contains array of page views
 */
const getPageViewTimeseries = async (title, startDate, endDate) => {
    try {
        const pageViewsResponse = await getPageViews(title, startDate, endDate, AggregateType.DAILY);
        return formatResponseToTimeseries(pageViewsResponse, startDate, endDate, true);
    } catch (err) {
        console.error(
            `Error getting page view timeseries data on title:${title} startDate:${startDate} endDate:${endDate}\nError: ${err.message}`
        );
        return err;
    }
};

/**
 * Get revision counts on a given article in a timeseries format
 *
 * @param {string} title of a wikipedia article
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns a map of x and y. x contains array of all dates between the given range in a format MM/DD/YYYY and y contains array of revision counts
 */
const getPageRevisionCountTimeseries = async (title, startDate, endDate) => {
    try {
        const pageRevisionCountResponse = await getPageRevisionCount(title, startDate, endDate, AggregateType.DAILY);
        return formatResponseToTimeseries(pageRevisionCountResponse, startDate, endDate, false);
    } catch (err) {
        console.error(
            `Error getting page revision count timeseries data on title:${title} startDate:${startDate} endDate:${endDate}\nError: ${err.message}`
        );
        return err;
    }
};

/**
 * Get the Wikipedia page creation date
 *
 * @param {string} title of a wikipedia article
 * @returns a date in YYYYMMDD format
 */
const getPageCreationDate = async (title) => {
    const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvlimit=1&rvprop=timestamp&rvdir=newer&titles=${title}&format=json`
    );
    const json = await response.json();
    const date = json.query.pages[Object.keys(json.query.pages)[0]].revisions[0].timestamp;
    return new Date(date);
};

export { getPageRevisionCountTimeseries, getPageViewTimeseries, getPageCreationDate };

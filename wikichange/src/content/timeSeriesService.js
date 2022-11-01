import { AggregateType } from "./enums.js";

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
            if (aggregateType == AggregateType.MONTHLY) {
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

export { getPageViews, getPageRevisionCount };

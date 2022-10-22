import fetch from "node-fetch";

const formatDateToYYYMMDD = (date) => `${date.getFullYear()}${date.getMonth()}${date.getDay()}`;

const formatYYYYMMDDToDate = (yyyymmdd) =>
    new Date(yyyymmdd.substring(0, 4), yyyymmdd.substring(4, 6) - 1, yyyymmdd.substring(6, 8));

/**
 * Fetches page views information on a given wikipedia title. The response will only include stat since its creation
 * if the startDate comes before the article was created.
 *
 * @param {string} title of a wikipedia article
 * @param {Date} startTimestamp in a format of YYYYMMDD
 * @param {Date} endDate in a format of YYYYMMDD
 * @param {string} aggregateType of either monthly or daily
 * @return {map} of an item of list with properties project, article, granularity(aggregationType), timestamp, access, agent, views
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
 * TODO: Subject to change based on what the graph needs
 * @return formated fetchedPageViews as a list of lists that only contain date object and count
 */
const formatPageViews = (fetchedPageViews) => {
    return Array.from(fetchedPageViews.items).map((pageViewObject) => {
        return [formatYYYYMMDDToDate(pageViewObject.timestamp), pageViewObject.views];
    });
};

/**
 * Gets view counts on a given article within a given time range.
 *
 * @param {string} title of a wikipedia article
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {AggregateType} aggregateType an enum that represents string "monthly" or "daily"
 * @returns aggregated list of data of views per day or per month
 */
const getPageViews = async (title, startDate, endDate, aggregateType) => {
    try {
        let result = await fetchPageViews(title, startDate, endDate, aggregateType);
        let formattedResult = formatPageViews(result);
        console.log(formattedResult);
        return formattedResult;
    } catch (err) {
        console.error(`Error fetching page views: ${err.message}`);
    }
};

export default getPageViews;

/**
 * Fetch the difference between 2 revision in HTML of a page
 *
 * @param {int} startID
 * @param {int} endID
 * @returns An array containing all the differences string between the start version and the end version
 */
const fetchChangeWithHTML = async (startID, endID) => {
    const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=compare&format=json&fromrev=${startID}&torev=${endID}&prop=diff%7Cids%7Ctitle%7Ctimestamp&formatversion=2`
    );
    const data = await response.json();
    const parser = new DOMParser()
    const document = parser.parseFromString(data['compare']['body'], 'text/html')
    const x = document.querySelectorAll("ins.diffchange.diffchange-inline");
    const result = [...x].map(node => node.innerText);
    return result
}

const formatDateToYYYMMDD = (date) =>
    `${date.getFullYear()}${("0" + (date.getMonth() + 1)).slice(-2)}${("0" + date.getDate()).slice(-2)}`;

/**
* Fetch the closest revision to the date (in increasing order in time)
* @param {string} title of a wikipedia article
* @param {Date} startDate
* @returns {int} an ID represent the revision
*/
const fetchRevisionFromDate = async (title, startDate) => {
   const formattedStartDate = formatDateToYYYMMDD(startDate);
   const response = await fetch(
       `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&titles=${title}&formatversion=2&rvprop=ids%7Ctimestamp&rvlimit=1&rvstart=${formattedStartDate}T18%3A34%3A42.000Z&rvdir=newer`
   );
   const data = await response.json();
   return data["query"]["pages"][0]["revisions"][0]["revid"]
};

// You get the start adn end ID from the title and the date and the passed it into the get difference in string
/**
 * Fetches click stream information on a given wikipedia title.
 *
 * @param {string} title of a wikipedia article
 * @return {map} of most click from the page and their counts
 */
const fetchClickStreamFrom = async (title, count) => {
      const response = await fetch(
            `http://localhost:8000/click_from_title_internal/${title}/${count}`)
      const json = await response.json();
      return json;
};


/**
 * 
* @param {string} title of a wikipedia article
* @return {map} of most click to another page and their counts
 */
const fetchClickStreamTo = async (title, count) => {
      const response = await fetch(
            `http://localhost:8000/click_to_title_internal/${title}/${count}`)
      const json = await response.json();
      return json;
};

export {fetchClickStreamFrom, fetchClickStreamTo}; 
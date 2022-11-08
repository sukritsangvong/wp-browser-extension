/**
 * Fetch the difference between 2 revision in HTML of a page
 *
 * @param {int} startID
 * @param {int} endID
 * @return {string} html of the difference between 2 version
 */
const fetchChangeWithHTML = async (first, second) => {
    const response = await fetch(
        "https://en.wikipedia.org/w/api.php?action=compare&format=json&fromrev=" + first+ "&torev=" + second + "&prop=diff%7Cids%7Ctitle%7Ctimestamp&formatversion=2"
    );
    const data = await response.json();
    return data['compare']['body'];
    // const parser = new DOMParser()
    // const change = parser.parseFromString(data['compare']['body'], 'text/html')
    // console.log(change)
}



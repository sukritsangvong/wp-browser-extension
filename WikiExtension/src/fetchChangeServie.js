// This functions fetch changes with line and offset between 2 revisions
const fetchChangeWithLine = async (first, second) => {
    const response = await fetch(
      "https://en.wikipedia.org/w/rest.php/v1/revision/" + first+ "/compare/" +second,
      {'Api-User-Agent': 'MediaWiki REST API docs examples/0.1 (https://www.mediawiki.org/wiki/API_talk:REST_API)'}
    );
    const data = await response.json();
    return data;
}

// This functions fetch the HTML display of the page
const fetchChangeWithHTML = async (first, second) => {
    const response = await fetch(
        "https://en.wikipedia.org/w/api.php?action=compare&format=json&fromrev=" + first+ "&torev=" + second + "&prop=diff%7Cids%7Ctitle%7Ctimestamp&formatversion=2"
    );
    const data = await response.json();
    return data['compare']['body']
}

// Pass in the title of the page to get the different between the current page and the latest revision.
// Further implementation would use page_id and a specific date
const fetchChange = async (title) => {
    const response = await fetch(
        "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&titles=" + title +"&formatversion=2&rvprop=timestamp%7Cids&rvslots=*&rvlimit=100"
    );
    const data = await response.json();
    const revisions = data["query"]["pages"][0]["revisions"]
    const curr_index = revisions[0]["revid"]
    const later_index = revisions[99]["parentid"]
    // let changes = []
    // await fetchChangeWithLine(curr_index, later_index)
    // .then((data) => (data.diff.filter(object => object.type != 0).forEach(object => changes.push(object))));
    // return changes
    const changes = await fetchChangeWithHTML(curr_index, later_index)
    return changes
}
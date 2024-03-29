import { DEBUG } from "./enums";

/**
 * Returns a console if DEBUG is true
 * Else undefinded
 */
const debug_console = (() => {
    if (DEBUG) {
        return console;
    }
})();

/** The page id can be found as the last part of the link to
 * the wikidata item on the left side of wikipedia pages.
 * If no page id is found throws an error.
 * @returns the page id of a Wikipedia page
 */
const page_id = (() => {
    let wiki_data_url;
    try {
        wiki_data_url = document.getElementById("t-wikibase").getElementsByTagName("a")[0].href;
    } catch {
        debug_console?.error("Can't find page id!");
    }
    const wiki_page_id = wiki_data_url?.split("/").slice(-1)[0];
    debug_console?.info({
        wiki_data_url: wiki_data_url,
        wiki_page_id: wiki_page_id,
    });
    return wiki_page_id;
})();

/**
 * Get the title of a Wikipedia page by inspecting the html
 * @returns a string with title of a page
 */
const title = (() => {
    const alternate_title = document.getElementById("firstHeading").innerText;
    debug_console?.info(alternate_title);
    if (alternate_title.length !== 0) {
        return alternate_title;
    }

    const titleSpan = document.getElementsByClassName("mw-page-title-main");
    if (titleSpan.length === 0) {
        const titleFromUrl = document.URL.match(/^https?:\/\/[^/]+\/[^/]+\/([^/?#]*)/i)[1].replace("_", " ");
        return titleFromUrl;
    } else {
        return titleSpan[0].innerHTML;
    }
})();
debug_console?.info(title);

/**
 * Get the Wikipedia page wikitext
 *
 * @return {string} wikitext of the article
 */
const getPageWikitext = async () => {
    const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=parse&page=${title}&prop=wikitext&format=json`
    );
    const json = await response.json();
    return json["parse"]["wikitext"]["*"];
};

export { title, getPageWikitext, page_id, debug_console };

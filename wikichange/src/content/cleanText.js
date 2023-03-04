/**
 * https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
 * Code from stack overflow to escape all special character from string to be used in a regex
 * @param {string} string to be used in regex
 * @returns {string} an escaped string that will not cause regex to read any special characters
 */
function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Will clean links. Works with links with different and same titles, for instance
 * [[text]], [[text something|text]], ''[text]'' and return the clean version "text"
 * Chat GPT helped fix this regex
 * 
 * @param {string} content
 */
const returnCleanLink = (content) => {
    return content.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1') // [[text something|text]]
            .replace(/\[\[[^\]]+\]\]/g, (match) => match.replace(/\[\[|\]\]/g, '')) // remove [[ ]]
            .replace(/''(.+)''/g, '$1'); // remove '' formatting 
};

/**
 * Will clean the wikitext, and remove some common formatting characters
 * 
 * @param {dictionary} context
 */
const cleanText = (context) => {
    for (const [type, value] of Object.entries(context)) {
        if (context[type]) {
            let clean = value.trim();
            clean = returnCleanLink(value);
            clean = clean.replace(/\{\{Cite.*?\}\}/g, "") // for Wiki {{Cite stuff
                 .replace(/cite web/g, "")
                 .replace(/=/g, "")
                 .replace(/Cite news/g, "")
                 .replace(/::/g, "")
                 .replace(/'(.*?)'/g, ""); // any text inside single quotes
            context[type] = clean;
        }
    }
    return context;
}

/**
 * If there's a link in the text to highlight, it will split and update the context after and before
 * 
 * @param {dictionary} element dictionary entry with keys "content_before", "highlight" and "content_after"
 * @returns an array of dictionaries 
 */
const splitElementNode = (element) => {
    let result = [];
    if (element.highlight.includes("[[") && element.highlight.includes("]]")) {
        // Cases where links are not simple, example: [[text something|text]]. Chat GPT helped fix the regex
        // [[, 0+ of non | (optional), the rest ]]. Won't do anything to regular links
        element.highlight = element.highlight.replace(/\[\[(?:[^|]+\|)?(.+?)\]\]/, '[[$1]]');
        // Matches any text inside the link - [[, any group of text inside (0+), and ]]
        let split = element.highlight.split(/\[\[(.*?)\]\]/);
        for (let i = 0; i < split.length; i++) {
            result.push({
                content_before: i != 0 ? split[i-1] : "",
                highlight: split[i],
                content_after: i != (split.length-1) ? split[i+1] : "",
            });
        }
        return result;
    }
    return [element];
};

export { escapeRegex, cleanText, splitElementNode };
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
 * @param {string} content
 */
const returnCleanLink = (content) => {
    return content.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1')
            .replace(/\[\[[^\]]+\]\]/g, (match) => match.replace(/\[\[|\]\]/g, ''))
            .replace(/''(.+)''/g, '$1');
};

const cleanText = (context) => {
    for (const [type, value] of Object.entries(context)) {
        if (context[type]) {
            let clean = value.trim();
            clean = returnCleanLink(value);
            clean = clean.replace(/<ref>.*<\/ref>/g, "")
                 .replace(/\{\{Cite.*?\}\}/g, "")
                 .replace(/cite web/g, "")
                 .replace(/=/g, "")
                 .replace(/{{/g, "").replace(/}}/g, "")
                 .replace(/'(.*?)'/g, "");
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
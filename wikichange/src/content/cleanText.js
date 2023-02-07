/**
 * https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
 * Code from stack overflow to escape all special character from string to be used in a regex
 * @param {string} string to be used in regex
 * @returns {string} an escaped string that will not cause regex to read any special characters
 */
function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}

/**
 * Will clean links. Works with links with different and same titles, for instance
 * [[text]], [[text something|text]], '''[text]''', ''[text]'' and return the clean version "text"
 * @param {string} content
 */
const returnCleanLink = (content) => {
    return content
        .replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, "$1")
        .replace(/\[\[[^\]]+\]\]/g, (match) => match.replace(/\[\[|\]\]/g, ""))
        .replace(/'''(.+)'''/g, "$1")
        .replace(/''(.+)''/g, "$1");
};

const cleanText = (context) => {
    for (const [type, value] of Object.entries(context)) {
        if (context[type]) {
            let clean = value.trim();
            clean = returnCleanLink(value);
            clean = clean
                .replace(/<ref>.*<\/ref>/g, "")
                .replace(/\{\{Cite.*?\}\}/g, "")
                .replace(/cite web/g, "")
                .replace(/=/g, "")
                .replace(/{{/g, "")
                .replace(/}}/g, "")
                .replace(/'(.*?)'/g, "");
            context[type] = clean;
        }
    }
    return context;
};

export { escapeRegex, cleanText };

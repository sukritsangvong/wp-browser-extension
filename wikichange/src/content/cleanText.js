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
 * [[text]] and [[text|text]] and return the clean version "text"
 * @param {string} text_with_link
 */
const returnCleanLink = (text_with_link) => {
    let pattern = /\[\[([^\|]+)\|?([^\]]+)\]\]/g;
    let result = text_with_link.replace(pattern, (_, p1, p2) => {
        return p2 || p1;
    });
    return result;
};

const getContentWithoutTags = (content) => {
    return content.replace(/<ref>.*<\/ref>/g, "").replace(/\{\{Cite.*?\}\}/g, "").replace(/cite web/g, "");
}

const cleanTitle = (content) => {
    return content.replace(/=/g, "");
}

const cleanCategory = (content) => {
    return content.replace(/{{/g, "").replace(/}}/g, "");
}

const cleanText = (context) => {
    if (context.highlight) {
        context.highlight = context.highlight.trim();
        if (context.highlight.includes("[[") && context.highlight.includes("]]")) {
            context.highlight = returnCleanLink(context.highlight);
        }
        context.highlight = getContentWithoutTags(context.highlight);
        context.highlight = cleanTitle(context.highlight);
        context.highlight = cleanCategory(context.highlight);
        return context.highlight;
    }
    return;
}

export { escapeRegex, cleanText };
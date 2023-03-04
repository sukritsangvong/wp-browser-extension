/**
 *  Highlights the words that are given with context. Support for links.
 *  Loops through the DOM tree text nodes, and if no match or patial
 *  match, checks if it's a link (parent's siblings may contain the needed text)
 *  Note: Walker code idea and sample use (eg.: document.createTreeWalker and walker.nextNode())
 *  and the regex /[|=\[\]{}]+|<[^>]*>/g are courtesy of ChatGPT
 *
 * @param {dictionary} context dictionary entry with keys "content_before", "highlight" and "content_after"
 * @param {string} color of the highlight
 */
const highlightContentUsingNodes = (context, color) => {
    context.highlight = context.highlight.trim();

    let highlightSucceeded = false;

    if (context.highlight.length == 0) {
        // This will make it faster, it was picking up a lot of empty highlighting
        return highlightSucceeded;
    }

    let textNodes = [];
    let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    let newValue, node, parent;
    textNodes.every((textNode) => {
        node = textNode;
        parent = node.parentNode;
        let value = node.nodeValue;
        newValue = value.replace(
            context.highlight,
            `<mark style='background-color: ${color}' class='extension-highlight'>${context.highlight}</mark>`
        );
        if (newValue !== value) {
            // Clean up the context.content_after and context.content_before from wiki markup, 
            // some additional cleanings not performed in cleanText
            let content_after = context.content_after.replace(/[|]+|<[^>]*>/g, "");
            let content_before = context.content_before.replace(/[|]+|<[^>]*>/g, "");
            if (value.includes(content_after) && value.includes(content_before)) {
                // Or because of edge cases, if good context this will almost always work
                let newNode = document.createElement("span");
                newNode.innerHTML = newValue;
                parent.replaceChild(newNode, node);
                highlightSucceeded = true;
                return false;
            } else {
                // Maybe it is a link, check parent's previous and next siblings
                if (
                    node.parentNode != null &&
                    node.parentNode.nextSibling != null &&
                    node.parentNode.nextSibling.nodeValue != null &&
                    node.parentNode.previousSibling != null &&
                    node.parentNode.previousSibling.nodeValue != null &&
                    node.parentNode.nextSibling.nodeValue.includes(content_after) &&
                    node.parentNode.previousSibling.nodeValue.includes(content_before)
                ) {
                    let newNode = document.createElement("span");
                    newNode.innerHTML = newValue;
                    parent.replaceChild(newNode, node);
                    highlightSucceeded = true;
                    return false;
                }

                // We can try matching with smaller context, as links or html may be further along blocking
                let short_content_after = content_after
                    .slice(0, Math.round(content_after.length * 0.1))
                    .trim();
                let short_content_before = content_before
                    .substring(Math.round(content_before.length * 0.9))
                    .trim();
                // As it is short context, we match both after and before for accuracy
                if (value.includes(short_content_after) && value.includes(short_content_before)) {
                    let newNode = document.createElement("span");
                    newNode.innerHTML = newValue;
                    parent.replaceChild(newNode, node);
                    highlightSucceeded = true;
                    return false;
                }
            }
        }
        return true;
    });
    return highlightSucceeded;
};

export { highlightContentUsingNodes };
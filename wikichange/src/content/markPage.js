const stylesheet = document.createElement('style');
document.head.append(stylesheet);

/**
 * Add a highlight over an index range
 * @param {int} start of the indexes to highlight
 * @param {int} end of the indexes to highligh (inclusive)
 */
const markPage = (start, end) => {
    let style = '';
    for(let i = start; i <= end; i++) {
        style += `mark#mark-${i} {
            background-color: yellow;
        }
        `;
    }
    stylesheet.innerText += style;
};

/**
 * Remove all highlights
 */
const removeMarks = () => {
    stylesheet.innerText = '';
};

export { markPage, removeMarks };
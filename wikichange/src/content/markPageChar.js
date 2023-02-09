const stylesheet = document.createElement('style');
document.head.append(stylesheet);

/**
 * Add a highlight over an index range
 * @param {int} start of the indexes to highlight
 * @param {int} end of the indexes to highligh (inclusive)
 * @param {string} color of the highlight mark
 */
const markPageChar = (start, end, color) => {
    let style = '';
    for(let i = start; i <= end; i++) {
        style += `mark#mark-${i}, `
    }
    stylesheet.innerText += `${style.slice(0, style.length-2)} {
        background-color: ${color};
    }
    `;
};

/**
 * Remove all highlights
 */
const removeMarks = () => {
    stylesheet.innerText = '';
};

export { markPageChar, removeMarks };
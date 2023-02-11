const stylesheet = document.createElement('style');
document.head.append(stylesheet);

let toMark = '';

/**
 * Keep track in characters to highlight
 * @param {int} start of the indexes to highlight
 * @param {int} end of the indexes to highligh (inclusive)
 */
const addChars = (start, end) => {
    for(let i = start; i <= end; i++) {
        toMark += `mark#mark-${i}, `;
    }
};

/**
 * Apply a highlight to all the saved characters
 * @param {string} color of the highlighted marks
 */
const applyMarks = (color) => {
    stylesheet.innerText = `${toMark.slice(0, toMark.length-2)} {
        background-color: ${color};
    }
    `;
}

/**
 * Remove all highlights
 */
const removeMarks = () => {
    stylesheet.innerText = '';
    toMark = '';
};

export { addChars, applyMarks, removeMarks };
const stylesheet = document.createElement('style');
document.head.append(stylesheet);

let toMark = '';
let toStyle = '';
/**
 * Keep track in characters to highlight
 * @param {int} start of the indexes to highlight
 * @param {int} end of the indexes to highligh (inclusive)
 */
const addChars = (start, end) => {
    for(let i = start; i <= end; i++) {
        toMark += `mark#mark-${i}, `;
    }
    if(toMark.length > 3000){
        toStyle += `${toMark.slice(0, toMark.length-2)} {
            background-color: var(--highlight-color);
        }
        `;
        toMark='';
    }
};

/**
 * Apply a highlight to all the saved characters
 */
const applyMarks = () => {
    stylesheet.innerText = toStyle;
    toMark = '';
    toStyle = '';
}

/**
 * Remove all highlights
 */
const removeMarks = () => {
    stylesheet.innerText = '';
    toMark = '';
    toStyle = '';
};

export { addChars, applyMarks, removeMarks };
import { map } from "./tagEveryWord";

const stylesheet = document.createElement('style');
document.head.append(stylesheet);

let toMark = '';
let toStyle = '';

/**
 * Add a highlight over an index range
 * @param {int} start of the indexes to highlight
 * @param {int} end of the indexes to highligh (inclusive)
 */
const addWords = (start, end) => {
    let prevStart = 0;
    let intermediary = [];
    for (let index of map){
        if(index <= start){
            prevStart = index;
        } else {
            intermediary.push(index);
        }
        if(index > end){
            intermediary.pop();
            break;
        }
    }
    toMark += intermediary.reduce((accumulator, index) => `${accumulator}mark#mark-${index}, `, `mark#mark-${prevStart}, `);
    if (toMark.length > 3000){
        toStyle += `${toMark.slice(0, toMark.length-2)} {
            background-color: var(--highlight-color);
        }
        `;
        toMark='';
    }
};

/**
 * Apply a highlight to all the saved words
 */
const applyMarks = () => {
    stylesheet.innerText = toStyle;
    toMark = '';
    toStyle = '';
};

/**
 * Remove all highlights
 */
const removeMarks = () => {
    stylesheet.innerText = '';
    toMark = '';
    toStyle = '';
};

export { addWords, applyMarks, removeMarks };
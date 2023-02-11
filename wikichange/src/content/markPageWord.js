import { map } from "./tagEveryWord";

const stylesheet = document.createElement('style');
document.head.append(stylesheet);

let toMark = '';

/**
 * Add a highlight over an index range
 * @param {int} start of the indexes to highlight
 * @param {int} end of the indexes to highligh (inclusive)
 */
const addWords = (start, end) => {
    let prevStart = 0;
    let intermediary = [];
    for(let index of map){
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
    toMark += intermediary.reduce((accumulator, index) => `${accumulator}, mark#mark-${index}`, `mark#mark-${prevStart}`);
};

/**
 * Apply a highlight to all the saved words
 * @param {string} color of the highlighted marks
 */
const applyMarks = (color) => {
    stylesheet.innerText = `${toMark} {
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

export { addWords, applyMarks, removeMarks };
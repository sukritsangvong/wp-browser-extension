import { map } from "./tagEveryWord";
const stylesheet = document.createElement('style');
document.head.append(stylesheet);

/**
 * Add a highlight over an index range
 * @param {int} start of the indexes to highlight
 * @param {int} end of the indexes to highligh (inclusive)
 */
const markPageWord = (start, end) => {
    let prevStart = 0;
    let intermediary = [];
    for(let index in map){
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
    console.info(intermediary);
    let style = intermediary.reduce((accumulator, index) => `${accumulator}, mark#mark-${index}`, `mark#mark-${prevStart}`);
    style = `${style} {
            background-color: yellow;
        }
        `;
    stylesheet.innerText += style;
};

/**
 * Remove all highlights
 */
const removeMarks = () => {
    stylesheet.innerText = '';
};

export { markPageWord, removeMarks };
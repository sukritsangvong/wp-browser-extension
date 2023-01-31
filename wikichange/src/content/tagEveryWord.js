/** 
 * Add a <mark id="mark-{index}">{char}</mark> tag around every character
 * @return {string} Returns a the concatenated text where each character index matches the mark id 
 */
const tagEveryWord = () => {
    const bodyContent = document.getElementById('mw-content-text').getElementsByClassName('mw-parser-output')[0];
    const treeWalker = document.createTreeWalker(
        bodyContent,
        NodeFilter.SHOW_TEXT,
        (node) => {
            if (node.parentElement.tagName === 'STYLE') {
                return NodeFilter.FILTER_REJECT;
            }
            // Skip the references
            // if (node.parentElement.closest('.reflist')){
            //     return NodeFilter.FILTER_REJECT;
            // }
            if (node.nodeValue.trim()){
                return NodeFilter.FILTER_ACCEPT;
            } 
        }
    );
    
    let nodesToChange = [];
    while(treeWalker.nextNode()) {
        nodesToChange.push(treeWalker.currentNode);
    }

    return nodesToChange.reduce((accumulator, node) => {
        if(accumulator['text'].length !== 0){
            accumulator['text'] += ' ';
            accumulator['index']++;
        }
        accumulator['text'] += node.textContent;
        
        const isAlphanumeric = new RegExp('[a-zA-Z0-9]');
        const fragment = document.createDocumentFragment();
        let taggedNode;
        for(let char of node.textContent) {
            if(isAlphanumeric.test(char)) {
                if(taggedNode) {
                    taggedNode.innerText += char;
                    accumulator['index']++;
                } else {
                    taggedNode = document.createElement('mark');
                    taggedNode.id = `mark-${accumulator['index']}`;
                    accumulator['map'].push(accumulator['index']++);
                    taggedNode.innerText = char;
                }
            } else {
                if(taggedNode) {
                    fragment.appendChild(taggedNode);
                }
                if(char === ' '){
                    taggedNode = document.createTextNode(' ');
                    fragment.appendChild(taggedNode);
                    accumulator['index']++;
                    taggedNode = undefined;
                    continue;
                }
                taggedNode = document.createElement('mark');
                taggedNode.id = `mark-${accumulator['index']}`;
                accumulator['map'].push(accumulator['index']++);
                taggedNode.innerText = char;
                fragment.appendChild(taggedNode);
                taggedNode = undefined;
            }
        }
        if(taggedNode) {
            fragment.appendChild(taggedNode);
        }
        node.parentNode.replaceChild(fragment, node)
        return accumulator;
    }, {"text":'', "index":0, "map":[]});
}

const { text, map } = tagEveryWord();

export { text, map };


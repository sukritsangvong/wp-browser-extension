const bodyContent = document.getElementById('bodyContent');
const referenceText = bodyContent.innerText;
console.info(referenceText);

const cleanWord = (text) => {
    return text;
};

const tagEveryWord = () => {
    const treeWalker = document.createTreeWalker(
        bodyContent,
        NodeFilter.SHOW_TEXT,
        (node) => {
            if (node.parentElement.tagName === 'STYLE') {
                return NodeFilter.FILTER_REJECT;
            }
            if (node.nodeValue.trim()){
                return NodeFilter.FILTER_ACCEPT;
            } 
        }
    );
    
    while(treeWalker.nextNode()) {
        treeWalker.currentNode.textContent = treeWalker.currentNode.textContent.replace(/e/gi, '<span>e</span>');
        // currentNode = treeWalker.nextNode();
    }
}

tagEveryWord();
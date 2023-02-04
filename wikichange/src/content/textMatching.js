import { getPageWikitext } from "./globals";
import { escapeRegex } from "./cleanText";


class Graph {
    constructor(_nodes) {
        this.nodes = _nodes.filter(x => x.length > 0).map(x => x.map(j => j.index));
        console.log(this.nodes);
        this.nodes.reduce((mainNodes, currNodes) => {
            const nextNodes = this.setDifference(mainNodes, currNodes);
            console.log(nextNodes);

            return nextNodes;
        }, this.nodes.flat());
    }

    setDifference(mainSet, removeSet) {
        return mainSet.filter(x => !removeSet.includes(x));
    }
}

export default class textMatching {
    constructor(_text) {
        this.text = _text;
        getPageWikitext().then((_wikitext) => {
            this.wikitext = _wikitext;
            console.info(this.wikitext);
        });
    }

    matchToWikitext(_change) {
        const start = [...this.wikitext.matchAll(new RegExp(escapeRegex(_change), 'g'))];
        if (start.length > 0){
            if (start.length > 1) {
                console.warn("More than one match in wikitext: ", _change);
            }
            return [true, start[0]['index'], start[0]['index'] + _change.length];
        } else {
            console.warn("No matches in wikitext: ", _change);
            return [false];
        }
    }
    
    /**
     * @param {object} context Object containing the context_before, context_after and highlight portions
     * @returns an array where the first item is a boolean if a match was found
     * , the second is the start index of the item found
     * and the last is the end index of the item found
    */
    match(context) {
        const {content_before, highlight, content_after } = context;
        this.matchToWikitext(content_before + highlight + content_after);

        
        const start = [...this.text.matchAll(new RegExp(escapeRegex(highlight), 'g'))];
        if (start.length > 0){
            return [true, start[0]['index'], start[0]['index'] + highlight.length];
        } else {
            return [false];
        }
        
    }

    matchWikitextToText(before) {
        const node_regex = /([a-zA-Z]+ ?){2,}/g;
        const nodes = before.match(node_regex);
        console.log(nodes);
        const nodeMatches = nodes.map((a) => [...this.text.matchAll(new RegExp(escapeRegex(a), 'g'))]);
        console.log(nodeMatches);
    }

}
import { getPageWikitext } from "./globals";
import { escapeRegex } from "./cleanText";
import { debug_log, debug_warn } from "./helper";


class Graph {
    constructor(_nodes) {
        this.nodes = _nodes.filter(x => x.length > 0).map(x => x.map(j => j.index));
        debug_log(this.nodes);
        this.nodes.reduce((mainNodes, currNodes) => {
            const nextNodes = this.setDifference(mainNodes, currNodes);
            debug_log(nextNodes);

            return nextNodes;
        }, this.nodes.flat());
    }

    setDifference(mainSet, removeSet) {
        return mainSet.filter(x => !removeSet.includes(x));
    }
}

export default class textMatching {
    #matchWikitextToText() {
        const node_regex = /([a-zA-Z0-9]+ )([a-zA-Z0-9]+ ?)+/g;
        const nodes = this.wikitext.match(node_regex);
        console.log(nodes);
        let nodeMatches = nodes.map((a) => ({
            "matches": [...this.text.matchAll(new RegExp(escapeRegex(a), 'g'))],
            "start": -1,
            "end": -1
        })).filter((element) => element.matches.length > 0);
        console.log(nodeMatches);
        let new_change = true;

        let non_solved_index = Array.apply(null, Array(nodeMatches.length)).map(function (x, i) { return i; })
        while(new_change) {
            console.count(non_solved_index.length);
            new_change = false;
            let prev_end = -1;
            for(const [loc, index] of non_solved_index.entries()) {
                if (nodeMatches[index].start === -1) {
                    if (nodeMatches[index].matches.length === 1) {
                        nodeMatches[index].start = nodeMatches[index].matches[0].index;
                        nodeMatches[index].end = nodeMatches[index].start + nodeMatches[index].matches[0][0].length - 1;
                        non_solved_index.splice(loc, 1);
                        new_change = true;
                    } else {
                        for(let j in nodeMatches[index].matches){
                            if (nodeMatches[index].matches[j].index <= prev_end) {
                                nodeMatches[index].matches.splice(j,1);
                                new_change = true;
                            }
                        }
                        if(index < nodeMatches.length - 1 && nodeMatches[parseInt(index)+1].start !== -1){
                            for(let j in nodeMatches[index].matches){
                                if (nodeMatches[index].matches[j].index >= nodeMatches[parseInt(index)+1].start) {
                                    nodeMatches[index].matches.splice(j,1);
                                    new_change = true;
                                }
                            }
                        }
                    }
                } else {
                    prev_end = nodeMatches[index].end;
                }
            }
        }
        console.log(nodeMatches);
        nodeMatches.forEach(({start, end,}) => {
            if(start !== -1){
                this.track(start, end);
            }
        });
    }

    #matchToWikitext(context) {
        const {content_before, highlight, content_after } = context;
        const _change = content_before + highlight + content_after;
        const start = [...this.wikitext.matchAll(new RegExp(escapeRegex(_change), 'g'))];
        if (start.length > 0){
            if (start.length > 1) {
                debug_warn("More than one match in wikitext: ", _change);
            }
            return [true, start[0]['index'] + content_before.length, start[0]['index'] + content_before.length + highlight.length];
        } else {
            debug_warn("No matches in wikitext: ", _change);
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
        const [ found, _start, end ] = this.#matchToWikitext(context);
        if(found) {
            // debug_log(this.wikitext.slice(_start, end));
            // debug_log(context.highlight);
        }

        
        // const start = [...this.text.matchAll(new RegExp(escapeRegex(highlight), 'g'))];
        // if (start.length > 0){
        //     return [true, start[0]['index'], start[0]['index'] + highlight.length];
        // } else {
        //     return [false];
        // }
        
    }

    

    constructor(_text, _track, _apply) {
        this.text = _text;
        this.track = _track
        getPageWikitext().then((_wikitext) => {
            this.wikitext = _wikitext;
            this.mapping = Array(this.wikitext.length).fill(-1);
            this.#matchWikitextToText();
            _apply('green');
        });
    }

}
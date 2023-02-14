import { getPageWikitext } from "./globals";
import { escapeRegex } from "./cleanText";
import { debug_log, debug_warn } from "./helper";

export default class textMatching {
    #matchWikitextToText() {
        const node_regex = /([^-[\]\\{}|<>\n]+[- ])([^-[\]\\{}|<>\n]+[- ]?)+/g;
        const nodes = [...this.wikitext.matchAll(node_regex)];
        console.log(nodes);
        let nodeMatches = nodes.map((a) => ({
            "matches": [...this.text.matchAll(new RegExp(escapeRegex(a[0]), 'g'))],
            "start": -1,
            "end": -1,
            "wikitext_start": a.index
        })).filter((element) => element.matches.length > 0);

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
                        for(let i = 0; i < nodeMatches[index].matches[0][0].length; i++){
                            this.mapping[nodeMatches[index].wikitext_start + i] = nodeMatches[index].start + i;
                        }
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
                const arr = []
                for(let i = start; i < end; i++){
                    arr.push(i);
                }
                this.track(arr);
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
            let mapping_interval = this.mapping.slice(
                start[0]['index'] + content_before.length,
                start[0]['index'] + content_before.length + highlight.length + 1
            ).filter((i) => i !== -1);
            return [mapping_interval.length > 0, mapping_interval];
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
        const [ found, mapping_interval ] = this.#matchToWikitext(context);
        if(found) {
            this.track(mapping_interval);
        }
        return found;
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
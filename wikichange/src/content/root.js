import { HighlightType, HIGHLIGHT_TYPE } from "./enums";

let text = '';
if (HIGHLIGHT_TYPE == HighlightType.TAGGING_CHAR) {
    const { tagEveryChar } = require("./tagEveryChar");
    text = tagEveryChar();
} else if (HIGHLIGHT_TYPE == HighlightType.TAGGING_WORD) {
    const { tagEveryWord } = require("./tagEveryWord");
    const result = tagEveryWord();
    text = result.text;
}

import "./content";
export { text };
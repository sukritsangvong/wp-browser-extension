import { text } from "./tagEveryWord";
import { markPage, removeMarks } from "./markPage";
import "./content";

console.info(text.substring(0, 21));
console.info(text.substring(50, 91));
markPage(0, 20);
markPage(50, 90);
setTimeout(() => {
    removeMarks();
    console.warn('mark clear!');
}, 5500);
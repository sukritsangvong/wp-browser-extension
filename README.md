# wp-browser-extension

## Dev

### Set Up

1. Make sure node 16.18.0 is installed - you can do this using nvm (node version manger)
2. `cd wikichange`
3. `npm install`
4. `npm run start` (dev build) or `npm run build` (production build)
5. Visit [chrome://extensions/](chrome://extensions/) and toggle developper mode ON
6. For dev build click on `Load unpacked` and select the wikichange/dist folder

NOTE: The dist folder is autogenerated code based off of what is in the src folder.

### How to do highlighting

Highlighting needs to be given raw content (text, including bolding and links). See the example from the Carleton page.

### Set the desired highlighting method

We have 3 highlighting methods (HighlightType.NODE, HighlightType.TAGGING_CHAR, HighlightType.TAGGING_WORD).
For more info, look at the enums.js file.

To change methods, go to ```root.js``` and change the var ```HIGHLIGHT_TYPE```

#### Highlighting without context

```javascript
const changes = [
  "ranked #1 in Undergraduate Teaching by U.S. News & World Report for over a decade",
  "Founded in 1866",
  "Admissions is highly selective",
  "Carleton is one of the highest sources of undergraduate students pursuing doctorates",
];
let arrayLength = changes.length;
for (let i = 0; i < arrayLength; i++) {
  highlightContent(changes[i], "#99FF84");
}
```

#### Highlighting with context

```javascript
const arr = [
  {
    content_before: "college ",
    highlight: "have",
    content_after: " included",
  },
  {
    content_before: "Admissions is ",
    highlight: "highly selective",
    content_after: " with",
  },
  {
    content_before: "800-acre ",
    highlight: "Cowling Arboretum",
    content_after: ", which",
  },
  {
    content_before: "Teaching by ",
    highlight: "U.S. News & World Report",
    content_after: " for over a decade",
  },
  {
    content_before: "was ",
    highlight: "founded in",
    content_after: " 1866",
  },
];

let arrayLength = arr.length;
for (let i = 0; i < arrayLength; i++) {
  highlightContentUsingNodes(arr[i], "#99FF84");
}
```

### How to get page count

Use enums.js as inputs for some of the parameters if needed.

```javascript
import { getPageViewTimeseries } from "./timeseriesService.js";

// Get page views for the Pasta article
const pastaResponse = await getPageViewTimeseries(
  "Pasta",
  new Date("2015-07-01"),
  new Date("2022-01-01")
);
/*
    Returns:
    {
        x: ["7/1/2015", "7/2/2015", ...]
        y: [2406, 2076, ...]
    }
 */
```

### How to get revision count

```javascript
import { getPageRevisionCountTimeseries } from "./timeseriesService.js";

// Get revision count for the Pasta article from Jan 2022
const pastaRevisionResponse = await getPageRevisionCountTimeseries(
  "Pasta",
  new Date("2022-01-01"),
  new Date("2022-01-31")
);
/*
    Returns:
    {
        x: ["1/1/2022", ..., "1/8/2022", ...]
        y: [0, 0, ..., 1, ...]
    }
*/
```

## How to use the highlight functions

### The Char Version vs Word Version

To run the char version import the following in root.js or a file that is eventually imported in root.js to get the marks created in the html.
```javascript
import { text } from "./tagEveryChar";
import { markPageChar, removeMarks } from "./markPageChar";
``` 

To run the word version import the following in root.js or a file that is eventually imported in root.js to get the marks created in the html.
```javascript
import { text } from "./tagEveryWord";
import { markPageWord, removeMarks } from "./markPageWord";
``` 

Make sure that not both are being used at the same time and for best performance disable the old highlighting mechanism, which is easiest done by commenting out
```javascript
import "./content";
```
in root.js. Note, this will disable the graph as well.

## How to get highlight count

### Node Version
The highlight node code in content.js keeps track of the changes that it managed to highlight and the changes that it failed to highlight. You can get the length attribute of the arrays to get a count. 

### Mark Version
The markContent funciton reutrns an object of with a succeed and fail array of the content. You can get the length attribute of the arrays to get a count. 

```javascript
markContent(arr, "#AFE1AF").then(({ succeed, fail }) => {
            console.info(succeed.length);
            console.groupCollapsed('succeed');
            console.info(succeed);
            console.groupEnd();

            console.groupCollapsed('fail');
            console.info(fail);
            console.groupEnd();
        });
```

## Testing Code

```javascript
console.info(text.substring(0, 21));
console.info(text.substring(50, 91));
markPageChar(0, 20); // Works with markPageWord
markPageChar(50, 90); // Works with markPageWord
setTimeout(() => {
    removeMarks();
    console.warn('mark clear!');
}, 5500);
```

## [Website](https://sukritsangvong.github.io/wp-browser-extension/)

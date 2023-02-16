# [Wiki Addition Viewer: An extension to add insights to your Wikipedia experience](https://sukritsangvong.github.io/wp-browser-extension/)


# Dev

## Set Up the code for development

1. Make sure node 16.18.0 is installed - you can do this using nvm (node version manger)
2. `cd wikichange`
3. `npm install`
4. `npm run start` (dev build) or `npm run build` (production build)
5. Visit [chrome://extensions/](chrome://extensions/) and toggle developper mode ON
6. For dev build click on `Load unpacked` and select the wikichange/dist folder

NOTE: The dist folder is autogenerated code based off of what is in the src folder.

## Useful functionality

### Getting page view counts

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

### Getting page revision counts

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

## Highlighting

Highlighting needs to be given raw content (text, including bolding and links). To highlight something, we need a context dictionary, with what is supposed to be highlighted, the content after and before. 

### Set the desired highlighting method

We have 3 highlighting methods (HighlightType.NODE, HighlightType.TAGGING_CHAR, HighlightType.TAGGING_WORD). Each one has its pros and cons. For more info, look at the enums.js file, and read the next sections.

To change methods, go to ```root.js``` and change the var ```HIGHLIGHT_TYPE```

### Highlighting - Node Version

In this method, we go over the DOM tree text nodes searching for what should be highlighted, and only do so if the context before and after matches. There are several edge cases, so sometimes we use short context before/after. This type of highlighting is not ideal when the content to be highlighted is in different text nodes.

```javascript
const arr = [
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

## Highlighting - Char Version and Word Version

This method will tag the entire wikipedia page, and we can highlight the given text by setting some CSS matching the given class. We can do highlighting in one pass, but it may be slower than the node version, however shouldn't be a problem in regular Wikipedia pages. For heavy pages, there's a way to not tag the references at the bottom of the page. 

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


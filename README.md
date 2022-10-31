# wp-browser-extension

## Dev

### Set Up

1. Visit [chrome://extensions/](chrome://extensions/) and toggle developper mode ON
2. Click on `Load unpacked` and select the WikiExtension folder

### How to do highlighting

Highlighting needs to be given raw content (text, including bolding and links). See the example from the Carleton page.

```javascript
const persistent = [
    "ranked #1 in Undergraduate Teaching by U.S. News & World Report for over a decade",
    "Founded in 1866",
    "Admissions is highly selective",
    "Carleton is one of the highest sources of undergraduate students pursuing doctorates",
];
var arrayLength = persistent.length;
for (var i = 0; i < arrayLength; i++) {
    highlightPersistentContent(persistent[i], "#99FF84");
}
```

### How to get page count

Use enums.js as inputs for some of the parameters if needed.

```javascript
import { WIKI_CREATION_DATE, AggregateType } from "./enums.js";
import { getPageViews } from "./timeseriesService.js";

// Get page views for the Pasta article since its creation until the beginning of 2022 by day
const pastaResponse = await getPageViews("Pasta", WIKI_CREATION_DATE, new Date("2022-01-01"), AggregateType.DAILY);
/*
    Returns:
    [
        [ 2015-07-01T05:00:00.000Z, 2406 ],
        [ 2015-07-02T05:00:00.000Z, 2076 ],
        [ 2015-07-03T05:00:00.000Z, 1890 ],
        [ 2015-07-04T05:00:00.000Z, 1770 ],
        [ 2015-07-05T05:00:00.000Z, 1941 ],
        ...
    ]
 */
```

### How to get revision count

```javascript
import { AggregateType } from "./enums.js";
import { getPageRevisionCount } from "./timeseriesService.js";

// Get monthly revision count for the Pasta article from Jan 2022
const pastaRevisionResponse = await getPageRevisionCount(
    "Pasta",
    new Date("2022-01-01"),
    new Date("2022-01-31"),
    AggregateType.DAILY
);
console.log(pastaRevisionResponse);
/*
    Returns:
    {
        'Sat Jan 15 2022 00:00:00 GMT-0600 (Central Standard Time)': 1,
        'Sat Jan 08 2022 00:00:00 GMT-0600 (Central Standard Time)': 1
    }
*/
```

## [Website](https://sukritsangvong.github.io/wp-browser-extension/)

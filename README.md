# wp-browser-extension

## Dev

### Set Up

1. Visit [chrome://extensions/](chrome://extensions/) and toggle developper mode ON
2. Click on ```Load unpacked``` and select the WikiExtension folder

### How to do highlighting

Highlighting needs to be given raw content (text, including bolding and links). See the example from the Carleton page. 

```javascript
const persistent = ['ranked #1 in Undergraduate Teaching by U.S. News & World Report for over a decade', 'Founded in 1866', 
                    'Admissions is highly selective', 'Carleton is one of the highest sources of undergraduate students pursuing doctorates'];
var arrayLength = persistent.length;
for (var i = 0; i < arrayLength; i++) {
    highlightPersistentContent(persistent[i], '#99FF84');
}
```

## [Website](https://sukritsangvong.github.io/wp-browser-extension/)

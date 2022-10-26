# wp-browser-extension

## Dev

### Set Up

1. Visit [chrome://extensions/](chrome://extensions/) and toggle developper mode ON
2. Click on ```Load unpacked``` and select the WikiExtension folder

### How to verify changes

1. Get the ids of the revision that you are currently working on and also the title of the page to pass to this link https://en.wikipedia.org/w/index.php?title=Ukraine&type=revision&diff=1116109039&oldid=1107151384. If you are not sure how to get title of the page, go to History on the page you are interested in the use Compared then change the ids.
2. Call fetchChange with the title of the page you are interested in
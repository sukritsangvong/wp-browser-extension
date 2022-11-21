const fetchChangeWithHTML = async (startID, endID) => {
    const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=compare&format=json&fromrev=${startID}&torev=${endID}&prop=diff%7Cids%7Ctitle%7Ctimestamp&formatversion=2`
    );
    const data = await response.json();
    const parser = new DOMParser();

    const document = parser.parseFromString(data["compare"]["body"], "text/html");
    const insNodes = document.querySelectorAll("ins.diffchange.diffchange-inline");
    const divsWithInsWithDuplicate = [...insNodes].map((node) => {
        return node.parentElement;
    });

    // Removes duplicate divs
    const divsWithIns = divsWithInsWithDuplicate.filter(
        (v, i, a) => a.findIndex((v2) => v2.innerHTML === v.innerHTML) === i
    );

    // Construct result array of maps
    let contentBefore = "";
    let highlight = "";
    let contentAfter = "";
    const result = [];
    divsWithIns.forEach((element) => {
        element.childNodes.forEach((child) => {
            const nodeType = child.nodeType;
            const content = child.textContent;

            if (nodeType == Node.TEXT_NODE) {
                // div of text
                if (contentBefore == "") {
                    contentBefore = content;
                } else {
                    contentAfter = content;
                    result.push({
                        content_before: contentBefore,
                        highlight: highlight,
                        content_after: contentAfter,
                    });
                    contentBefore = "";
                    highlight = "";
                    contentAfter = "";
                }
            } else if (nodeType == Node.ELEMENT_NODE) {
                // div of ins
                highlight += content;
            } else {
                // something else
                console.error("SHOULD NOT EVER REACH THIS ELSE IN COMPARE REVISION");
            }
        });
    });
    return result;
};

export default fetchChangeWithHTML;

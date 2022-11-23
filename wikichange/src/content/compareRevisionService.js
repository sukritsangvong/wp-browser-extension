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
        console.log(element);
        element.childNodes.forEach((child) => {
            console.log(child);
            const nodeName = child.nodeName;
            const content = child.textContent.replaceAll(/(<ref.*?>.*?<\/ref>)/g, "");

            if (nodeName == "#text") {
                if (contentBefore == "") {
                    contentBefore = content;
                } else {
                    contentAfter = content;

                    addJsonToResultAndReset(result, contentBefore, highlight, contentAfter);
                    contentBefore = "";
                    highlight = "";
                    contentAfter = "";
                }
            } else if (nodeName == "INS") {
                highlight += content;
            }
        });

        if (contentBefore != "" || highlight || ("" && contentAfter) || "") {
            addJsonToResultAndReset(result, contentBefore, highlight, contentAfter);
            contentBefore = "";
            highlight = "";
            contentAfter = "";
        }
    });
    return result;
};

const addJsonToResultAndReset = (result, contentBefore, highlight, contentAfter) => {
    console.log({ before: contentBefore, high: highlight, after: contentAfter });
    // Only look at max 20 characters before and after
    result.push({
        content_before: contentBefore.substring(Math.max(contentBefore.length - 20, 0)),
        highlight: highlight,
        content_after: contentAfter.substring(0, Math.min(contentAfter.length, 21)),
    });
};

export default fetchChangeWithHTML;

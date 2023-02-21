document.addEventListener('DOMContentLoaded', function () {
    const compsLink = document.getElementById("comps-website");
    compsLink.onclick = function () {
        chrome.tabs.create({active: true, url: compsLink.href});
    };
    document.getElementById('options').addEventListener('click', event => {
        event.preventDefault();
        chrome.runtime.openOptionsPage();
    });
});
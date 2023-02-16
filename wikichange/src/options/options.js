//https://developer.chrome.com/docs/extensions/mv3/options/

// Saves options to chrome.storage
function save_options() {
    const highlight = document.getElementById('higlighting-on-off').checked;
    const invert = document.getElementById('invert-highlighting').checked;
    const color = document.getElementById('highlight-color').value;
    chrome.storage.sync.set({
        higlightingOnOff: highlight,
        invertHighlighting: invert,
        highlightColor: color
    }, function () {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value higlightingOnOff = true and invertHighlighting = false.
    chrome.storage.sync.get({
        higlightingOnOff: true,
        invertHighlighting: false,
        highlightColor: '#AFE1AF'
    }, function (items) {
        console.log(items);
        document.getElementById('higlighting-on-off').checked = items.higlightingOnOff;
        document.getElementById('invert-highlighting').checked = items.invertHighlighting;
        document.getElementById('highlight-color').value = items.highlightColor;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    save_options();
})
/** https://developer.chrome.com/docs/extensions/mv3/options/ */

/** Saves options to chrome.storage */
function save_options() {
    const color = document.getElementById("highlight-color").value;
    chrome.storage.sync.set(
        {
            highlightColor: color,
        },
        function () {
            /** Update status to let user know options were saved. */
            const status = document.getElementById("status");
            status.textContent = "Options saved.";
            setTimeout(function () {
                status.textContent = "";
            }, 750);
        }
    );
}

/** Restores select box and checkbox state using the preferences
 * stored in chrome.storage.
 */
function restore_options() {
    /** Use default value highlightColor #AFE1AF */
    chrome.storage.sync.get(
        {
            highlightColor: "#AFE1AF",
        },
        function (items) {
            document.getElementById("highlight-color").value = items.highlightColor;
        }
    );
}

/** Reset color to default and store change
 */
function reset_color() {
    /** Use default value highlightColor #AFE1AF */
    chrome.storage.sync.set(
        {
            highlightColor: "#AFE1AF",
        },
        function () {
            document.getElementById("highlight-color").value = "#AFE1AF";
            /** Update status to let user know options were saved. */
            const status = document.getElementById("status");
            status.textContent = "Options saved.";
            setTimeout(function () {
                status.textContent = "";
            }, 750);
        }
    );
}

document.addEventListener("DOMContentLoaded", restore_options);
document.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    save_options();
});
document.getElementById("restore-color").addEventListener("click", reset_color);

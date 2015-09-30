window.addEventListener('DOMContentLoaded', function() {
    chrome.windows.create({'url': 'window.html', 'focused': false});
});
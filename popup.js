function openReadWindow (text) {
  if (text) {
    chrome.windows.create({'url': 'window.html', 'focused': false});
  }
  window.close();
}

window.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    }, function(tabs) {
        chrome.tabs.sendMessage(
                tabs[0].id,
                {from: 'popup', subject: 'text'},
                openReadWindow);
    });
});
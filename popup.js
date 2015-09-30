function openHighlightedText(text) {
    var words = text.split(/\s+/);
    var line = document.createElement('div');
    for(var i = 0; i < words.length; i++) {
      if (i % 3 == 0 && i != 0) {
        line.className = 'line';
        document.getElementById('text').appendChild(line);
        line = document.createElement('div');
      }
      line.innerHTML += words[i] + ' ';
    }
    document.getElementById('text').appendChild(line);
}

window.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        chrome.tabs.sendMessage(
                tabs[0].id,
                {from: 'popup', subject: 'text'},
                openHighlightedText);
    });
});
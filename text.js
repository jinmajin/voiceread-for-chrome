function openHighlightedText(text) {
  var words = text.split(/\s+/);
  var line = document.createElement('div');
  for(var i = 0; i < words.length; i++) {
    var word = document.createElement('span');
    word.className = 'word';
    word.id = 'word-' + i;
    word.innerHTML = words[i];
    if (i % 3 == 0 && i != 0) {
      line.className = 'line';
      document.getElementById('text').appendChild(line);
      line = document.createElement('div');
    }
    line.appendChild(word);

    var wordUtterance = new SpeechSynthesisUtterance(words[i]);
    wordUtterance.onstart = highlight(word);
    wordUtterance.onend = unhighlight(word);
    speechSynthesis.pause();
    speechSynthesis.speak(wordUtterance);
  }
  document.getElementById('text').appendChild(line);
  speechSynthesis.resume();
}

function highlight(word) {
  return function() {
      word.className = 'highlighted word';
    };
}

function unhighlight(word) {
  return function() {
      word.className = 'word';
    };
}

window.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
  }, function(tabs) {
      chrome.tabs.sendMessage(
              tabs[0].id,
              {from: 'popup', subject: 'text'},
              openHighlightedText);
  });
});
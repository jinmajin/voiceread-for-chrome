var voices = [];
var wordElements = [];
var currentWord = 0;

function openHighlightedText(text) {
  var words = text.split(/\s+/);
  var line = document.createElement('div');
  for(var i = 0; i < words.length; i++) {
    var word = document.createElement('span');
    word.className = 'word';
    word.innerHTML = words[i];
    if (i % 3 == 0 && i != 0) {
      line.className = 'line';
      document.getElementById('text').appendChild(line);
      line = document.createElement('div');
    }
    line.appendChild(word);
    wordElements.push(word);
  }
  document.getElementById('text').appendChild(line);
  var utterance = new SpeechSynthesisUtterance(text);
  utterance.onboundary = highlightWord;
  if (voices.length > 0) {
    console.log('hello');
    utterance.voice = voices.filter(function(voice) {return voice.name == 'Karen'})[0];
  }
  speechSynthesis.speak(utterance);
}

function highlightWord() {
  if (currentWord != 0) {
    wordElements[currentWord - 1].className = 'word';
  }
  wordElements[currentWord].className = 'highlighted word';
  wordElements[currentWord].scrollIntoView(true);
  currentWord++;
}

speechSynthesis.onvoiceschanged = function() {
  voices = speechSynthesis.getVoices().filter(isLocalEnglish);
}

function isLocalEnglish(element, index, array) {
  return element.localService && element.lang.indexOf('en') > -1;
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
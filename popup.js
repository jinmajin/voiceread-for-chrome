var voices = [];
var wordElements = [];
var currentWord = 0;

function openHighlightedText(text) {
  if (text) {
    var words = text.split(/\s+/);
    for(var i = 0; i < words.length; i++) {
      var word = document.createElement('span');
      word.className = 'word';
      word.innerHTML = words[i];
      document.getElementById('text').appendChild(word);
      wordElements.push(word);
    }
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 2.0;
    utterance.onboundary = highlightWord;
    if (voices.length > 0) {
      utterance.voice = voices.filter(function(voice) {return voice.name == 'Karen'})[0];
    }
    speechSynthesis.speak(utterance);
    var currentPosition = 0;
    var interval = setInterval(function(){
      currentPosition += .075 + (wordElements[currentWord].offsetTop - currentPosition)*.0025*utterance.rate;        
      window.scroll(0, currentPosition);
    }, 10);
  }
}

function highlightWord() {
  if (currentWord != 0) {
    wordElements[currentWord - 1].className = 'word';
  }
  wordElements[currentWord].className = 'highlighted word';
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
          openHighlightedText
        );
    });
});
var height = $(window).height();
var fontColor = '#DDD';
var backgroundColor = '#222';
var highlightColor = 'blue';

$('body').prepend('<div id="voiceread"><div id="text"></div></div>');
$('<style>').prop('type', 'text/css').html(' \
body { \
  position: relative; \
} \
#voiceread { \
  background-color: rgba(0,0,0,.4); \
  color: ' + fontColor + '; \
  font-family: "Avenir Next", "Segoe UI", "Lucida Grande", Tahoma, sans-serif; \
  font-size: 50px; \
  letter-spacing: 3px; \
  left: 0px; \
  position: fixed; \
  text-align: center; \
  top: 0px; \
  width: 100%; \
  z-index: 40000000; \
} \
#text { \
  background-color: ' + backgroundColor + '; \
  width: 600px; \
  max-height: ' + height + 'px; \
  line-height: 50px; \
  overflow-y: scroll; \
  margin: auto; \
} \
.highlighted { \
  background-color: ' + highlightColor + '; \
}').appendTo('head');

var voices = [];
var wordElements = [];
var currentWord = 0;

function openHighlightedText(text) {
  if (text) {
    var words = text.split(/\s+/);
    for(var i = 0; i < words.length; i++) {
      var word = $('<span />').attr('className', 'word').html(words[i]);
      $('#text').append(word);
      $('#text').append(' ');
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
      if (wordElements[currentWord]) {
        currentPosition += .075 + (wordElements[currentWord].offset().top)*.0025*utterance.rate;        
        $('#text')[0].scrollTop = currentPosition;
      } else {
        clearInterval(interval);
      }
    }, 10);
  }
}

function highlightWord() {
  if (currentWord != 0) {
    wordElements[currentWord - 1].removeClass('highlighted');
  }
  wordElements[currentWord].addClass('highlighted');
  currentWord++;
}

speechSynthesis.onvoiceschanged = function() {
  voices = speechSynthesis.getVoices().filter(isLocalEnglish);
}

function isLocalEnglish(element, index, array) {
  return element.localService && element.lang.indexOf('en') > -1;
}
$(document).keydown(function(e) {
  if (e.ctrlKey && (String.fromCharCode(e.which) === 'r' || String.fromCharCode(e.which) === 'R')) {
    var text = window.getSelection().toString();
    openHighlightedText(text);
  }
});

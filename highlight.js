var height = $(window).height();
var width = 600;

var backgroundColor = '#222';
var charSpace = 5;
var lineSpace = 10;

var font = "Avenir Next";
var fontSize = 50;
var fontColor = '#DDD';
var highlightColor = 'blue';

var triggerKey = 'r';
var speechRate = 300; // in wpm
speechRate = 200/speechRate; // in ratio

var opacity = .7;

$('body').prepend('<div id="voiceread"><div id="text"></div></div>');
$('<style>').prop('type', 'text/css').html(' \
#voiceread { \
  background-color: rgba(0,0,0,' + opacity + '); \
  color: ' + fontColor + '; \
  display: none; \
  font-family: "' + font + '", "Segoe UI", "Lucida Grande", Tahoma, sans-serif; \
  font-size: ' + fontSize + 'px; \
  letter-spacing: ' + charSpace + 'px; \
  left: 0px; \
  position: fixed; \
  text-align: left; \
  top: 0px; \
  width: 100%; \
  z-index: 40000000; \
} \
#text { \
  background-color: ' + backgroundColor + '; \
  width: ' + width + 'px; \
  height: ' + height + 'px; \
  line-height: ' + (fontSize + lineSpace) + 'px; \
  overflow-y: hidden; \
  margin: auto; \
} \
.highlighted { \
  background-color: ' + highlightColor + '; \
}').appendTo('head');

$('#voiceread').click(function() {
  $('#voiceread').hide();
  $('#text').empty();
  wordElements = [];
  currentWord = 0;
  utterance && utterance.cancel();
});

$('#text').click(function(e) {
  return false;
});

var voices = [];
var wordElements = [];
var currentWord = 0;
var utterance = null;

function openHighlightedText(text) {
  if (text) {
    $('#text').empty();
    var words = text.split(/\s+/);
    for(var i = 0; i < words.length; i++) {
      var word = $('<span />').attr('className', 'word').html(words[i]);
      $('#text').append(word);
      $('#text').append(' ');
      wordElements.push(word);
    }
    utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.onboundary = highlightWord;
    if (voices.length > 0) {
      utterance.voice = voices.filter(function(voice) {return voice.name == 'Karen'})[0];
    }
    $('#voiceread').show();
    speechSynthesis.speak(utterance);
    var currentPosition = 0;
    var interval = setInterval(function(){
      if (wordElements[currentWord]) {
        currentPosition += .075 + (wordElements[currentWord][0].offsetTop - currentPosition)*.0025*speechRate;        
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
  if (e.ctrlKey && (String.fromCharCode(e.which) === triggerKey || String.fromCharCode(e.which) === triggerKey.toUpperCase())) {
    var text = window.getSelection().toString();
    openHighlightedText(text);
  }
});

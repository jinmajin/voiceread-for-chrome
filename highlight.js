var height = $(window).height();
var width = 600;

var backgroundColor = '#222';
var charSpace = 5;
var lineSpace = 10;

var font = "Avenir Next";
var fontSize = 50;
var fontColor = '#DDD';
var highlightColor = 'blue';

var triggerKey = 'u';
var speechRate = 300; // in wpm
speechRate = speechRate/200; // in ratio

var opacity = .7;

$('body').prepend('<div id="voiceread"><div id="text"></div><div id="controls" class="pause"></div></div>');
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
} \
#controls { \
  position: absolute; \
  bottom: 10px; \
  left: 20px; \
} \
.play { \
  width: 0; \
  height: 0; \
  border-top: 50px solid transparent; \
  border-bottom: 50px solid transparent; \
  border-left: 75px solid white; \
} \
.pause { \
  width: 50px; \
  height: 50px; \
  border-left: 20px solid white; \
  border-right: 20px solid white; \
}').appendTo('head');

$('#voiceread').click(function() {
  $('#voiceread').hide();
  $('#text').empty();
  wordElements = [];
  currentWord = 0;
  playing = true;
  speechSynthesis.cancel();
});

$('#text').click(function(e) {
  return false;
});

var voices = [];
var wordElements = [];
var currentWord = 0;
var utterance = null;
var playing = false;

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
  if ((String.fromCharCode(e.which) === triggerKey || String.fromCharCode(e.which) === triggerKey.toUpperCase())) {
    var text = window.getSelection().toString();
    openHighlightedText(text);
  }
});

$('#controls').click(function(e) {
    togglePlaying();
    return false;
});

function togglePlaying(){
  if (playing){
    speechSynthesis.pause();
    $('#controls').removeClass('play');
    $('#controls').addClass('pause');
    playing = false;
  }else{
    speechSynthesis.resume();
    $('#controls').addClass('play');
    $('#controls').removeClass('pause');
    playing = true;
  }
};

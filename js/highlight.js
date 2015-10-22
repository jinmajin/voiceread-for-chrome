var height = window.innerHeight;
var width = 600;

var backgroundColor = '#222';
var charSpace = 5;
var lineSpace = 10;

var font = "Avenir Next";
var fontSize = 50;
var fontColor = '#DDD';
var highlightColor = 'blue';

var triggerKey = 'r';
var settingsKey = 's';
var speechRate = 500; // in wpm
speechRate = speechRate/200; // in ratio

var opacity = 1;
var currentPosition = 0;

var isVoiceReadActive = false;
var isSettingsViewActive = false;

chrome.storage.sync.get([
  'pageWidth',
  'charSpacing',
  'highlightColor',
  'lineSpacing',
  'fontSize',
  'fontColor',
  'backgroundColor',    
  'highlightColor', 
  'speechRate'
], function(settings) {
  if (Object.keys(settings).length > 0) {
    width = 500 + parseInt(settings.pageWidth);
    charSpace = settings.charSpacing;
    lineSpace = settings.lineSpacing;
    fontSize = settings.fontSize;
    fontColor = settings.fontColor;
    backgroundColor = settings.backgroundColor;
    highlightColor = settings.highlightColor;
    speechRate = settings.speechRate/200;
  } 
  $('body').prepend('<div id="container"><div id="voiceread"><div id="voiceread_text"></div><div id="controls" class="pause"></div></div><div id="settings"> \
    <h2>Visual Settings</h2> \
    <form> \
      Width: \
      <input id="page_width" type="number" name="width_points" min="0" max="100" step="10" value="40"><br> \
      Character Spacing: \
      <input id="char_spacing" type="number" name="char_spacing_points" min="0" max="10" step="1" value="5"><br> \
      Line Spacing: \
      <input id="line_spacing" type="number" name="line_spacing_points" min="0" max="50" step="1" value="10"><br> \
      Font Size: \
      <input id="font_size" type="number" name="font_size_points" min="0" max="100" step="1" value="50"><br> \
      Font Color: \
      <input id="font_color" type="color" name="font_color_value" value="#DDDDDD"><br> \
      Background Color: \
      <input id="background_color" type="color" name="background_color_value" value="#222222"><br> \
      Highlight Color: \
      <input id="highlight_color" type="color" name="highlight_color_value" value="#0000FF"><br> \
    </form> \
    <h2>Audio Settings</h2> \
    <form> \
      Speech Rate: \
      <input id="speech_rate" type="range" name="speech_rate_points" min="100" max="600" value="500"> \
      <span id="speech_rate_value">500wpm</span> \
    </form> \
    <div id="status"></div> \
    <button id="save">Save</button> \
  </div></div>');
  $('<style>').prop('type', 'text/css').html(' \
    #container { \
      overflow: hidden; \
      display: none; \
    } \
    #settings { \
      position: absolute; \
      right: -20%; \
      width: 20%; \
      height: 100%; \
      background-color: white; \
      opacity: 0; \
      z-index: 1000001; \
    } \
    #voiceread { \
      background-color: rgba(0,0,0,' + opacity + '); \
      color: ' + fontColor + '; \
      font-family: "' + font + '", "Segoe UI", "Lucida Grande", Tahoma, sans-serif; \
      font-size: ' + fontSize + 'px; \
      letter-spacing: ' + charSpace + 'px; \
      left: 0px; \
      position: absolute; \
      text-align: left; \
      top: 0px; \
      width: 100%; \
      height: 100%; \
      z-index: 1000000; \
    } \
    #voiceread_text { \
      background-color: ' + backgroundColor + '; \
      width: ' + width + 'px; \
      height: ' + height + 'px; \
      line-height: ' + (parseInt(fontSize) + parseInt(lineSpace)) + 'px; \
      overflow-y: scroll; \
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
      width: 85px; \
      height: 85px; \
      border-left: 30px solid white; \
      border-right: 30px solid white; \
      box-sizing: border-box; \
  }').appendTo('head');

  $('#voiceread').click(function() {
    isVoiceReadActive = false;
    $('#container').hide();
    if (isSettingsViewActive) {
      toggleSettingsView();
    } 
    $('#voiceread_text').empty();
    wordElements = [];
    currentWord = 0;
    previousWord = 0;
    currentPosition = 0;
    playing = true;
    clearInterval(interval);
    $('#controls').removeClass('play');
    $('#controls').addClass('pause');
    speechSynthesis.cancel();
  });

  $( window ).unload(function() {
    speechSynthesis.cancel();
  });

  $('#voiceread_text').click(function(e) {
    return false;
  });

  var voices = [];
  var wordElements = [];
  var currentWord = 0;
  var previousWord = 0;
  var utterance = null;
  var playing = true;
  var words = [];
  var interval;

  function rewind(evt) {
    var index = ($(evt.target).attr('word'));
    speechSynthesis.cancel();
    currentWord = parseInt(index);
    highlightWord();
    utterance = new SpeechSynthesisUtterance(words.slice(index, words.length).join(" "));
    utterance.rate = speechRate;
    utterance.onboundary = incrementWord;
    if (voices.length > 0) {
      utterance.voice = voices.filter(function(voice) {return voice.name == 'Karen'})[0];
    }
    currentPosition = $('#voiceread_text')[0].scrollTop;
    speechSynthesis.speak(utterance);
    if (!playing) {
      togglePlaying();
    }
  }

  function openHighlightedText(text) {
    if (text) {
      $('#voiceread_text').empty();
      words = text.split(/\s+/);
      for(var i = 0; i < words.length; i++) {
        var word = $('<span />').attr('word', i).html(words[i]);
        $('#voiceread_text').append(word);
        $('#voiceread_text').append(' ');
        wordElements.push(word);
        word.on('click', rewind);
      }
      utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.onboundary = incrementWord;
      if (voices.length > 0) {
        utterance.voice = voices.filter(function(voice) {return voice.name == 'Karen'})[0];
      }
      $('#container').show();
      isVoiceReadActive = true;
      speechSynthesis.speak(utterance);
      interval = setInterval(function(){
        if (!playing) {
          return;
        }
        if (currentWord < wordElements.length - 1) {
          currentPosition += (.075 + (wordElements[currentWord][0].offsetTop + $(wordElements[currentWord]).height() - currentPosition)*.0025*speechRate)*(fontSize/50) + .0075*(lineSpace/10 + (600-width));    
          $('#voiceread_text')[0].scrollTop = currentPosition;
        }
      }, 10);
    }
  }

  function highlightWord() {
    wordElements[previousWord].removeClass('highlighted');
    wordElements[currentWord].addClass('highlighted');
  }

  function incrementWord() {
    highlightWord();
    previousWord = currentWord;
    currentWord++;
  }

  speechSynthesis.onvoiceschanged = function() {
    voices = speechSynthesis.getVoices().filter(isLocalEnglish);
  }

  function isLocalEnglish(element, index, array) {
    return element.localService && element.lang.indexOf('en') > -1;
  }

  $(document).keydown(function(e) {
    if (String.fromCharCode(e.which) === triggerKey || String.fromCharCode(e.which) === triggerKey.toUpperCase()) {
      var text = window.getSelection().toString();
      openHighlightedText(text);
    } 
    if ((String.fromCharCode(e.which) === settingsKey || String.fromCharCode(e.which) === settingsKey.toUpperCase()) && isVoiceReadActive) {
      toggleSettingsView();
    }
  });

  $('#voiceread').bind('mousewheel', function(event) {
    if (event.originalEvent.wheelDelta >= 0 && playing) {
      togglePlaying();
    }
  });

  $('#controls').click(function(e) {
      togglePlaying();
      return false;
  });

  function toggleSettingsView() {
    if (isSettingsViewActive) {
      $( "#settings" ).animate({
        right: "-20%",
        opacity: 0
      }, 600 );
      isSettingsViewActive = false;
    } else {
      $( "#settings" ).animate({
        right: "0",
        opacity: 1
      }, 600 );  
      isSettingsViewActive = true;   
    }
  }

  function togglePlaying(){
    if (playing){
      speechSynthesis.pause();
      $('#controls').removeClass('pause');
      $('#controls').addClass('play');
      playing = false;
    } else{
      speechSynthesis.resume();
      $('#controls').removeClass('play');
      $('#controls').addClass('pause');
      playing = true;
    }
  };

});

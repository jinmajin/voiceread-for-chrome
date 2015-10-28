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
    width = 300 + parseInt(settings.pageWidth)*3;
    charSpace = settings.charSpacing;
    lineSpace = settings.lineSpacing;
    fontSize = settings.fontSize;
    fontColor = settings.fontColor;
    backgroundColor = settings.backgroundColor;
    highlightColor = settings.highlightColor;
    speechRate = settings.speechRate/200;
  } 

  $('body').prepend('<div id="voiceread_container"><div id="voiceread"><div id="voiceread_text"></div><div id="voiceread_controls" class="pause"></div></div><div id="voiceread_settings"> \
    <h2>Visual Settings</h2> \
    <form> \
      Width: \
      <input id="page_width" type="number" name="width_points" min="0" max="100" step="10" value="' + ((width - 300)/3) + '"><br> \
      Character Spacing: \
      <input id="char_spacing" type="number" name="char_spacing_points" min="0" max="10" step="1" value="' + charSpace + '"><br> \
      Line Spacing: \
      <input id="line_spacing" type="number" name="line_spacing_points" min="0" max="50" step="1" value="' + lineSpace + '"><br> \
      Font Size: \
      <input id="font_size" type="number" name="font_size_points" min="0" max="100" step="1" value="' + fontSize + '"><br> \
      Font Color: \
      <input id="font_color" type="color" name="font_color_value" value="' + fontColor + '"><br> \
      Background Color: \
      <input id="background_color" type="color" name="background_color_value" value="' + backgroundColor + '"><br> \
      Highlight Color: \
      <input id="highlight_color" type="color" name="highlight_color_value" value="' + highlightColor + '"><br> \
    </form> \
    <h2>Audio Settings</h2> \
    <form> \
      Speech Rate: \
      <input id="speech_rate" type="range" name="speech_rate_points" min="100" max="600" value="' + (speechRate * 200) + '"> \
      <span id="speech_rate_value">500wpm</span> \
    </form> \
    <div id="status"></div> \
    <button id="cancel">Cancel</button> \
    <button id="save">Save</button> \
  </div></div>');
  $('<style>').prop('type', 'text/css').html(' \
    #voiceread_container { \
      position: fixed; \
      left: 0; \
      top: 0; \
      background-color: rgba(0,0,0,' + opacity + '); \
      width: 100%; \
      height: ' + height + 'px; \
      display: none; \
      z-index: 1000000; \
    } \
    #voiceread_settings { \
      position: absolute; \
      height: 100%; \
      white-space: nowrap; \
      right: 0; \
      width: 0px; \
      overflow: hidden; \
      background-color: white; \
      z-index: 1000001; \
    } \
    #voiceread { \
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
    #voiceread_controls { \
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
    $('#voiceread_container').hide();
    document.body.style.overflow = 'auto';
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
    $('#voiceread_controls').removeClass('play');
    $('#voiceread_controls').addClass('pause');
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
      $('#voiceread_container').show();
      isVoiceReadActive = true;
      document.body.style.overflow = 'hidden';
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

  $('#voiceread_controls').click(function(e) {
      togglePlaying();
      return false;
  });

  function toggleSettingsView() {
    if (isSettingsViewActive) {
      $( "#voiceread_settings" ).animate({
        width: "0px"
      }, 400 );
      isSettingsViewActive = false;
    } else {
      $( "#voiceread_settings" ).animate({
        width: "300px"
      }, 400 );  
      isSettingsViewActive = true;   
    }
  }

  function togglePlaying(){
    if (playing){
      speechSynthesis.pause();
      $('#voiceread_controls').removeClass('pause');
      $('#voiceread_controls').addClass('play');
      playing = false;
    } else{
      speechSynthesis.resume();
      $('#voiceread_controls').removeClass('play');
      $('#voiceread_controls').addClass('pause');
      playing = true;
    }
  };

  // Saves options to chrome.storage
  function save_options() {
    var page_width = $('#page_width').val();
    var char_spacing = $('#char_spacing').val();
    var line_spacing = $('#line_spacing').val();
    var font_size = $('#font_size').val();
    var font_color = $('#font_color').val();
    var background_color = $('#background_color').val();
    var highlight_color = $('#highlight_color').val();
    var speech_rate = $('#speech_rate').val();
    chrome.storage.sync.set({
      pageWidth: page_width,
      charSpacing: char_spacing,
      lineSpacing: line_spacing,
      fontSize: font_size,
      fontColor: font_color,
      backgroundColor: background_color,
      highlightColor: highlight_color,
      speechRate: speech_rate
    }, function() {
      // Update status to let user know options were saved.
      var status = $('#status');
      status.html('Options saved.');
      setTimeout(function() {
        status.html('');
      }, 750);
    });
  }
 
  function restore_options() {
    $('#page_width').val((width-300)/3);
    $('#char_spacing').val(charSpace);
    $('#line_spacing').val(lineSpace);
    $('#font_size').val(fontSize);
    $('#font_color').val(fontColor);
    $('#background_color').val(backgroundColor);
    $('#highlight_color').val(highlightColor);
    $('#speech_rate').val(speechRate * 200);
    $('#speech_rate_value').html($('#speech_rate').val() + 'wpm');
  }

  $('#save').click(save_options);
  $('#speech_rate').on('input', function() {
    $('#speech_rate_value').html($('#speech_rate').val() + 'wpm');
  });

  $('#cancel').click(restore_options);
});

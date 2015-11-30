var autoScroll = true;

var height = window.innerHeight;
var width = 600;

var backgroundColor = '#222222';
var charSpace = 5;
var lineSpace = 10;

var font = "Avenir Next";

var fontSize = 50;
var fontColor = '#DDDDDD';
var highlightColor = '#0000FF';

var triggerKey = 'r';
var settingsKey = 's';
var speechRate = 500; // in wpm
speechRate = speechRate/200; // in ratio
var oldSpeechRate = speechRate;
var voiceName = 'Karen';
var oldVoiceName = 'Karen';

var opacity = 90;

var isVoiceReadActive = false;
var isSettingsViewActive = false;
var isSpeechSettingsChanged = false;

var port = null;
port = chrome.runtime.connect({name: 'voiceread'});
port.onMessage.addListener(function(msg) {
  if (msg.voices) {
    // populate the voice options. 
    voices = msg.voices;
    var voiceNameSelection = document.getElementById('voice_name');
    voices.forEach(function(voice) {
      var option = document.createElement('option');
      option.value = voice.voiceName;
      option.innerHTML = voice.voiceName;
      if (voice.voiceName == voiceName) { option.selected = true; }
      voiceNameSelection.appendChild(option);
    });
  } else if (msg.fonts) {
    // populate thing with fonts
    var fontSelection = document.getElementById('font_type');
    msg.fonts.forEach(function(font_option) {
      var option = document.createElement('option');
      option.value = font_option.displayName;
      option.innerHTML = font_option.displayName;
      if (font_option.displayName == font) { option.selected = true; }
      fontSelection.appendChild(option);
    });
  } else if (msg.evt && msg.evt == 'boundary'){
    incrementWord();
  }
});

var voices = [];
var wordElements = [];
var currentWord = 0;
var previousWord = 0;
var utterance = {};
var playing = true;
var isUtteranceRestored = false;
var words = [];
var interval;

function highlightWord() {
  wordElements[previousWord].removeClass('highlighted');
  wordElements[currentWord].addClass('highlighted');
}

function incrementWord() {
  highlightWord();
  previousWord = currentWord;
  currentWord++;
}


chrome.storage.sync.get([
  'autoScroll',
  'pageWidth',
  'charSpacing',
  'highlightColor',
  'lineSpacing',
  'font',
  'fontSize',
  'fontColor',
  'backgroundColor',    
  'highlightColor', 
  'speechRate',
  'voiceName',
  'pageOpacity'
], function(settings) {
  if (Object.keys(settings).length > 0) {
    width = 300 + parseInt(settings.pageWidth)*3;
    charSpace = settings.charSpacing;
    lineSpace = settings.lineSpacing;
    font = settings.font;
    fontSize = settings.fontSize;
    fontColor = settings.fontColor;
    backgroundColor = settings.backgroundColor;
    highlightColor = settings.highlightColor;
    speechRate = settings.speechRate/200;
    oldSpeechRate = speechRate;
    voiceName = settings.voiceName;
    oldVoiceName = voiceName;
    autoScroll = settings.autoScroll;
    opacity = settings.pageOpacity;
  } 

  var head = 'head'
  if ($('head').length < 1) {
    head = 'body';
  }

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
      word-wrap: break-word; \
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
  }').prependTo(head);

  $('body').prepend('<div id="voiceread_container"><div id="voiceread"><div id="voiceread_text"></div><div id="voiceread_controls" class="pause"></div></div><div id="voiceread_settings"> \
    <h2>Visual Settings</h2> \
    <form> \
      Width: \
      <input id="page_width" type="range" name="width_points" min="0" max="100" step="10" value="' + ((width - 300)/3) + '"><br> \
      Character Spacing: \
      <input id="char_spacing" type="range" name="char_spacing_points" min="0" max="10" step="1" value="' + charSpace + '"><br> \
      Line Spacing: \
      <input id="line_spacing" type="range" name="line_spacing_points" min="0" max="50" step="1" value="' + lineSpace + '"><br> \
      <hr> \
      Font Type: \
      <select id="font_type" name="font_type" value="' + font +'""></select><br> \
      Font Size: \
      <input id="font_size" type="range" name="font_size_points" min="5" max="100" step="1" value="' + fontSize + '"><br> \
      Font Color: \
      <input id="font_color" type="color" name="font_color_value" value="' + fontColor + '"><br> \
      <hr> \
      Background Color: \
      <input id="background_color" type="color" name="background_color_value" value="' + backgroundColor + '"><br> \
      Highlight Color: \
      <input id="highlight_color" type="color" name="highlight_color_value" value="' + highlightColor + '"><br> \
      Opacity: \
      <input id="page_opacity" type="range" min="0" max="1" step=".1" value="' + opacity + '"><br> \
      <hr> \
      Auto Scroll: \
      <input id="auto_scroll" type="checkbox" name="auto_scroll_value" ' + (autoScroll ? 'checked' : '') + '><br> \
    </form> \
    <h2>Audio Settings</h2> \
    <form> \
      Voice: \
      <select id="voice_name" name="voice_name" value="' + voiceName +'""></select><br> \
      Speech Rate: \
      <input id="speech_rate" type="range" name="speech_rate_points" min="100" max="600" value="' + (speechRate * 200) + '"> \
      <span id="speech_rate_value">' + (speechRate * 200) + 'wpm</span> \
    </form> \
    <hr> \
    <div id="status"></div> \
    <button id="cancel">Cancel</button> \
    <button id="save">Save</button> \
  </div></div>');

  port.postMessage({type: 'request'});

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
    playing = true;
    clearInterval(interval);
    $('#voiceread_controls').removeClass('play');
    $('#voiceread_controls').addClass('pause');
    port.postMessage({type: "stop"});
  });

  $(window).unload(function() {
    port.postMessage({type: "stop"});
  });

  $('#voiceread_text').click(function(e) {
    return false;
  });

  function rewind(evt) {
    var index = ($(evt.target).attr('word'));
    port.postMessage({type: "stop"});
    currentWord = parseInt(index);
    highlightWord();
    port.postMessage({type: "speak", selected_text: words.slice(index, words.length).join(" "), speech_rate: speechRate, voice_name: voiceName});
    if (!playing) {
      togglePlaying();
    }
  }

  function rewindAfterSpeechRateChange() {
    port.postMessage({type: "stop"});
    highlightWord();
    port.postMessage({type: "speak", selected_text: words.slice(currentWord, words.length).join(" "), speech_rate: speechRate, voice_name: voiceName});
    if (!playing) {
      togglePlaying();
    }
  }

  function changeAndPlayVoice() {
    isSpeechSettingsChanged = true;
    port.postMessage({type: "stop"});
    port.postMessage({type: "speak", suppressBoundary: "true", selected_text: 'This is what the new voice will sound like.', speech_rate: speechRate, voice_name: voiceName});
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
      port.postMessage({type: 'speak', selected_text : text, speech_rate: speechRate, voice_name: voiceName});
      $('#voiceread_container').show();
      $('#voiceread_text')[0].scrollTop = 0;
      isVoiceReadActive = true;
      document.body.style.overflow = 'hidden';
      var residual = 0;
      interval = setInterval(function(){
        if (!playing) {
          return;
        }
        if (currentWord < wordElements.length - 1) {
          var bottom = wordElements[currentWord + 1][0].getBoundingClientRect().bottom;
          if (autoScroll) {
            var increment = (.075 + (bottom + parseInt(lineSpace))*.0025*speechRate)*(fontSize/50) + .0075*(lineSpace/10 + (600-width));
            if (increment > 1) {
              $('#voiceread_text')[0].scrollTop += increment;
            } else {
              residual += increment;
              if (residual > 1) {
                $('#voiceread_text')[0].scrollTop += residual;
                residual = 0;
              }
            }
          }
          bottom = wordElements[currentWord][0].getBoundingClientRect().bottom;
          if (bottom > height) {
            port.postMessage({type: "pause"});
            wordElements[currentWord-1][0].scrollIntoView(true);
            if (wordElements[currentWord-1][0].getBoundingClientRect().bottom < (parseInt(lineSpace) + parseInt(fontSize))) {
              $('#voiceread_text')[0].scrollTop -= parseInt(lineSpace) + parseInt(fontSize);
            }
            port.postMessage({type: "resume"});
          }
        }
      }, 10);
    }
  }

  $(document).keydown(function(e) {
    if (e.altKey && (String.fromCharCode(e.which) === triggerKey || String.fromCharCode(e.which) === triggerKey.toUpperCase())) {
      var text = window.getSelection().toString();
      openHighlightedText(text);
    } 
    if ((String.fromCharCode(e.which) === settingsKey || String.fromCharCode(e.which) === settingsKey.toUpperCase()) && isVoiceReadActive) {
      if (playing) {
        togglePlaying();
      }
      toggleSettingsView();
    }
    if (e.which == 32 && isVoiceReadActive) {
      togglePlaying();
      return false;
    }

    if (e.which == 190 && isVoiceReadActive) {
      var isSpeedIncreased = increaseSpeed();
      if (isSpeedIncreased) {
        setTimeout(function() { 
          rewindAfterSpeechRateChange(); 
        }, 500);
      }
    }

    if (e.which == 188 && isVoiceReadActive) {
      var isSpeedDecreased = decreaseSpeed();
      if (isSpeedDecreased) {
        setTimeout(function() { 
          rewindAfterSpeechRateChange(); 
        }, 500);
      }
    }

  });

  function increaseSpeed() {
    var new_speech_rate = speechRate + 0.05;
    if (new_speech_rate <= 3) {
      speechRate = new_speech_rate;
      $('#speech_rate').val(speechRate * 200);
      $('#speech_rate_value').html($('#speech_rate').val() + 'wpm');
      return true;
    } else {
      return false;
    }
  }

  function decreaseSpeed() {
    var new_speech_rate = speechRate - 0.05;
    if (new_speech_rate >= 0.5) {
      speechRate = new_speech_rate;
      $('#speech_rate').val(speechRate * 200);
      $('#speech_rate_value').html($('#speech_rate').val() + 'wpm');
      return true;
    } else {
      return false;
    }
  }

  $('#voiceread_text').bind('mousewheel', function(event) {
    if (event.originalEvent.wheelDelta >= 0 && playing) {
      togglePlaying();
    }
  });

  $('#voiceread_controls').click(function(e) {
      togglePlaying();
      return false;
  });

  var saved;
  function toggleSettingsView() {
    if (isSettingsViewActive) {
      $( "#voiceread_settings" ).animate({
        width: "0px"
      }, 400 );
      if (!saved) {
        restore_options();
      }
      isSettingsViewActive = false;
    } else {
      saved = false;
      $( "#voiceread_settings" ).animate({
        width: "300px"
      }, 400 );  
      isSettingsViewActive = true;   
    }
  }

  function togglePlaying(){
    if (playing) {
      makeSettingsEditable();
      port.postMessage({type: 'pause'});
      $('#voiceread_controls').removeClass('pause');
      $('#voiceread_controls').addClass('play');
      playing = false;
    } else {
      makeSettingsUneditable();
      if (isUtteranceRestored) {
        wordElements[previousWord].removeClass('highlighted');
        wordElements[previousWord].css('background-color', '');
        port.postMessage(utterance);
        $('#voiceread_controls').removeClass('play');
        $('#voiceread_controls').addClass('pause');
        isUtteranceRestored = false;
        playing = true;        
      } else {
        if (isSpeechSettingsChanged) {
          restoreUtterance();
          wordElements[previousWord].removeClass('highlighted');
          wordElements[previousWord].css('background-color', '');
          port.postMessage(utterance);
          $('#voiceread_controls').removeClass('play');
          $('#voiceread_controls').addClass('pause');
          isUtteranceRestored = false;
          playing = true; 
        } else {
          port.postMessage({type: 'resume'});
          $('#voiceread_controls').removeClass('play');
          $('#voiceread_controls').addClass('pause');
          playing = true;
        }
      }
    }
  };

  // Saves options to chrome.storage
  function save_options() {
    saved = true;
    var new_opacity = $('#page_opacity').val();
    opacity = new_opacity;
    var auto_scroll = $('#auto_scroll').is(':checked');
    autoScroll = auto_scroll;
    var page_width = $('#page_width').val();
    width = 300 + 3*page_width;
    var char_spacing = $('#char_spacing').val();
    charSpace = char_spacing;
    var line_spacing = $('#line_spacing').val();
    lineSpace = line_spacing;
    var font_type = $('#font_type').val();
    font = font_type;
    var font_size = $('#font_size').val();
    fontSize = font_size;
    var font_color = $('#font_color').val();
    fontColor = font_color;
    var background_color = $('#background_color').val();
    backgroundColor = background_color;
    var highlight_color = $('#highlight_color').val();
    highlightColor = highlight_color;
    var speech_rate = $('#speech_rate').val();
    speechRate = speech_rate/200;
    var voice_name = $('#voice_name').val();
    voiceName = voice_name;
    restoreUtterance();
    chrome.storage.sync.set({
      pageOpacity: new_opacity,
      autoScroll: auto_scroll,
      pageWidth: page_width,
      charSpacing: char_spacing,
      lineSpacing: line_spacing,
      font: font_type,
      fontSize: font_size,
      fontColor: font_color,
      backgroundColor: background_color,
      highlightColor: highlight_color,
      speechRate: speech_rate,
      voiceName: voice_name,
    }, function() {
      // Update status to let user know options were saved.
      var status = $('#status');
      status.html('Options saved.');
      var font_options = document.getElementById("font_type").options;
      for (var option in font_options) {
        option.selected = (option.value == font_type);
      }
      setTimeout(function() {
        status.html('');
      }, 750);
    });
  }
 
  function restore_options() {
    $('#auto_scroll').prop('checked', autoScroll);

    $('#page_width').val((width-300)/3);
    $('#voiceread_text').css( "width", width + "px" );

    $('#char_spacing').val(charSpace);
    $('#voiceread').css( "letter-spacing", charSpace + "px" );

    $('#line_spacing').val(lineSpace);
    var oldLineSpace = parseInt(fontSize) + parseInt(lineSpace);
    $('#voiceread_text').css( "line-height", oldLineSpace + "px" );

    $('#font_type').val(font);
    $('#voiceread').css( "font-family", font );

    $('#font_size').val(fontSize);
    $('#voiceread').css( "font-size", fontSize + "px" );

    $('#font_color').val(fontColor);
    $('#voiceread').css( "color", fontColor );

    $('#background_color').val(backgroundColor);
    $('#voiceread_text').css( "background-color", backgroundColor );

    $('#highlight_color').val(highlightColor);
    $('.highlighted').css( "background-color", highlightColor );

    $('#page_opacity').val(opacity);
    $('#voiceread_container').css( "background-color", "rgba(0,0,0," + opacity + ")" );

    $('#speech_rate').val(oldSpeechRate * 200);
    speechRate = oldSpeechRate;
    $('#speech_rate_value').html($('#speech_rate').val() + 'wpm');

    $('#voice_name').val(oldVoiceName);
    voiceName = oldVoiceName;

    restoreUtterance();
  }

  function restoreUtterance() {
    isUtteranceRestored = true;
    isSpeechSettingsChanged = false;
    port.postMessage({type: "stop"});
    utterance = {type: "speak", selected_text: words.slice(currentWord, words.length).join(" "), speech_rate: speechRate, voice_name: voiceName};
  }

  function makeSettingsEditable() {
    $('#auto_scroll').prop("disabled", false);
    $('#page_width').prop("readonly", false);
    $('#char_spacing').prop("readonly", false);
    $('#line_spacing').prop("readonly", false);
    $('#font_type').prop("disabled", false);
    $('#font_size').prop("readonly", false);
    $('#font_color').prop("disabled", false);
    $('#background_color').prop("disabled", false);
    $('#highlight_color').prop("disabled", false);
    $('#page_opacity').prop("readonly", false);
    $('#speech_rate').prop("readonly", false);
    $('#voice_name').prop("disabled", false);
  }

  function makeSettingsUneditable() {
    $('#auto_scroll').prop("disabled", "disabled");
    $('#page_width').prop("readonly", true);
    $('#char_spacing').prop("readonly", true);
    $('#line_spacing').prop("readonly", true);
    $('#font_type').prop("disabled", "disabled");
    $('#font_size').prop("readonly", true);
    $('#font_color').prop("disabled", "disabled")
    $('#background_color').prop("disabled", "disabled");
    $('#highlight_color').prop("disabled", "disabled");
    $('#page_opacity').prop("readonly", true);
    $('#speech_rate').prop("readonly", true);
    $('#voice_name').prop("disabled", "disabled");
  }

  $('#save').click(save_options);
  $('#cancel').click(restore_options);

  // Settings Listeners
  $('#page_width').change(function() {
    var new_width = 300 + parseInt($(this).val())*3;
    $('#voiceread_text').css( "width", new_width + "px" );
  });
  $('#char_spacing').change(function() {
    var new_char_spacing = parseInt($(this).val());
    $('#voiceread').css( "letter-spacing", new_char_spacing + "px" );
  });
  $('#line_spacing').change(function() {
    var new_line_spacing = parseInt($('#font_size').val()) + parseInt($(this).val());
    $('#voiceread_text').css( "line-height", new_line_spacing + "px" );
  });
  $('#font_type').change(function(){
    var new_font_type = $(this).val();
    $('#voiceread').css("font-family", new_font_type);
  });
  $('#font_size').change(function() {
    var new_font_size = parseInt($(this).val());
    $('#voiceread').css( "font-size", new_font_size + "px" );
    var new_line_spacing = parseInt($('#line_spacing').val()) + parseInt($(this).val());
    $('#voiceread_text').css( "line-height", new_line_spacing + "px" );
  });
  $('#font_color').change(function() {
    var new_font_color = $(this).val();
    $('#voiceread').css( "color", new_font_color );
  });
  $('#background_color').change(function() {
    var new_bg_color = $(this).val();
    $('#voiceread_text').css( "background-color", new_bg_color );
  });
  $('#highlight_color').change(function() {
    var new_highlight_color = $(this).val();
    $('.highlighted').css( "background-color", new_highlight_color );
  });
  $('#page_opacity').change(function() {
    $('#voiceread_container').css( "background-color", "rgba(0,0,0," + $(this).val() + ")" );
  });
  $('#speech_rate').on('input', function() {
    var new_speech_rate = $('#speech_rate').val();
    $('#speech_rate_value').html(new_speech_rate + 'wpm');
    speechRate = new_speech_rate/200;
    changeAndPlayVoice();
  });
  $('#voice_name').change(function() {
    var new_voice_name = $('#voice_name').val();
    voiceName = new_voice_name;
    changeAndPlayVoice();
  })
});

var lastCharIndex = null;

// checks voice is english and has word boundaries
function isValidVoice(voice) {
  return (voice.lang.indexOf('en') > -1 && voice.eventTypes.indexOf('word') > -1);
}

chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == "voiceread");
  chrome.tts.getVoices( function(voice_list) {
    port.postMessage({voices: voice_list.filter(isValidVoice)});      
  });
  chrome.fontSettings.getFontList( function(font_list) {
    port.postMessage({fonts: font_list});      
  });
  port.onMessage.addListener(function(msg) {
  	if (msg.type == "speak"){
    	chrome.tts.speak(msg.selected_text,
    		{
          voiceName: msg.voice_name, // 'native', 
          rate: msg.speech_rate,
          requiredEventTypes: ['word'],
    			onEvent: function(event){
    				if (!msg.suppressBoundary && event.charIndex != lastCharIndex && event.type == 'word'){
    					port.postMessage({evt: 'boundary'});
              lastCharIndex = event.charIndex;
            }
    			}
    		}
    	);
  	} else if (msg.type == "resume"){
  		chrome.tts.resume();
  	} else if (msg.type == "pause"){
  		chrome.tts.pause();
  	} else if (msg.type == "stop"){
  		chrome.tts.stop();
  	}
   });
});

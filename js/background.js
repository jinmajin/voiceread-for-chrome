var lastCharIndex = null;

chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == "voiceread");
  chrome.tts.getVoices(function(voice_array){
    port.postMessage({voices: voice_array});
  });
  port.onMessage.addListener(function(msg) {
  	if (msg.type == "speak"){
    	chrome.tts.speak(msg.selected_text,
    		{
          voiceName: 'native', 
    			onEvent: function(event){
            port.postMessage(event);
    				if (/*event.charIndex != lastCharIndex && (*/event.type == 'word') /*|| event.type == 'sentence') */{
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

window.addEventListener("message", handleMessage);


//const playButton = document.getElementById('boton');
//playButton.addEventListener("click", sendMessageWindow);

function handleMessage(e) {
  var data = JSON.parse(e.data);
  switch (data.action) {
    case "SomeActionJS1":
      console.log("javascript Message Received from origin: "+ e.origin + " data: " + e.data);
      sendMessageWindow();
      break;
    case "SomeActionJS2":
      console.log("javascript Message Received from origin: "+ e.origin + " data: " + e.data);
      sendMessageWindow();
      break;  
    default:
      // ignoring other messages
  }
}

// sends a message to the flutter app in the element
function sendMessageWindow() {
  const message = '{"action":"EnableFlutterGestures"}';
  // Should target the domain instead of '*'
  window.postMessage(message, '*');
  console.log("Se envio a Flutter");
}

function sendMessageWindowIFrame() {
  const message = '{"action":"SomeActionFlutter2"}';
  var flutterIFrame = document.getElementById('FLUTTER-IFRAME');
  // Should target the domain instead of '*'
  flutterIFrame.contentWindow.postMessage(message, '*');
}

window.sendMessageWindow = sendMessageWindow;



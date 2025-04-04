/**
 * Generate Placeholder Audio Files
 * 
 * This script generates placeholder audio files for use in development.
 * It uses Tone.js for audio synthesis.
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { exec } = require('child_process');

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Generate a simple HTML file that will use Tone.js to generate audio
const generateHtml = (filename, frequency, duration, type = 'sine') => {
  return `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
</head>
<body>
  <script>
    // Function to generate and download audio
    async function generateAudio() {
      // Create an audio context
      const actx = new AudioContext();
      
      // Create an oscillator
      const osc = actx.createOscillator();
      osc.type = '${type}';
      osc.frequency.value = ${frequency}; 
      
      // Create a gain node to control volume and fade in/out
      const gainNode = actx.createGain();
      gainNode.gain.value = 0.5;
      
      // Add fade in and fade out to avoid clicks
      gainNode.gain.setValueAtTime(0, actx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, actx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.3, actx.currentTime + ${duration} - 0.2);
      gainNode.gain.linearRampToValueAtTime(0, actx.currentTime + ${duration});
      
      // Connect nodes
      osc.connect(gainNode);
      gainNode.connect(actx.destination);
      
      // Start recording
      const mediaStreamDest = actx.createMediaStreamDestination();
      gainNode.connect(mediaStreamDest);
      const mediaRecorder = new MediaRecorder(mediaStreamDest.stream);
      
      const chunks = [];
      mediaRecorder.ondataavailable = (evt) => {
        chunks.push(evt.data);
      };
      
      mediaRecorder.onstop = (evt) => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        const url = URL.createObjectURL(blob);
        
        // Download the audio file
        const a = document.createElement('a');
        a.href = url;
        a.download = '${filename}';
        a.click();
        
        document.body.innerHTML = 'Audio generated!';
      };
      
      // Start recording and oscillator
      mediaRecorder.start();
      osc.start();
      
      // Stop after the duration
      setTimeout(() => {
        osc.stop();
        mediaRecorder.stop();
      }, ${duration} * 1000);
    }
    
    // Run the generator when the page loads
    window.onload = generateAudio;
  </script>
</body>
</html>
  `;
};

// Function to generate audio using headless Chrome
const generateAudio = (name, frequency, duration, type = 'sine') => {
  console.log(`Generating ${name}...`);
  const filename = `${name}.ogg`;
  const htmlPath = path.join(audioDir, `${name}.html`);
  
  // Write the HTML file
  fs.writeFileSync(htmlPath, generateHtml(filename, frequency, duration, type));
  
  // Use a command to tell the user how to generate the audio files
  console.log(`To generate the audio file "${filename}", please open the file "${htmlPath}" in a browser and save the downloaded file to ${audioDir}`);
};

// Generate placeholder audio files
generateAudio('meditation-alpha', 432, 30, 'sine'); // Alpha waves at 432 Hz
generateAudio('alpha-focus', 396, 30, 'sine');      // Alpha waves at 396 Hz
generateAudio('theta-waves', 417, 30, 'sine');      // Theta waves at 417 Hz
generateAudio('delta-waves', 528, 30, 'sine');      // Delta waves at 528 Hz

console.log('\nAudio placeholders prepared! Open the HTML files in a browser to generate and download the audio files.');
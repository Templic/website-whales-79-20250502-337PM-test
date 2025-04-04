// This script generates test audio files for our demo
const fs = require('fs');
const { exec } = require('child_process');

// Check if SoX is installed
exec('sox --version', (error) => {
  if (error) {
    console.error('SoX is not installed. Please install it first:');
    console.error('  On Ubuntu/Debian: sudo apt-get install sox libsox-fmt-all');
    console.error('  On macOS with Homebrew: brew install sox');
    console.error('  On Windows: download from https://sourceforge.net/projects/sox/');
    process.exit(1);
  }
  
  // Generate audio files
  generateAudioFiles();
});

function generateAudioFiles() {
  const audioDir = './public/audio';
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  
  // Generate meditation alpha waves (8-13 Hz)
  exec(`sox -n ${audioDir}/meditation-alpha.mp3 synth 30 pinknoise band 8 13 reverb`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating meditation-alpha.mp3: ${stderr}`);
      return;
    }
    console.log('Generated meditation-alpha.mp3');
  });
  
  // Generate delta waves (0.5-4 Hz)
  exec(`sox -n ${audioDir}/delta-waves.mp3 synth 30 pinknoise band 0.5 4 reverb`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating delta-waves.mp3: ${stderr}`);
      return;
    }
    console.log('Generated delta-waves.mp3');
  });
  
  // Generate theta waves (4-8 Hz)
  exec(`sox -n ${audioDir}/theta-waves.mp3 synth 30 pinknoise band 4 8 reverb`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating theta-waves.mp3: ${stderr}`);
      return;
    }
    console.log('Generated theta-waves.mp3');
  });
  
  // Generate alpha focus (10-12 Hz)
  exec(`sox -n ${audioDir}/alpha-focus.mp3 synth 30 pinknoise band 10 12 reverb`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating alpha-focus.mp3: ${stderr}`);
      return;
    }
    console.log('Generated alpha-focus.mp3');
  });
  
  // Generate a simple test tone
  exec(`sox -n ${audioDir}/test-tone.mp3 synth 3 sine 440`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating test-tone.mp3: ${stderr}`);
      return;
    }
    console.log('Generated test-tone.mp3');
  });
}
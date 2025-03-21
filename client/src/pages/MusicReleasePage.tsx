
import { useEffect, useState, useRef } from "react";
import axios from "axios";

interface Track {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  createdAt: string;
}

export default function NewMusicPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    document.title = "New Music - Dale Loves Whales";
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await axios.get('/api/tracks');
      setTracks(response.data);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  const setupAudioContext = () => {
    if (!audioRef.current || audioContext) return;
    
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyserNode = ctx.createAnalyser();
    
    source.connect(analyserNode);
    analyserNode.connect(ctx.destination);
    analyserNode.fftSize = 256;
    
    setAudioContext(ctx);
    setAnalyser(analyserNode);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const visualize = () => {
    if (!analyser || !canvasRef.current || !audioRef.current?.played) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      if (audioRef.current?.paused) return;

      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let x = 0;

      dataArray.forEach((value) => {
        const barHeight = value * 1.5;
        ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      });
    };

    draw();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setupAudioContext();
      visualize();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(formatTime(audio.currentTime));
    };

    const handleLoadedMetadata = () => {
      setDuration(formatTime(audio.duration));
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [analyser]);

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/2">
          <img 
            src="/uploads/album cover for feels so good song.png"
            alt="Album Cover - Feels So Good"
            className="w-full rounded-lg shadow-xl"
          />
        </div>
        <div className="w-full md:w-1/2 space-y-6">
          <h1 className="text-4xl font-bold text-[#00ebd6]">FEELS SO GOOD</h1>
          <div className="space-y-4">
            <p className="text-xl">Release Date: March 14, 2025</p>
            <p className="text-xl">Genre: R&B, Soulful, Cosmic, Conscious</p>
            <p className="text-xl">Artist: Dale The Whale & Featuring AC3-2085</p>
            <div className="music-player mt-6 p-6 bg-[rgba(10,50,92,0.6)] rounded-lg shadow-lg backdrop-blur-sm">
              <h3 className="text-2xl font-semibold mb-4 text-[var(--fill-color)]">Listen Now</h3>
              <div className="space-y-4">
                <audio 
                  ref={audioRef}
                  controls 
                  className="w-full focus:outline-none"
                  style={{
                    height: '40px',
                    filter: 'invert(85%) hue-rotate(175deg) brightness(1.1)',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <source src="/uploads/feels-so-good.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <div className="text-center text-sm text-gray-300">
                  <span>{currentTime}</span> / <span>{duration}</span>
                </div>
                <canvas 
                  ref={canvasRef}
                  width={800}
                  height={200}
                  className="w-full bg-black rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

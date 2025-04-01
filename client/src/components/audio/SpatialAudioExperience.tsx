
import React, { useEffect, useRef } from 'react';

export const SpatialAudioExperience: React.FC<{ audioUrl: string }> = ({ audioUrl }) => {
  const audioContextRef = useRef<AudioContext>();
  const audioElementRef = useRef<HTMLAudioElement>();
  
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    audioElementRef.current = new Audio(audioUrl);
    
    const source = audioContextRef.current.createMediaElementSource(audioElementRef.current);
    const panner = audioContextRef.current.createPanner();
    
    source.connect(panner);
    panner.connect(audioContextRef.current.destination);
    
    return () => {
      audioContextRef.current?.close();
    };
  }, [audioUrl]);

  return (
    <div className="spatial-audio-container">
      <button onClick={() => audioElementRef.current?.play()}>
        Play Spatial Audio
      </button>
    </div>
  );
};

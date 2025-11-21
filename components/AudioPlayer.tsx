
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { decode, decodeAudioData } from '../utils/audio';
import { PlayIcon, PauseIcon, SpeakerWaveIcon } from './Icons';

interface AudioPlayerProps {
  base64Audio: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Audio }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopPlayback = useCallback(async () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
       await audioContextRef.current.close();
       audioContextRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await stopPlayback();
      return;
    }

    try {
      setIsPlaying(true);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        audioContext,
        24000,
        1,
      );

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        setIsPlaying(false);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
           audioContextRef.current.close();
           audioContextRef.current = null;
        }
        sourceRef.current = null;
      };
      source.start();
      sourceRef.current = source;
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    }
  }, [base64Audio, isPlaying, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [base64Audio, stopPlayback]);

  return (
    <div className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <SpeakerWaveIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
        <div className="flex-grow">
          <p className="text-slate-300 font-medium">Generated Speech</p>
        </div>
        <button
            onClick={handlePlayPause}
            className="p-3 bg-cyan-500 hover:bg-cyan-600 rounded-full text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed"
            disabled={!base64Audio}
        >
            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>
    </div>
  );
};

export default AudioPlayer;

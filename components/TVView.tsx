
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { LOGO_SVG } from '../constants';
import { QueueItem, Professional } from '../types';
import { User, MonitorOff, BellRing, Volume2, VolumeX, Volume1, PlayCircle, Loader2, RefreshCcw } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

interface TVViewProps {
  queue: QueueItem[];
  professionals: Professional[];
  establishmentName: string;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const bufferCopy = new ArrayBuffer(data.byteLength);
  new Uint8Array(bufferCopy).set(data);
  const dataInt16 = new Int16Array(bufferCopy);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const TVView: React.FC<TVViewProps> = ({ queue, professionals, establishmentName, onClose, theme = 'dark' }) => {
  const [now, setNow] = useState(Date.now());
  const [lastCalledId, setLastCalledId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const announcedIds = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartWithAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      setAudioEnabled(true);
      // Bip de teste inicial
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.1);
    } catch (e) {
      console.error("Erro ao iniciar áudio:", e);
    }
  };

  const announcePatient = async (name: string) => {
    try {
      if (!process.env.API_KEY || !audioContextRef.current) return;
      
      // FORÇA O RESUME EM CADA CHAMADA (Crítico para TVs Android)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      setIsAiProcessing(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const firstName = name.split(' ')[0];
      const prompt = `Fale de forma clara: ${firstName}, por favor, compareça ao atendimento.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find(p => p.inlineData)?.inlineData?.data;

      if (audioPart) {
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(audioPart), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
      }
    } catch (error) {
      console.error("Falha no TTS:", error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  useEffect(() => {
    if (!audioEnabled) return;
    const serving = queue.filter(i => i.status === 'serving').sort((a,b) => b.timestamp - a.timestamp);
    if (serving.length > 0) {
      const topServing = serving[0];
      if (!announcedIds.current.has(topServing.id)) {
        setLastCalledId(topServing.id);
        announcedIds.current.add(topServing.id);
        announcePatient(topServing.name);
        setTimeout(() => setLastCalledId(null), 15000);
      }
    }
  }, [queue, audioEnabled]);

  const isLight = theme === 'light';

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col p-6 overflow-hidden ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020408] text-white'}`}>
      
      {!audioEnabled && (
        <div className="absolute inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
           <div className="w-24 h-24 mb-6">{LOGO_SVG}</div>
           <h2 className="text-2xl font-black text-white uppercase mb-4">Ativar Som do Painel</h2>
           <button onClick={handleStartWithAudio} className="bg-teal-500 text-slate-950 px-10 py-5 rounded-3xl font-black uppercase flex items-center gap-3">
             <PlayCircle size={24} /> Iniciar Monitor
           </button>
        </div>
      )}

      <header className={`flex items-center justify-between mb-6 p-6 rounded-[32px] border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-white/10'}`}>
        <div className="flex items-center gap-6">
          <div className="w-12 h-12">{LOGO_SVG}</div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">{establishmentName}</h1>
            <div className="flex items-center gap-2">
              {isAiProcessing ? (
                <div className="text-teal-400 flex items-center gap-1 animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[10px] font-black uppercase">IA Chamando Cliente...</span>
                </div>
              ) : (
                <span className="text-[10px] font-black uppercase text-slate-500">Monitor em tempo real</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <button onClick={handleStartWithAudio} className="flex items-center gap-2 text-slate-500 hover:text-teal-400 transition-colors">
            <RefreshCcw size={16} /> <span className="text-[8px] font-black uppercase">Reativar Áudio</span>
          </button>
          <div className="text-4xl font-black font-mono px-6 py-2 bg-slate-950 rounded-2xl text-indigo-400 border border-white/5">
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800 text-slate-400 rounded-2xl"><MonitorOff size={24} /></button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {professionals.filter(p => p.status !== 'absent').map(pro => {
          const serving = queue.find(i => i.status === 'serving' && i.professionalId === pro.id);
          const isCalling = serving && serving.id === lastCalledId;

          return (
            <div key={pro.id} className={`flex flex-col border-2 rounded-[40px] p-6 transition-all duration-500 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/20 border-slate-800'} ${serving ? 'border-teal-500/40' : ''}`}>
              <span className="text-[9px] font-black text-slate-500 uppercase mb-4">{pro.name}</span>
              {serving ? (
                <div className={`flex-1 flex flex-col justify-center text-center p-4 rounded-3xl ${isCalling ? 'bg-yellow-400 text-slate-950 animate-pulse' : 'bg-indigo-600 text-white'}`}>
                   <h2 className="text-4xl font-black uppercase tracking-tighter">{serving.name.split(' ')[0]}</h2>
                   <p className="text-[10px] font-bold uppercase mt-2 opacity-70">{serving.service}</p>
                   {isCalling && <BellRing size={40} className="mx-auto mt-4 opacity-30" />}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-800/30 rounded-3xl">
                   <span className="text-[10px] font-black uppercase text-slate-600 opacity-20">Livre</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

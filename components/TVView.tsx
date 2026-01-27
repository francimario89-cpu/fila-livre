
import React, { useEffect, useState, useRef } from 'react';
import { LOGO_SVG } from '../constants';
import { QueueItem, Professional } from '../types';
import { User, MonitorOff, BellRing, Volume2, VolumeX, PlayCircle, Loader2, Mic2, Users, Zap } from 'lucide-react';
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
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const bufferCopy = new ArrayBuffer(data.byteLength);
  new Uint8Array(bufferCopy).set(data);
  const dataInt16 = new Int16Array(bufferCopy);
  const buffer = ctx.createBuffer(numChannels, dataInt16.length / numChannels, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
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
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.1);
    } catch (e) { console.error(e); }
  };

  const announceCall = async () => {
    try {
      if (!process.env.API_KEY || !audioContextRef.current) return;
      setIsAiProcessing(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = "Atenção! Próximo cliente, por favor, compareça ao atendimento.";
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const audioPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
      if (audioPart) {
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(audioPart), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (error) { console.error(error); } finally { setIsAiProcessing(false); }
  };

  useEffect(() => {
    if (!audioEnabled) return;
    const serving = queue.filter(i => i.status === 'serving').sort((a,b) => b.timestamp - a.timestamp);
    if (serving.length > 0) {
      const topServing = serving[0];
      if (!announcedIds.current.has(topServing.id)) {
        setLastCalledId(topServing.id);
        announcedIds.current.add(topServing.id);
        announceCall();
        setTimeout(() => setLastCalledId(null), 15000);
      }
    }
  }, [queue, audioEnabled]);

  const isLight = theme === 'light';
  const waitingList = queue.filter(i => i.status === 'waiting').slice(0, 8);

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col p-8 overflow-hidden transition-colors duration-500 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020408] text-white'}`}>
      
      {!audioEnabled && (
        <div className="absolute inset-0 z-[2000] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
           <div className="w-24 h-24 mb-6">{LOGO_SVG}</div>
           <h2 className="text-3xl font-black text-white uppercase font-orbitron mb-4">Ativar Som do Painel</h2>
           <button onClick={handleStartWithAudio} className="bg-teal-500 text-slate-950 px-12 py-6 rounded-[32px] font-black uppercase text-sm shadow-2xl flex items-center gap-4 active:scale-95 transition-all">
             <PlayCircle size={24} /> Iniciar Painel
           </button>
        </div>
      )}

      <header className={`flex items-center justify-between mb-8 p-6 rounded-[32px] border ${isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/60 border-white/10 shadow-2xl'}`}>
        <div className="flex items-center gap-6">
          <div className="w-14 h-14">{LOGO_SVG}</div>
          <div>
            <h1 className={`text-5xl font-black uppercase tracking-tighter font-orbitron ${isLight ? 'text-slate-900' : 'text-white neon-text'}`}>{establishmentName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className={`text-6xl font-black font-mono px-8 py-3 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-slate-950 border-white/5 text-indigo-400'}`}>
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={onClose} className="p-4 bg-slate-800/10 text-slate-400 rounded-2xl"><MonitorOff size={24} /></button>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* GRID DE FILAS INDIVIDUAIS */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar pr-2">
          {professionals.filter(p => p.status !== 'absent').map(pro => {
            const serving = queue.find(i => i.status === 'serving' && i.professionalId === pro.id);
            const isCalling = serving && serving.id === lastCalledId;

            return (
              <div key={pro.id} className={`flex flex-col border-2 rounded-[48px] p-8 transition-all duration-700 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/20 border-slate-800'} ${serving ? 'border-indigo-500/50' : 'border-slate-800'}`}>
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest">{pro.name}</h3>
                   {isCalling && <BellRing size={28} className="text-amber-500 animate-bounce" />}
                </div>

                {serving ? (
                  <div className={`flex-1 flex flex-col justify-center text-center p-8 rounded-[40px] transition-all duration-500 shadow-2xl ${isCalling ? 'bg-amber-400 text-slate-950 scale-105' : 'bg-indigo-600 text-white'}`}>
                     <p className={`text-[12px] font-black uppercase mb-4 tracking-widest ${isCalling ? 'text-slate-900/60' : 'text-indigo-200'}`}>SENDO ATENDIDO:</p>
                     <h2 className="text-6xl font-black uppercase tracking-tighter leading-none break-words">
                       {serving.name.split(' ')[0]}
                     </h2>
                     <div className="mt-6 flex items-center justify-center gap-2">
                        <Zap size={14} className="text-teal-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">Sendo atendido agora</span>
                     </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-slate-200/20 rounded-[40px] opacity-20">
                     <span className="text-2xl font-black uppercase tracking-[0.4em]">LIVRE</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* LISTA DE PRÓXIMOS (ESPERA GLOBAL) */}
        <div className={`w-96 rounded-[48px] p-10 border flex flex-col ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/40 border-white/5'}`}>
          <div className="flex items-center gap-4 mb-10">
            <Users className="text-teal-400" size={32} />
            <h2 className="text-2xl font-black uppercase tracking-tighter">Próximos</h2>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto scrollbar-none">
            {waitingList.length > 0 ? waitingList.map((item, idx) => (
              <div key={item.id} className={`p-6 rounded-[32px] border flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-teal-400">{idx + 1}º</span>
                  <div>
                    <p className="text-lg font-black uppercase truncate max-w-[150px]">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{item.service}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-600 uppercase">PROFISSIONAL</p>
                   <p className="text-[11px] font-black text-teal-500 uppercase">
                     {professionals.find(p => p.id === item.professionalId)?.name || 'QUALQUER'}
                   </p>
                </div>
              </div>
            )) : (
              <div className="h-full flex items-center justify-center opacity-20 italic text-sm uppercase font-black">Fila Vazia</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useEffect, useState, useRef } from 'react';
import { LOGO_SVG } from '../constants';
import { QueueItem, Professional } from '../types';
import { User, MonitorOff, BellRing, Volume2, VolumeX, PlayCircle, Loader2, Mic2, Users, Zap, AlertCircle, Clock } from 'lucide-react';
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
      
      const serving = queue.filter(i => i.status === 'serving').sort((a,b) => b.timestamp - a.timestamp);
      if (serving.length === 0) return;
      const topServing = serving[0];
      
      setIsAiProcessing(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Atenção! Próximo cliente com código ${topServing.code || topServing.name}, por favor, compareça ao seu guichê.`;
      
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

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col p-8 overflow-hidden transition-colors duration-500 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020408] text-white'}`}>
      
      {!audioEnabled && (
        <div className="absolute inset-0 z-[2000] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
           <div className="w-24 h-24 mb-6">{LOGO_SVG}</div>
           <h2 className="text-3xl font-black text-white uppercase font-orbitron mb-4">Painel de Voz Ativo</h2>
           <button onClick={handleStartWithAudio} className="bg-teal-500 text-slate-950 px-12 py-6 rounded-[32px] font-black uppercase text-sm shadow-2xl flex items-center gap-4 active:scale-95 transition-all">
             <PlayCircle size={24} /> Iniciar Voz IA
           </button>
        </div>
      )}

      <header className={`flex items-center justify-between mb-8 p-6 rounded-[32px] border ${isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900/60 border-white/10 shadow-2xl'}`}>
        <div className="flex items-center gap-6">
          <div className="w-14 h-14">{LOGO_SVG}</div>
          <div>
            <h1 className={`text-5xl font-black uppercase tracking-tighter font-orbitron ${isLight ? 'text-slate-900' : 'text-white neon-text'}`}>{establishmentName}</h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Siga a sua vez na coluna do seu profissional</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className={`text-6xl font-black font-mono px-8 py-3 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-white/5 text-indigo-400'}`}>
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={onClose} className={`p-4 rounded-2xl ${isLight ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-slate-800/10 text-slate-400 border border-white/5'}`}><MonitorOff size={24} /></button>
        </div>
      </header>

      {/* GRID DE FILAS INDIVIDUAIS NA TV */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-hidden">
        {professionals.filter(p => p.status !== 'absent').map(pro => {
          const proQueue = queue.filter(item => item.professionalId === pro.id || item.professionalId === 'any');
          const serving = proQueue.find(item => item.status === 'serving');
          const waiting = proQueue.filter(item => item.status === 'waiting').sort((a,b) => {
            if (a.isPriority && !b.isPriority) return -1;
            if (!a.isPriority && b.isPriority) return 1;
            return a.timestamp - b.timestamp;
          }).slice(0, 5); 

          const isCalling = serving && serving.id === lastCalledId;

          return (
            <div key={pro.id} className={`flex flex-col border-3 rounded-[36px] overflow-hidden transition-all duration-700 shadow-2xl ${isLight ? 'bg-white border-slate-300 shadow-indigo-100/40' : 'bg-slate-900/90 border-slate-700'}`}>
              
              {/* Título do Profissional */}
              <div className={`p-6 border-b text-center ${isLight ? 'bg-slate-100 border-slate-200 text-slate-950 font-black' : 'bg-slate-950/80 border-slate-700 text-white font-black'}`}>
                 <h3 className={`text-2xl font-black uppercase tracking-widest ${isLight ? 'text-indigo-950' : 'text-teal-400'}`}>{pro.name}</h3>
              </div>

              <div className="p-6 flex-1 flex flex-col space-y-8">
                
                {/* ATENDIMENTO AGORA */}
                <div className="space-y-4">
                   <p className={`text-[11px] font-black uppercase tracking-widest text-center ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Atendendo agora:</p>
                   {serving ? (
                    <div className={`flex flex-col justify-center text-center p-8 rounded-[32px] transition-all duration-500 shadow-2xl relative overflow-hidden ${isCalling ? 'bg-amber-400 text-slate-950 scale-[1.05] ring-4 ring-amber-300' : serving.isPriority ? 'bg-red-600 text-white ring-4 ring-red-400' : 'bg-indigo-600 text-white ring-4 ring-indigo-400'}`}>
                       {serving.isPriority && (
                          <div className="absolute top-4 left-0 w-full flex justify-center">
                             <span className="bg-white text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg">Prioritário</span>
                          </div>
                       )}
                       <h2 className="text-5xl font-black uppercase tracking-tighter leading-none break-words">
                         {serving.code || serving.name.split(' ')[0]}
                       </h2>
                       <p className={`text-[12px] font-black uppercase mt-3 ${isCalling ? 'text-slate-900' : 'text-white/90'}`}>{serving.service}</p>
                       {isCalling && <BellRing size={28} className="mx-auto mt-4 animate-bounce text-slate-950" />}
                    </div>
                  ) : (
                    <div className={`p-10 border-4 border-dashed rounded-[32px] text-center ${isLight ? 'border-slate-300 text-slate-400 bg-slate-50' : 'border-slate-800 text-slate-700 bg-slate-950/50'}`}>
                       <p className="text-2xl font-black uppercase tracking-[0.3em]">LIVRE</p>
                    </div>
                  )}
                </div>

                {/* EM ESPERA */}
                <div className="flex-1 flex flex-col space-y-4">
                   <p className={`text-[11px] font-black uppercase tracking-widest text-center ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Próximos da Vez:</p>
                   <div className="flex-1 space-y-4">
                      {waiting.map((item, idx) => (
                        <div key={item.id} className={`p-6 rounded-[28px] border-3 flex items-center justify-between shadow-md transition-all ${item.isPriority ? 'border-red-500 bg-red-500/10' : isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-700'}`}>
                           <div className="flex items-center gap-4">
                              <span className={`text-2xl font-black ${item.isPriority ? 'text-red-500' : isLight ? 'text-teal-600' : 'text-teal-400'}`}>
                                {item.isPriority ? '!' : `${idx + 1}º`}
                              </span>
                              <p className={`text-2xl font-black uppercase truncate max-w-[150px] ${item.isPriority ? 'text-red-500' : isLight ? 'text-slate-900' : 'text-white'}`}>
                                {item.code || item.name.split(' ')[0]}
                              </p>
                           </div>
                           {item.isPriority && <AlertCircle size={24} className="text-red-500 fill-red-500/10" />}
                        </div>
                      ))}
                      {waiting.length === 0 && !serving && (
                        <div className="h-full flex items-center justify-center opacity-30 flex-col gap-2 py-8">
                           <Clock size={48} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
                           <span className="text-[11px] font-black uppercase tracking-widest">Sem fila</span>
                        </div>
                      )}
                   </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-8 flex items-center justify-center gap-10 p-4 opacity-50">
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/20" />
            <span className="text-[10px] font-black uppercase tracking-widest">Prioritário</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/20" />
            <span className="text-[10px] font-black uppercase tracking-widest">Normal</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-teal-500 animate-pulse shadow-lg shadow-teal-500/20" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado</span>
         </div>
      </footer>
    </div>
  );
};

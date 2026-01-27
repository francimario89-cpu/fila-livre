
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { LOGO_SVG } from '../constants';
import { QueueItem, Professional } from '../types';
import { User, MonitorOff, BellRing, Volume2, VolumeX, Volume1 } from 'lucide-react';
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
  const dataInt16 = new Int16Array(data.buffer);
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
  const announcedIds = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  const activePros = professionals.filter(p => p.status !== 'absent');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Inicializa ou retoma o contexto de áudio
  const initAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    setAudioEnabled(true);
    
    // Teste de som silencioso para garantir ativação
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    gain.gain.value = 0.001;
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.start();
    osc.stop(audioContextRef.current.currentTime + 0.1);
  };

  const announcePatient = async (name: string) => {
    try {
      if (!process.env.API_KEY) return;
      
      // Tenta retomar se estiver suspenso
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const firstName = name.split(' ')[0];
      const prompt = `Diga com voz calma, clara e feminina: Atenção, ${firstName}, por favor, dirija-se ao atendimento.`;

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

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (!audioContextRef.current) audioContextRef.current = ctx;

        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        
        gainNode.gain.value = 1.0; // Volume total
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start();
      }
    } catch (error) {
      console.error("Erro no TTS Gemini:", error);
    }
  };

  useEffect(() => {
    // Monitora quem está em atendimento ("serving")
    const serving = queue.filter(i => i.status === 'serving').sort((a,b) => b.timestamp - a.timestamp);
    if (serving.length > 0) {
      const topServing = serving[0];
      
      if (!announcedIds.current.has(topServing.id)) {
        setLastCalledId(topServing.id);
        announcedIds.current.add(topServing.id);
        
        // Chamada de voz
        if (audioEnabled) {
          announcePatient(topServing.name);
        }
        
        // Limpa destaque visual após 15 segundos
        setTimeout(() => setLastCalledId(null), 15000);
      }
    }
  }, [queue, audioEnabled]);

  const isLight = theme === 'light';

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col p-6 animate-in fade-in duration-1000 overflow-hidden font-inter transition-colors duration-500 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020408] text-white'}`}>
      
      {/* ALERTA DE SOM DESATIVADO - CRÍTICO PARA NAVEGADORES */}
      {!audioEnabled && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] animate-bounce">
          <button 
            onClick={initAudio}
            className="flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-full shadow-2xl font-black uppercase text-sm tracking-widest ring-4 ring-red-600/20"
          >
            <VolumeX size={24} /> Ativar Som da TV
          </button>
        </div>
      )}

      {/* HEADER TV */}
      <header className={`flex items-center justify-between mb-6 p-6 rounded-[32px] border backdrop-blur-xl shadow-2xl transition-colors ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-white/10'}`}>
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 shadow-lg rounded-2xl p-2 ${isLight ? 'bg-slate-100 shadow-slate-200' : 'bg-slate-950 shadow-teal-500/20'}`}>
            {LOGO_SVG}
          </div>
          <div>
            <h1 className={`text-4xl font-black font-orbitron tracking-tighter uppercase leading-none ${isLight ? 'text-slate-900' : 'neon-text text-white'}`}>
              {establishmentName}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isLight ? 'text-slate-500' : 'text-teal-400'}`}>Monitor de Chamadas</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${audioEnabled ? 'bg-teal-500/10 border-teal-500/30 text-teal-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
            {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{audioEnabled ? 'Áudio Ativo' : 'Áudio Mudo'}</span>
          </div>

          <div className={`text-5xl font-black font-mono tracking-tighter px-8 py-3 rounded-2xl border shadow-inner ${isLight ? 'bg-slate-100 border-slate-200 text-indigo-600' : 'bg-slate-950 border-white/10 text-indigo-400'}`}>
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <button onClick={onClose} className={`p-4 rounded-2xl transition-colors ${isLight ? 'bg-slate-200 text-slate-400 hover:text-red-600' : 'bg-slate-800 text-slate-600 hover:text-red-500'}`}>
            <MonitorOff size={24} />
          </button>
        </div>
      </header>

      {/* GRADE DE CHAMADAS */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden pb-4">
        {activePros.map(pro => {
          const serving = queue.find(i => i.status === 'serving' && i.professionalId === pro.id);
          const waiting = queue.filter(i => i.status === 'waiting' && (i.professionalId === pro.id || (i.professionalId === 'any' && !serving))).slice(0, 5);
          const isBusy = !!serving;
          const isLastCalled = serving && serving.id === lastCalledId;

          return (
            <div key={pro.id} className={`flex flex-col h-full border-2 rounded-[40px] overflow-hidden transition-all duration-700 ${isLight ? 'bg-white' : 'bg-slate-900/20'} ${isBusy ? 'border-teal-500/30' : 'border-slate-800'}`}>
               
               <div className={`p-4 flex items-center justify-between ${isBusy ? (isLight ? 'bg-teal-50/50' : 'bg-teal-500/10') : (isLight ? 'bg-slate-50' : 'bg-slate-800/30')}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isBusy ? 'bg-teal-500 text-slate-950' : (isLight ? 'bg-slate-200 text-slate-400' : 'bg-slate-800 text-slate-500')}`}>
                      <User size={18} />
                    </div>
                    <h3 className={`font-black text-sm uppercase tracking-tight truncate max-w-[150px] ${isLight ? 'text-slate-800' : 'text-white'}`}>{pro.name}</h3>
                  </div>
               </div>

               <div className="p-4 flex-1 flex flex-col gap-4">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">EM ATENDIMENTO:</span>
                    {isLastCalled && <Volume1 size={20} className="text-yellow-500 animate-ping" />}
                 </div>
                 
                 {serving ? (
                   <div className={`p-6 rounded-[32px] shadow-2xl relative overflow-hidden transition-all duration-500 flex flex-col justify-center min-h-[180px] ${
                     isLastCalled 
                     ? 'bg-yellow-400 text-slate-950 animate-pulse scale-[1.02] ring-8 ring-yellow-400/20' 
                     : 'bg-indigo-600 text-white'
                   }`}>
                      <div className="relative z-10 space-y-2">
                        <h4 className="text-5xl font-black uppercase tracking-tighter leading-none break-words">
                          {serving.name.split(' ')[0]}
                          {serving.name.split(' ')[1] && <span className="block text-2xl opacity-70 mt-1">{serving.name.split(' ')[1]}</span>}
                        </h4>
                        <div className={`h-[3px] w-16 mt-4 ${isLastCalled ? 'bg-slate-950/20' : 'bg-white/20'}`} />
                        <p className={`text-xs font-black uppercase tracking-[0.2em] pt-2 ${isLastCalled ? 'text-slate-900/60' : 'text-indigo-200'}`}>
                          {serving.service}
                        </p>
                      </div>
                      {isLastCalled && (
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                           <BellRing size={140} />
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className={`flex-1 flex flex-col items-center justify-center border-4 border-dashed rounded-[32px] min-h-[180px] ${isLight ? 'border-slate-200 text-slate-300' : 'border-slate-800/20 text-slate-800'}`}>
                      <span className="text-[12px] font-black uppercase tracking-[0.4em] opacity-20">LIVRE</span>
                   </div>
                 )}

                 <div className="space-y-2 mt-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">PRÓXIMOS:</span>
                    {waiting.map((item, idx) => (
                      <div key={item.id} className={`p-4 rounded-2xl flex items-center justify-between border animate-in slide-in-from-bottom-2 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-900/60 border-white/5'}`}>
                        <div className="flex items-center gap-3">
                           <span className={`text-xs font-black font-orbitron ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>{idx + 1}º</span>
                           <span className={`text-sm font-bold uppercase truncate max-w-[120px] ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{item.name}</span>
                        </div>
                        <span className={`text-[8px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter border ${isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-950 border-white/5 text-slate-500'}`}>{item.service.slice(0, 10)}</span>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          );
        })}
      </div>

      <footer className={`mt-4 pt-4 border-t flex justify-between items-center ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
           <p className={`text-xs font-black uppercase tracking-[0.5em] font-orbitron ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>FILA LIVRE <span className="text-teal-500">SMART SYSTEM</span></p>
        </div>
        <div className={`flex items-center gap-4 px-6 py-2 rounded-full border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/50 border-white/5'}`}>
           <p className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Monitoramento de Chamadas por IA</p>
        </div>
      </footer>
    </div>
  );
};

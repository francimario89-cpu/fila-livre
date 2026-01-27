
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { LOGO_SVG } from '../constants';
import { QueueItem, Professional } from '../types';
import { User, Timer, QrCode, MonitorOff, BellRing, ChevronRight, Zap, Clock, TrendingUp, Volume2 } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

interface TVViewProps {
  queue: QueueItem[];
  professionals: Professional[];
  establishmentName: string;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

// Função de decodificação de áudio PCM conforme as diretrizes
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
  const announcedIds = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  const activePros = professionals.filter(p => p.status !== 'absent');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const announcePatient = async (name: string) => {
    try {
      if (!process.env.API_KEY) return;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const firstName = name.split(' ')[0];
      const prompt = `Diga com voz calma e profissional: Atenção, ${firstName}, por favor, dirija-se ao atendimento.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore é uma voz feminina clara
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (error) {
      console.error("Erro no TTS Gemini:", error);
    }
  };

  useEffect(() => {
    const serving = queue.filter(i => i.status === 'serving').sort((a,b) => b.timestamp - a.timestamp);
    if (serving.length > 0) {
      const topServing = serving[0];
      
      // Se este ID ainda não foi anunciado sonoramente
      if (!announcedIds.current.has(topServing.id)) {
        setLastCalledId(topServing.id);
        announcedIds.current.add(topServing.id);
        announcePatient(topServing.name);
        
        // Limpa o destaque visual após 15 segundos
        setTimeout(() => setLastCalledId(null), 15000);
      }
    }
  }, [queue]);

  const averageWaitTime = useMemo(() => {
    const waitingCount = queue.filter(i => i.status === 'waiting').length;
    if (waitingCount === 0) return 0;
    const proCount = activePros.length || 1;
    return Math.round((waitingCount * 15) / proCount);
  }, [queue, activePros]);

  const isLight = theme === 'light';

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col p-6 animate-in fade-in duration-1000 overflow-hidden font-inter transition-colors duration-500 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020408] text-white'}`}>
      
      {/* HEADER TV - ADAPTADO AO TEMA */}
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
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isLight ? 'text-slate-500' : 'text-teal-400'}`}>Painel de Chamadas em Tempo Real</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tempo Médio</span>
            <div className={`text-3xl font-black font-orbitron ${isLight ? 'text-indigo-600' : 'text-white'}`}>
              {averageWaitTime === 0 ? 'LIVRE' : `${averageWaitTime} MIN`}
            </div>
          </div>

          <div className={`text-5xl font-black font-mono tracking-tighter px-8 py-3 rounded-2xl border shadow-inner ${isLight ? 'bg-slate-100 border-slate-200 text-indigo-600' : 'bg-slate-950 border-white/10 text-indigo-400'}`}>
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <button onClick={onClose} className={`p-3 rounded-2xl transition-colors ${isLight ? 'bg-slate-200 text-slate-400 hover:text-red-600' : 'bg-slate-800 text-slate-600 hover:text-red-500'}`}>
            <MonitorOff size={24} />
          </button>
        </div>
      </header>

      {/* GRADE DE CHAMADAS - ADAPTADA AO TEMA */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden pb-4">
        {activePros.map(pro => {
          const serving = queue.find(i => i.status === 'serving' && i.professionalId === pro.id);
          const waiting = queue.filter(i => i.status === 'waiting' && (i.professionalId === pro.id || (i.professionalId === 'any' && !serving))).slice(0, 5);
          const isBusy = !!serving;
          const isLastCalled = serving && serving.id === lastCalledId;

          return (
            <div key={pro.id} className={`flex flex-col h-full border-2 rounded-[40px] overflow-hidden transition-all duration-700 ${isLight ? 'bg-white' : 'bg-slate-900/20'} ${isBusy ? 'border-teal-500/30' : 'border-slate-800'}`}>
               
               {/* Consultório / Sala */}
               <div className={`p-4 flex items-center justify-between ${isBusy ? (isLight ? 'bg-teal-50/50' : 'bg-teal-500/10') : (isLight ? 'bg-slate-50' : 'bg-slate-800/30')}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isBusy ? 'bg-teal-500 text-slate-950' : (isLight ? 'bg-slate-200 text-slate-400' : 'bg-slate-800 text-slate-500')}`}>
                      <User size={18} />
                    </div>
                    <h3 className={`font-black text-sm uppercase tracking-tight truncate max-w-[150px] ${isLight ? 'text-slate-800' : 'text-white'}`}>{pro.name}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-white/5'}`}>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sala Ativa</span>
                  </div>
               </div>

               {/* Paciente Atual - FONTE GIGANTE */}
               <div className="p-4 flex-1 flex flex-col gap-4">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">PACIENTE ATUAL:</span>
                    {isLastCalled && <Volume2 size={16} className="text-yellow-500 animate-bounce" />}
                 </div>
                 
                 {serving ? (
                   <div className={`p-6 rounded-[32px] shadow-2xl relative overflow-hidden transition-all duration-500 flex flex-col justify-center min-h-[160px] ${
                     isLastCalled 
                     ? 'bg-yellow-400 text-slate-950 animate-pulse scale-[1.02] ring-8 ring-yellow-400/20' 
                     : 'bg-indigo-600 text-white'
                   }`}>
                      <div className="relative z-10 space-y-2">
                        <h4 className="text-4xl font-black uppercase tracking-tighter leading-none break-words">
                          {serving.name.split(' ')[0]}
                          {serving.name.split(' ')[1] && <span className="block text-2xl opacity-80">{serving.name.split(' ')[1]}</span>}
                        </h4>
                        <div className={`h-[2px] w-12 ${isLastCalled ? 'bg-slate-950/20' : 'bg-white/20'}`} />
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLastCalled ? 'text-slate-900/60' : 'text-indigo-200'}`}>
                          {serving.service}
                        </p>
                      </div>
                      {isLastCalled && (
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                           <BellRing size={120} />
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className={`flex-1 flex flex-col items-center justify-center border-4 border-dashed rounded-[32px] min-h-[160px] ${isLight ? 'border-slate-200 text-slate-300' : 'border-slate-800/20 text-slate-800'}`}>
                      <span className="text-[12px] font-black uppercase tracking-[0.4em] opacity-20">AGUARDANDO</span>
                   </div>
                 )}

                 {/* Próximos da Lista */}
                 <div className="space-y-2 mt-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">EM ESPERA:</span>
                    {waiting.map((item, idx) => (
                      <div key={item.id} className={`p-4 rounded-2xl flex items-center justify-between border animate-in slide-in-from-bottom-2 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-900/60 border-white/5'}`}>
                        <div className="flex items-center gap-3">
                           <span className={`text-xs font-black font-orbitron ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>{idx + 1}º</span>
                           <span className={`text-sm font-bold uppercase truncate max-w-[120px] ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{item.name}</span>
                        </div>
                        <span className={`text-[8px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter border ${isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-950 border-white/5 text-slate-500'}`}>{item.service.slice(0, 10)}</span>
                      </div>
                    ))}
                    {waiting.length === 0 && !serving && (
                      <div className="py-8 text-center">
                         <p className="text-[9px] text-slate-800 font-black uppercase tracking-[0.3em]">SEM FILA</p>
                      </div>
                    )}
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
           <p className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total de {activePros.length} salas de atendimento operando agora</p>
        </div>
      </footer>
    </div>
  );
};

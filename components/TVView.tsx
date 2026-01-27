
import React, { useEffect, useState, useRef } from 'react';
import { LOGO_SVG } from '../constants';
import { QueueItem, Professional } from '../types';
import { User, MonitorOff, BellRing, Volume2, VolumeX, PlayCircle, Loader2, Mic2 } from 'lucide-react';
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
      // Feedback sonoro de ativação
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.1);
    } catch (e) { console.error("Erro ao ativar som:", e); }
  };

  const announceCall = async () => {
    try {
      if (!process.env.API_KEY || !audioContextRef.current) return;
      
      // GARANTE QUE O CONTEXTO ESTÁ ATIVO
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      setIsAiProcessing(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Mensagem curta e clara para TVs
      const prompt = "Atenção! Próximo cliente, por favor, compareça ao atendimento.";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { voiceName: 'Kore' } 
            } 
          },
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
    } catch (error) {
      console.error("Falha na voz:", error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // LÓGICA DE MONITORAMENTO: QUEM ENTRA EM 'SERVING' É CHAMADO
  useEffect(() => {
    if (!audioEnabled) return;
    
    const serving = queue.filter(i => i.status === 'serving').sort((a,b) => b.timestamp - a.timestamp);
    if (serving.length > 0) {
      const topServing = serving[0];
      // Se ainda não anunciamos este ID nesta sessão
      if (!announcedIds.current.has(topServing.id)) {
        setLastCalledId(topServing.id);
        announcedIds.current.add(topServing.id);
        announceCall(); 
        // Remove o destaque após 15 segundos
        setTimeout(() => setLastCalledId(null), 15000);
      }
    }
  }, [queue, audioEnabled]);

  const isLight = theme === 'light';

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col p-6 overflow-hidden transition-colors duration-500 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020408] text-white'}`}>
      
      {!audioEnabled && (
        <div className="absolute inset-0 z-[2000] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
           <div className="w-24 h-24 mb-6">{LOGO_SVG}</div>
           <h2 className="text-3xl font-black text-white uppercase font-orbitron mb-4">Painel de TV Ativo</h2>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10 max-w-xs leading-relaxed">
             Para ouvir a voz de chamada automática, clique no botão abaixo para ativar o sistema de áudio.
           </p>
           <button onClick={handleStartWithAudio} className="bg-teal-500 text-slate-950 px-12 py-6 rounded-[32px] font-black uppercase text-sm shadow-2xl flex items-center gap-4 transition-all active:scale-95 hover:bg-teal-400">
             <PlayCircle size={24} /> Ativar Som e Iniciar
           </button>
        </div>
      )}

      <header className={`flex items-center justify-between mb-8 p-6 rounded-[32px] border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-2xl'}`}>
        <div className="flex items-center gap-6">
          <div className="w-14 h-14">{LOGO_SVG}</div>
          <div>
            <h1 className={`text-4xl font-black uppercase tracking-tighter font-orbitron ${isLight ? 'text-slate-900' : 'text-white neon-text'}`}>{establishmentName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {isAiProcessing ? (
                <div className="text-teal-500 flex items-center gap-2 animate-pulse">
                  <Mic2 size={12} /><span className="text-[10px] font-black uppercase tracking-widest">IA Gerando Chamada...</span>
                </div>
              ) : (
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Monitor de Fila Digital</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className={`px-6 py-3 rounded-2xl border font-black text-[10px] uppercase flex items-center gap-3 ${audioEnabled ? 'text-teal-500 border-teal-500/20' : 'text-red-500 border-red-500/20'}`}>
            {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />} {audioEnabled ? 'Som Ativado' : 'Som Mudo'}
          </div>
          <div className={`text-5xl font-black font-mono px-8 py-3 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-slate-950 border-white/5 text-indigo-400'}`}>
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={onClose} className="p-4 bg-slate-800/10 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-colors"><MonitorOff size={24} /></button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 overflow-y-auto custom-scrollbar">
        {professionals.filter(p => p.status !== 'absent').map(pro => {
          const serving = queue.find(i => i.status === 'serving' && i.professionalId === pro.id);
          const isCalling = serving && serving.id === lastCalledId;

          return (
            <div key={pro.id} className={`flex flex-col border-2 rounded-[48px] p-6 transition-all duration-700 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/20 border-slate-800'} ${serving ? 'border-teal-500/40' : ''}`}>
              <div className="flex items-center justify-between mb-4 px-2">
                 <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pro.name}</span>
                 </div>
                 {isCalling && <BellRing size={20} className="text-amber-500 animate-bounce" />}
              </div>

              {serving ? (
                <div className={`flex-1 flex flex-col justify-center text-center p-6 rounded-[36px] transition-all duration-500 shadow-xl ${isCalling ? 'bg-amber-400 text-slate-950 shadow-2xl scale-105' : 'bg-indigo-600 text-white'}`}>
                   <p className={`text-[10px] font-black uppercase mb-3 ${isCalling ? 'text-slate-900/60' : 'text-indigo-200'}`}>PACIENTE:</p>
                   <h2 className="text-5xl font-black uppercase tracking-tighter leading-none break-words">
                     {serving.name.split(' ')[0]}
                     {serving.name.split(' ')[1] && <span className="block text-2xl mt-2 opacity-80">{serving.name.split(' ')[1]}</span>}
                   </h2>
                   <div className={`h-1 w-12 mx-auto mt-6 rounded-full ${isCalling ? 'bg-slate-950/20' : 'bg-white/20'}`} />
                   <p className={`text-[11px] font-bold uppercase mt-5 ${isCalling ? 'text-slate-900/80' : 'text-indigo-100 opacity-70'}`}>{serving.service}</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-slate-200/50 rounded-[36px] opacity-20">
                   <span className="text-[12px] font-black uppercase tracking-[0.4em] mb-2">DISPONÍVEL</span>
                   <div className="w-8 h-1 bg-slate-400/50 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <footer className={`mt-auto pt-6 border-t flex justify-between items-center ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
         <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Fila Livre <span className="text-teal-500">Smart TV System</span></p>
         </div>
         <p className="text-[8px] font-black text-slate-400 uppercase">Sistema de Chamada por Voz Ativo</p>
      </footer>
    </div>
  );
};

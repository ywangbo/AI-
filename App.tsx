import React, { useState, useEffect, useRef } from 'react';
import { Scanlines } from './components/Scanlines';
import { TerminalInput } from './components/TerminalInput';
import { TypewriterText } from './components/TypewriterText';
import { startNewGame, sendPlayerAction, generatePixelArtScene } from './services/geminiService';
import { audioService } from './services/audioService';
import { ChatMessage, Sender } from './types';

// Constants for retro feels
const BOOT_SEQUENCE = [
  "BIOS 日期 01/01/1988 14:22:56 版本 2.0",
  "CPU检测: NEC V20, 频率: 8 MHz",
  "系统内核: 幻境OS (Phantom OS) v1.0",
  "加载音频驱动... 正常",
  "加载图形适配器... 正常",
  "连接至幻境终端... 成功"
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gameStatus, setGameStatus] = useState<'BOOT' | 'PLAYING'>('BOOT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [theme, setTheme] = useState<'green' | 'amber' | 'cyan'>('green');
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Theme styles map
  const themeStyles = {
    green: {
      text: 'text-green-400',
      border: 'border-green-800',
      bg: 'bg-green-900/10'
    },
    amber: {
      text: 'text-amber-400',
      border: 'border-amber-800',
      bg: 'bg-amber-900/10'
    },
    cyan: {
      text: 'text-cyan-400',
      border: 'border-cyan-800',
      bg: 'bg-cyan-900/10'
    }
  };

  const currentStyle = themeStyles[theme];

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, gameStatus]);

  // Boot Sequence Effect
  useEffect(() => {
    // Only start boot if user interacts (browser autoplay policy for audio)
    // We defer actual boot until first click, or just show text first.
    let delay = 0;
    const bootMsgs: ChatMessage[] = [];

    BOOT_SEQUENCE.forEach((line, i) => {
      delay += 600 + Math.random() * 300;
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `boot-${i}`,
          sender: Sender.SYSTEM,
          text: line
        }]);
        audioService.playBlip();
        
        if (i === BOOT_SEQUENCE.length - 1) {
          setTimeout(() => {
             // We wait for user interaction to start the "Real" game to enable audio context
          }, 1000);
        }
      }, delay);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartInteraction = async () => {
    if (gameStatus === 'PLAYING') return;
    
    // Initialize Audio Context on first gesture
    audioService.init();
    audioService.playBootSound();
    audioService.startBGM();

    setGameStatus('PLAYING');
    initGame();
  };

  const initGame = async () => {
    setIsProcessing(true);
    const initialText = await startNewGame();
    
    // Generate initial image
    generatePixelArtScene(initialText).then(img => {
      if (img) setSceneImage(img);
    });

    setMessages(prev => [...prev, {
      id: 'init-game',
      sender: Sender.AI,
      text: initialText,
      isTyping: true
    }]);
    setIsProcessing(false);
  };

  const handleCommand = async (cmd: string) => {
    if (cmd.toLowerCase().startsWith('/theme ')) {
      const t = cmd.split(' ')[1] as any;
      if (['green', 'amber', 'cyan'].includes(t)) setTheme(t);
      return;
    }
    if (cmd.toLowerCase() === '/cls') { setMessages([]); return; }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: Sender.USER,
      text: cmd
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMsgId,
      sender: Sender.AI,
      text: "",
      isTyping: true
    }]);

    try {
      const generator = sendPlayerAction(cmd);
      let fullText = "";
      
      for await (const chunk of generator) {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, text: fullText } : msg
        ));
      }

      // Generate new image based on the latest context
      if (fullText.length > 50) { // Only for substantial descriptions
        generatePixelArtScene(fullText).then(img => {
          if (img) setSceneImage(img);
        });
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: Sender.SYSTEM,
        text: "错误：链接丢失。"
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMute = () => {
    const muted = audioService.toggleMute();
    setIsMuted(muted);
  };

  // Render Start Screen
  if (gameStatus === 'BOOT') {
     return (
       <div 
         onClick={handleStartInteraction}
         className="w-screen h-screen bg-black flex flex-col items-center justify-center cursor-pointer font-pixel text-white"
       >
         <div className="text-4xl md:text-6xl text-center mb-8 text-yellow-400 animate-pulse tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
           幻境终端
         </div>
         <div className="w-full max-w-2xl p-6 border-4 border-white mb-8 bg-blue-900 shadow-[0_0_20px_rgba(30,58,138,0.6)]">
            {messages.map((m) => (
              <div key={m.id} className="text-green-400 font-mono mb-1">{m.text}</div>
            ))}
         </div>
         <div className="text-xl blink text-gray-400 animate-pulse">
           [ 点击屏幕 插入硬币 ]
         </div>
         <Scanlines />
       </div>
     );
  }

  return (
    <div className="w-screen h-screen bg-[#1a1a1a] flex items-center justify-center p-2 md:p-6">
      
      {/* Console Chasis */}
      <div className="w-full max-w-5xl h-full max-h-[90vh] bg-[#2a2a2a] rounded-xl p-4 shadow-2xl border-b-8 border-r-8 border-[#111] flex flex-col relative">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-4 px-2">
          <h1 className="text-xl md:text-2xl text-gray-300 font-pixel drop-shadow-md">
            <span className="text-red-500">幻境</span>终端
          </h1>
          <div className="flex gap-4">
             <button onClick={toggleMute} className="font-pixel text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded border-b-2 border-black active:border-b-0 active:translate-y-[2px]">
                {isMuted ? "开启音效" : "静音"}
             </button>
             <div className="flex gap-2">
                <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-red-500 animate-pulse' : 'bg-red-900'}`}></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
             </div>
          </div>
        </div>

        {/* Main Content Area - Split View */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
           
           {/* Visual Viewport (Left/Top) */}
           <div className={`
             md:w-1/3 min-h-[200px] md:min-h-0 
             border-4 border-white bg-black relative overflow-hidden
             pixel-border
           `}>
              <Scanlines />
              {sceneImage ? (
                <img src={sceneImage} alt="Scene" className="w-full h-full object-cover pixelated crt-flicker" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 font-pixel text-xs text-center p-4">
                   无视频信号输入<br/>视觉模块加载中...
                </div>
              )}
              {/* Overlay Stat Box */}
              <div className="absolute top-2 left-2 bg-blue-800/80 border-2 border-white p-2 text-white font-pixel text-[10px] md:text-xs">
                 HP: 100%<br/>
                 位置: 未知
              </div>
           </div>

           {/* Text Terminal (Right/Bottom) */}
           <div className={`
              flex-1 flex flex-col 
              border-4 border-white bg-black relative
              pixel-border
              ${currentStyle.bg}
           `}>
              <Scanlines />
              <div className={`flex-1 overflow-y-auto p-4 md:p-6 font-mono text-lg md:text-xl leading-relaxed ${currentStyle.text}`}>
                {messages.map((msg, index) => {
                   const isLastAI = index === messages.length - 1 && msg.sender === Sender.AI;
                   return (
                    <div key={msg.id} className="mb-4 break-words">
                      {msg.sender === Sender.USER && (
                        <div className="flex items-center text-white bg-gray-800/50 p-1 mb-1 font-pixel text-xs w-fit px-2 border border-gray-600">
                          玩家
                        </div>
                      )}
                      
                      <div className={msg.sender === Sender.USER ? "pl-2 opacity-90" : ""}>
                         {msg.sender === Sender.SYSTEM ? (
                            <span className="text-red-500 font-bold font-pixel text-sm">{msg.text}</span>
                         ) : (
                            <TypewriterText 
                              text={msg.text} 
                              isActive={isLastAI && isProcessing} 
                              speed={20} 
                              onCharTyped={() => audioService.playBlip()}
                            />
                         )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-4 bg-black border-t-2 border-white z-20">
                {gameStatus === 'PLAYING' && (
                  <TerminalInput 
                    onSubmit={handleCommand} 
                    disabled={isProcessing} 
                    themeColor={currentStyle.text}
                  />
                )}
              </div>
           </div>
        </div>

        {/* Footer Instructions */}
        <div className="mt-2 text-center text-gray-500 font-pixel text-[10px]">
           指令: /theme [green|amber|cyan] | /cls (清屏)
        </div>

      </div>
    </div>
  );
};

export default App;
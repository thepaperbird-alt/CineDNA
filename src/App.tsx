/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  User, 
  Skull, 
  Heart, 
  Shield, 
  Star, 
  HelpCircle, 
  Loader2,
  Terminal,
  Cpu,
  Tv,
  Film
} from 'lucide-react';
import { tree, hierarchy } from 'd3-hierarchy';
import { cn } from '@/lib/utils';
import { getCharacterTree, CharacterTreeData, CharacterNode, CharacterLink } from '@/services/gemini';

// --- Components ---

const PixelIcon = ({ type, className }: { type: CharacterNode['iconType'], className?: string }) => {
  switch (type) {
    case 'hero': return <span className={cn("text-2xl", className)}>⭐</span>;
    case 'villain': return <span className={cn("text-2xl", className)}>💀</span>;
    case 'sidekick': return <span className={cn("text-2xl", className)}>🛡️</span>;
    case 'mentor': return <span className={cn("text-2xl", className)}>🧙</span>;
    case 'love-interest': return <span className={cn("text-2xl", className)}>❤️</span>;
    default: return <span className={cn("text-2xl", className)}>👤</span>;
  }
};

const ScanlineEffect = () => (
  <>
    <div className="scanlines" />
    <div className="vignette" />
    <div className="scanline-anim" />
  </>
);

const PixelButton = ({ children, onClick, disabled, loading }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, loading?: boolean }) => (
  <button 
    onClick={onClick}
    disabled={disabled || loading}
    className="pixel-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : children}
  </button>
);

const LoadingOverlay = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[100] bg-monitor-bg flex flex-col items-center justify-center"
      >
        <div className="relative w-64 h-64 border-4 border-crt-green/20 flex flex-col items-center justify-center gap-4">
          <div className="absolute inset-0 overflow-hidden">
             <motion.div 
               className="w-full h-1 bg-crt-green shadow-[0_0_15px_rgba(51,255,51,1)]"
               animate={{ top: ['0%', '100%'] }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               style={{ position: 'absolute' }}
             />
          </div>
          <Loader2 className="w-12 h-12 animate-spin opacity-50" />
          <div className="text-[10px] animate-pulse">DECRYPTING_ORACLE...</div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CharacterTreeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['SYSTEM READY...', 'AWAITING INPUT...']);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-5), `> ${msg}`]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    setError(null);
    setData(null);
    addLog(`SEARCHING: ${title.toUpperCase()}...`);
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      setError('ERROR: MISSING API KEY. PLEASE CONFIGURE VITE_GEMINI_API_KEY IN VERCEL.');
      addLog('FATAL: AUTHENTICATION FAILED.');
      setLoading(false);
      return;
    }

    try {
      const result = await getCharacterTree(title, year);
      // Artificial delay for the retro feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      setData(result);
      addLog('DATA RETRIEVED.');
      addLog('CONSTRUCTING TREE...');
    } catch (err) {
      setError('FAILED TO RETRIEVE DATA.');
      addLog('ERROR: DATA CORRUPTED.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black overflow-hidden">
      <div className="crt-frame w-full h-full rounded-none border-0 p-0">
        <ScanlineEffect />
        <LoadingOverlay active={loading} />
        
        <div className="flex h-full w-full">
          {/* Left Panel: Input (Collapsible or smaller) */}
          <AnimatePresence>
            {!data && (
              <motion.div 
                initial={{ width: '320px', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="panel-left border-r-4 border-crt-green h-full flex flex-col p-10 bg-monitor-bg z-20"
              >
                <h1 className="text-xl mb-6 flex flex-col gap-1 border-b-2 border-crt-green pb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-6 h-6" />
                    CINE-DNA v1.0
                  </div>
                  <div className="text-[8px] opacity-60 tracking-[0.2em]">BY MAHESH RAVI</div>
                </h1>
                
                <form onSubmit={handleSearch} className="flex flex-col gap-6 flex-1">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider">Media Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="STAR WARS"
                      className="pixel-input"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider">Release Year</label>
                    <input 
                      type="text" 
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="1977"
                      className="pixel-input"
                    />
                  </div>

                  <div className="status-bar mt-4">
                    SYSTEM: {loading ? 'BUSY' : 'READY'}<br />
                    SECTOR: 0x4F2A<br />
                    BUFF: 1024KB<br />
                    SCAN: {data ? 'COMPLETE' : 'AWAITING'}
                  </div>

                  <PixelButton loading={loading}>
                    INITIATE TRACE
                  </PixelButton>
                </form>

                <div className="status-bar mt-auto">
                  &copy; 1984 OS-TECH SYSTEMS<br />
                  REDUNDANCY: ACTIVE
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right Panel: Tree Display (Full Screen when data exists) */}
          <div className="flex-1 h-full flex flex-col relative bg-monitor-bg">
            <div className="flex justify-between items-center p-6 border-b border-crt-green/30 text-xs uppercase tracking-widest z-10">
              <div className="flex items-center gap-4">
                {data && (
                  <button 
                    onClick={() => setData(null)}
                    className="text-crt-green hover:underline flex items-center gap-2"
                  >
                    [ BACK_TO_INPUT ]
                  </button>
                )}
                <span>RESULT: {title || 'AWAITING_INPUT'}</span>
              </div>
              <div className="flex items-center gap-6">
                {data && (
                  <div className="hidden md:block max-w-md bg-crt-green text-monitor-bg px-3 py-1 text-[10px] leading-tight border-2 border-crt-dim shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                    <div className="font-bold border-b border-monitor-bg/30 mb-1">PLOT_SUMMARY.TXT</div>
                    {data.summary.toUpperCase()}
                  </div>
                )}
                <span>NODES: {data ? data.nodes.length.toString().padStart(3, '0') : '000'}</span>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {data ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full w-full"
                  >
                    <RelationshipTree data={data} />
                  </motion.div>
                ) : error ? (
                  <div className="absolute inset-0 flex items-center justify-center text-red-500 text-sm">
                    {error}
                  </div>
                ) : !loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 gap-4">
                    <HelpCircle className="w-16 h-16" />
                    <span className="text-xs">AWAITING_DATA_STREAM</span>
                  </div>
                )}
              </AnimatePresence>

              {/* Grid Background Info */}
              <div className="absolute bottom-6 right-6 opacity-20 text-[10px] text-right z-10">
                X: 12.24<br />Y: 88.01<br />Z: 0.00<br />
                FLOW_CHART_MODE: ENABLED
              </div>
            </div>

            <div className="p-4 border-t border-crt-green/30 text-[10px] tracking-widest opacity-70 z-10 bg-monitor-bg/80">
              [+] HIERARCHICAL VIEW | [!] ALERTS: 0 | [-] ZOOM: 100%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Tree Visualization ---

function RelationshipTree({ data }: { data: CharacterTreeData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (dimensions.width === 0) return <div ref={containerRef} className="w-full h-full" />;

  // Layout: Order of Appearance (Vertical Flow)
  // We'll place nodes in a vertical line or slightly staggered to show connections better
  const nodeSpacingY = 200;
  const nodeSpacingX = 300;
  
  // Calculate positions based on index (appearance order)
  const nodesWithPos = data.nodes.map((node, i) => {
    // Stagger left/right to avoid a perfectly straight line if there are many connections
    const stagger = (i % 2 === 0 ? 1 : -1) * 50;
    return {
      ...node,
      x: dimensions.width / 2 + stagger,
      y: 150 + i * nodeSpacingY
    };
  });

  const totalHeight = Math.max(dimensions.height, data.nodes.length * nodeSpacingY + 300);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.min(Math.max(prev * delta, 0.2), 3));
    } else {
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative cursor-move overflow-hidden"
      onWheel={handleWheel}
    >
      <motion.div 
        drag
        dragMomentum={false}
        style={{ 
          x: position.x, 
          y: position.y, 
          scale,
          transformOrigin: 'center center'
        }}
        className="absolute inset-0 w-full h-full"
      >
        <svg 
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: totalHeight }}
        >
          {data.links.map((link, i) => {
            const source = nodesWithPos.find(n => n.id === link.source);
            const target = nodesWithPos.find(n => n.id === link.target);
            if (!source || !target) return null;

            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;

            return (
              <g key={`link-${i}`}>
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.4 }}
                  transition={{ duration: 1, delay: i * 0.05 }}
                  d={`M${source.x},${source.y} L${target.x},${target.y}`}
                  fill="none"
                  stroke="var(--color-crt-green)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <foreignObject x={midX - 60} y={midY - 10} width="120" height="20">
                  <div className="bg-monitor-bg border border-crt-green/20 text-[6px] text-center uppercase px-1 py-0.5 text-crt-green/60">
                    {link.type}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        <div className="relative w-full" style={{ height: totalHeight }}>
          {nodesWithPos.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, delay: i * 0.05 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: node.x, top: node.y }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="absolute -top-6 text-[8px] opacity-40">
                  APPEARANCE #{i + 1}
                </div>
                <div className={cn(
                  "w-16 h-16 flex items-center justify-center relative shadow-[6px_6px_0_var(--color-crt-dim)] group-hover:brightness-125 transition-all",
                  node.iconType === 'villain' ? "bg-red-900/50 border-2 border-red-500" : "bg-crt-green/20 border-2 border-crt-green"
                )}>
                  <PixelIcon type={node.iconType} className="w-8 h-8" />
                </div>
                <div className="text-center min-w-[120px] bg-monitor-bg/90 p-1 border border-crt-green/20">
                  <div className="text-xs font-bold truncate">{node.name.toUpperCase()}</div>
                  <div className="text-[10px] opacity-60 truncate">{node.role.toUpperCase()}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-30">
        <div className="bg-monitor-bg/80 border border-crt-green/30 p-2 text-[8px] flex flex-col gap-1">
          <span>[ DRAG TO PAN ]</span>
          <span>[ CTRL + SCROLL TO ZOOM ]</span>
          <span>[ ZOOM: {Math.round(scale * 100)}% ]</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setScale(s => Math.min(s + 0.1, 3))} className="pixel-button p-1 text-[10px] w-8 h-8 flex items-center justify-center">+</button>
          <button onClick={() => setScale(s => Math.max(s - 0.1, 0.2))} className="pixel-button p-1 text-[10px] w-8 h-8 flex items-center justify-center">-</button>
          <button onClick={() => { setScale(1); setPosition({x: 0, y: 0}); }} className="pixel-button p-1 text-[10px] px-2 h-8">RESET</button>
        </div>
      </div>
    </div>
  );
}

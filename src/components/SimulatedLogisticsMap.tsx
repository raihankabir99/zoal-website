import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Compass, Shield, Users, HelpCircle, Thermometer, Radio } from 'lucide-react';

interface SimulatedLogisticsMapProps {
  status: string;
  trackingNumber: string;
}

export const SimulatedLogisticsMap: React.FC<SimulatedLogisticsMapProps> = ({ status, trackingNumber }) => {
  const [driverCoord, setDriverCoord] = useState({ x: 45, y: 155 });
  const [driverAngle, setDriverAngle] = useState(45);
  const [simTime, setSimTime] = useState(0);

  // SVG route path coordinates
  // Start: Zoal Luxury Hub (35, 160)
  // Milestone 1: Intersection (80, 120)
  // Milestone 2: Coastal Highway (190, 80)
  // Milestone 3: Client Destination (290, 45)
  const startPoint = { x: 40, y: 160 };
  const endPoint = { x: 340, y: 40 };

  useEffect(() => {
    if (status !== 'Shipped') {
      if (status === 'Completed') {
        setDriverCoord(endPoint);
      } else {
        setDriverCoord(startPoint);
      }
      return;
    }

    // Out for delivery simulation loop (status is 'Shipped')
    let intervalId = setInterval(() => {
      setSimTime((prevTime) => {
        const nextTime = (prevTime + 1) % 100;
        
        // Calculate dynamic position along a curved/multi-segment vector path
        // Segment 1: 0% to 30% (from start to 100, 130)
        // Segment 2: 30% to 70% (from 100, 130 to 220, 90)
        // Segment 3: 70% to 100% (from 220, 90 to endPoint)
        let cx = startPoint.x;
        let cy = startPoint.y;
        let angle = 45;

        if (nextTime < 30) {
          const ratio = nextTime / 30;
          cx = startPoint.x + (100 - startPoint.x) * ratio;
          cy = startPoint.y + (130 - startPoint.y) * ratio;
          angle = 35;
        } else if (nextTime < 70) {
          const ratio = (nextTime - 30) / 40;
          cx = 100 + (240 - 100) * ratio;
          cy = 130 + (80 - 130) * ratio;
          angle = 68;
        } else {
          const ratio = (nextTime - 70) / 30;
          cx = 240 + (endPoint.x - 240) * ratio;
          cy = 80 + (endPoint.y - 80) * ratio;
          angle = 45;
        }

        setDriverCoord({ x: cx, y: cy });
        setDriverAngle(angle);
        return nextTime;
      });
    }, 180);

    return () => clearInterval(intervalId);
  }, [status]);

  // Determine helper descriptions
  let mapTitle = "Boutique Logistics Tracker";
  let mapDescription = "Logistics system idle. Map activates on dispatch.";

  if (status === 'Pending') {
    mapDescription = "Central Order registered. Direct transit mapping planned.";
  } else if (status === 'Preparing') {
    mapDescription = "Item undergoes climate sealing in private hub.";
  } else if (status === 'Shipped') {
    mapTitle = "Live Courier Tracking";
    mapDescription = "Zoal Premium Courier is currently navigating Al Hofuf Express.";
  } else if (status === 'Completed') {
    mapTitle = "Transit Concluded Successfully";
    mapDescription = "Secure handoff and delivery signature confirmed.";
  } else if (status === 'Cancelled') {
    mapTitle = "Transit Cancelled";
    mapDescription = "Transit cancelled and route clearing done.";
  }

  return (
    <div className="border border-white/5 bg-black/40 p-5 rounded-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="space-y-0.5 text-left">
          <div className="flex items-center gap-1.5 text-[#D4AF37] text-[9px] tracking-[0.2em] font-mono uppercase font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#D4AF37]" />
            <span>{mapTitle}</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-sans">{mapDescription}</p>
        </div>
        
        {/* Real-time telemetry if Out for Delivery */}
        {status === 'Shipped' && (
          <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-500 bg-black/60 px-2.5 py-1 rounded-sm border border-[#D4AF37]/15">
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-[#D4AF37]" />
              <span>Chamber: <strong className="text-zinc-300">18.2°C</strong></span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-[#D4AF37]" />
              <span>Speed: <strong className="text-zinc-300">64 km/h</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Map Screen Layout */}
      <div className="relative bg-[#050505] border border-white/5 rounded-xs overflow-hidden h-48 w-full select-none select-none">
        
        {/* Subtle grid mesh overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px]" />
        
        {/* Coastal / Abstract road lines for visual depth */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Abstract land contours / coastal lines */}
          <path d="M-20,105 Q60,120 120,40 T220,-20" fill="none" stroke="rgba(212,175,55,0.03)" strokeWidth="4" />
          <path d="M40,240 Q150,210 250,140 T390,40" fill="none" stroke="rgba(212,175,55,0.015)" strokeWidth="6" />

          {/* Secondary background streets (dark tone) */}
          <line x1="20" y1="40" x2="380" y2="40" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          <line x1="40" y1="20" x2="40" y2="180" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          <line x1="240" y1="10" x2="240" y2="190" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

          {/* Main Delivery Route (Primary Corridor Path) */}
          <path 
            id="courier-route-track"
            d={`M${startPoint.x},${startPoint.y} L100,130 L240,80 L${endPoint.x},${endPoint.y}`} 
            fill="none" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="3" 
            strokeLinecap="round"
          />

          {/* Completed route trail highlighted in elegant Gold */}
          {status === 'Completed' && (
            <path 
              d={`M${startPoint.x},${startPoint.y} L100,130 L240,80 L${endPoint.x},${endPoint.y}`} 
              fill="none" 
              stroke="#D4AF37" 
              strokeOpacity="0.55"
              strokeWidth="2" 
              strokeLinecap="round"
            />
          )}

          {/* Live animated trailing path if Driver is executing transit */}
          {status === 'Shipped' && (
            <path 
              d={`M${startPoint.x},${startPoint.y} L100,130 L240,80 L${endPoint.x},${endPoint.y}`} 
              fill="none" 
              stroke="#D4AF37" 
              strokeLinecap="round"
              strokeWidth="2.5"
              strokeDasharray="400"
              strokeDashoffset={400 - (simTime * 4)}
              strokeOpacity="0.8"
              className="drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]"
            />
          )}
        </svg>

        {/* Start Point Marker: Zoal Central Roastery */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${startPoint.x}px`, top: `${startPoint.y}px` }}
        >
          <div className="relative group flex flex-col items-center">
            {/* Pulsing indicator */}
            <span className="absolute inline-flex h-4 w-4 rounded-full bg-[#D4AF37]/30 animate-ping" />
            <div className="w-6.5 h-6.5 rounded-full bg-black border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.3)] z-10">
              <span className="text-[7.5px] font-mono font-extrabold tracking-tighter">ZH</span>
            </div>
            {/* Label tip */}
            <span className="absolute top-7 bg-black/95 border border-[#D4AF37]/20 px-2 py-0.5 rounded-sm text-[7.5px] font-mono tracking-widest text-zinc-300 uppercase whitespace-nowrap opacity-90">
              ZOAL HUB
            </span>
          </div>
        </div>

        {/* Dynamic / Live Driver Interceptor Marker */}
        {status === 'Shipped' && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-linear z-20"
            style={{ left: `${driverCoord.x}px`, top: `${driverCoord.y}px` }}
          >
            <div className="relative flex flex-col items-center">
              {/* Ping Ring */}
              <span className="absolute inline-flex h-9 w-9 rounded-full bg-[#D4AF37]/45 animate-ping" />
              <div 
                className="w-7 h-7 rounded-full bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.8)] border border-black flex items-center justify-center transform transition-transform"
                style={{ transform: `rotate(${driverAngle}deg)` }}
              >
                <Navigation className="w-3.5 h-3.5 fill-black stroke-[2.5]" />
              </div>
              <span className="absolute -top-7 bg-black/95 px-2 py-0.5 border border-[#D4AF37] rounded-sm text-[7px] font-mono text-[#D4AF37] font-bold tracking-widest whitespace-nowrap uppercase">
                COURIER ACTIVE
              </span>
            </div>
          </div>
        )}

        {/* Destination client sanctuary marker */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${endPoint.x}px`, top: `${endPoint.y}px` }}
        >
          <div className="relative flex flex-col items-center">
            {status === 'Completed' && (
              <span className="absolute inline-flex h-5 w-5 rounded-full bg-emerald-500/20 animate-ping" />
            )}
            <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border z-10 shadow-lg ${
              status === 'Completed' 
                ? 'bg-emerald-950 border-emerald-400 text-emerald-400' 
                : 'bg-black border-white/20 text-zinc-400'
            }`}>
              <MapPin className="w-3.5 h-3.5" />
            </div>
            {/* Address tooltip label */}
            <span className="absolute top-7 bg-black/95 border border-white/5 px-2 py-0.5 rounded-sm text-[7px] font-sans tracking-wide text-zinc-400 uppercase whitespace-nowrap">
              CLIENT HOME
            </span>
          </div>
        </div>

        {/* Coastal boundary labels (visual realism) */}
        <div className="absolute right-3 bottom-3 text-right">
          <span className="block text-[6.5px] font-mono tracking-widest text-zinc-650 uppercase">Eastern Province Plains</span>
          <span className="block text-[7.5px] font-display text-[#D4AF37]/40 uppercase tracking-widest">Al Hofuf Oasis Region</span>
        </div>

        {/* Custom compass rose decal */}
        <div className="absolute left-3 top-3 opacity-25">
          <Compass className="w-7 h-7 text-[#D4AF37]" />
        </div>

        {/* Map idle states placeholders (if not dispatched/cancelled) */}
        {status !== 'Shipped' && status !== 'Completed' && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
            <span className="bg-black/80 border border-white/10 px-3 py-1 rounded-sm text-[8px] font-mono text-zinc-400 tracking-widest uppercase">
              {status === 'Cancelled' ? 'CORRIDOR INACTIVE' : 'COURIER STANDING BY AT CENTRAL HUB'}
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

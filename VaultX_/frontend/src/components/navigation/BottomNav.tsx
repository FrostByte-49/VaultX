import React from 'react';
import { 
  motion, 
  useMotionValue, 
  useSpring, 
  useTransform, 
  MotionValue 
} from 'framer-motion';
import {
  Home,
  Vault,
  BarChart3,
  Users,
  KeyRound,
  Skull,
  FileSearch,
  Settings
} from "lucide-react";

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const mouseX = useMotionValue(Infinity);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'vault', icon: Vault, label: 'Vault' },
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'nominees', icon: Users, label: 'Nominees' },
    { id: 'nominee-access', icon: KeyRound, label: 'Nominee Access' },
    { id: 'dead-man-switch', icon: Skull, label: 'Dead Man Switch' },
    { id: 'audit', icon: FileSearch, label: 'Audit' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* Fixed Container */}
      <div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-center gap-3 px-3 h-16 bg-card border border-foreground/50 rounded-2xl shadow-xl backdrop-blur-md"
      >
        {navItems.map((item) => (
          <NavItem 
            key={item.id} 
            item={item} 
            mouseX={mouseX} 
            isActive={currentPage === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>
    </nav>
  );
};

// Define The Shape Of Nav Item
interface NavItemData {
  id: string;
  icon: React.ElementType;
  label: string;
}

function NavItem({ 
  item, 
  mouseX, 
  isActive, 
  onClick 
}: { 
  item: NavItemData; 
  mouseX: MotionValue; 
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const Icon = item.icon;

  // Intensity Controls
  const proximityRange = 100; 
  const maxScale = 1.5; 
  const maxLift = -12; 

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Calculate Raw Transformations
  const scaleSync = useTransform(
    distance, 
    [-proximityRange, 0, proximityRange], 
    [1, maxScale, 1]
  );
  const ySync = useTransform(
    distance, 
    [-proximityRange, 0, proximityRange], 
    [0, maxLift, 0]
  );

  // Apply Spring Physics
  const scaleSpring = useSpring(scaleSync, { mass: 0.1, stiffness: 200, damping: 15 });
  const ySpring = useSpring(ySync, { mass: 0.1, stiffness: 200, damping: 15 });

  // For Active Icon (scale = 1, y = 0) - Disables Pop For Active Element
  const scale = isActive ? 1 : scaleSpring;
  const y = isActive ? 0 : ySpring;

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors duration-300 ${
        isActive 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground'
      }`}
    >
      <span className="absolute -top-10 px-2 py-1 rounded-md bg-foreground text-background text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
        {item.label}
      </span>

      <motion.div style={{ scale, y }} className="flex items-center justify-center">
        <Icon 
          className={`w-6 h-6 transition-all ${
            isActive
              ? 'text-primary stroke-[2px]'
              : 'group-hover:text-foreground group-hover:stroke-[1.75px]'
          }`} 
        />
      </motion.div>
      
      {isActive && (
        <motion.div 
          layoutId="active-pill"
          className="absolute bottom-1 w-4 h-0.75 bg-primary rounded-full"
        />
      )}
    </button>
  );
}

export default BottomNav;
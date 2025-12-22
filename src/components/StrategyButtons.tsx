import { Rocket, Coins, AlertTriangle, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export type StrategyType = 'all' | 'bullish' | 'institutional' | 'shortsqueeze' | 'favorites';

interface Strategy {
  id: StrategyType;
  name: string;
  icon: React.ReactNode;
}

interface StrategyButtonsProps {
  activeStrategy: StrategyType;
  onStrategyChange: (strategy: StrategyType) => void;
}

/**
 * 策略按鈕組件
 */
export function StrategyButtons({
  activeStrategy,
  onStrategyChange,
}: StrategyButtonsProps) {
  const strategies: Strategy[] = [
    {
      id: 'all',
      name: '所有策略',
      icon: null,
    },
    {
      id: 'bullish',
      name: '多頭排列',
      icon: <Rocket size={18} className="text-red-500" />,
    },
    {
      id: 'institutional',
      name: '法人抬轎',
      icon: <Coins size={18} className="text-yellow-500" />,
    },
    {
      id: 'shortsqueeze',
      name: '軋空警訊',
      icon: <AlertTriangle size={18} className="text-yellow-500" />,
    },
    {
      id: 'favorites',
      name: '我的收藏',
      icon: <Heart size={18} className="text-red-500" />,
    },
  ];

  return (
    <div className="flex gap-3">
      {strategies.map((strategy, index) => {
        const isActive = activeStrategy === strategy.id;
        return (
          <motion.button
            key={strategy.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStrategyChange(strategy.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
              ${
                isActive
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            {strategy.icon && (
              <motion.div
                animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                {strategy.icon}
              </motion.div>
            )}
            <span className="text-sm font-medium">{strategy.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}










import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'primary', delay = 0 }) => {
  const colors = {
    primary: 'from-primary-500/20 to-primary-600/10 border-primary-500/30 text-primary-400',
    secondary: 'from-secondary-500/20 to-secondary-600/10 border-secondary-500/30 text-secondary-400',
    success: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    warning: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    danger: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          {trendValue !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && <div className={`p-2.5 rounded-lg bg-gradient-to-br ${colors[color]}`}><Icon className="w-5 h-5" /></div>}
      </div>
    </motion.div>
  )
}
export default StatCard

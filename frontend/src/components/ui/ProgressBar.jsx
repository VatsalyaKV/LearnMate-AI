export const ProgressBar = ({ value = 0, color = 'primary', size = 'md', showLabel = false, label = '' }) => {
  const h = { sm: 'h-1', md: 'h-2', lg: 'h-3' }[size]
  const c = { primary: 'from-primary-500 to-primary-400', secondary: 'from-secondary-500 to-secondary-400', success: 'from-success-600 to-success-500', warning: 'from-warning-600 to-warning-500', danger: 'from-danger-600 to-danger-500' }[color] || 'from-primary-500 to-primary-400'
  return (
    <div>
      {(showLabel || label) && <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{label}</span><span>{Math.round(value)}%</span></div>}
      <div className={`w-full bg-gray-800 rounded-full ${h} overflow-hidden`}>
        <div className={`${h} rounded-full bg-gradient-to-r ${c} transition-all duration-700`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}
export default ProgressBar

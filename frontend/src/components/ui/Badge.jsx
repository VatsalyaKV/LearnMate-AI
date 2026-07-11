export const Badge = ({ children, color = 'primary', size = 'sm' }) => {
  const colors = {
    primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
    secondary: 'bg-secondary-500/20 text-secondary-300 border border-secondary-500/30',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    gray: 'bg-gray-700 text-gray-300 border border-gray-600',
    cyan: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  }
  const sizes = { xs: 'px-1.5 py-0.5 text-xs', sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-sm' }
  return <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colors[color]} ${sizes[size]}`}>{children}</span>
}
export default Badge

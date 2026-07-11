export const Spinner = ({ size = 'md', className = '' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-16 h-16' }[size]
  return <div className={`${s} border-2 border-gray-700 border-t-primary-500 rounded-full animate-spin ${className}`} />
}
export default Spinner

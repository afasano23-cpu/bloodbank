export function StatCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color || 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-900 font-medium">{label}</div>
    </div>
  )
}

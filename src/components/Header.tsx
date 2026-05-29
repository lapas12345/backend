import { User } from 'lucide-react'

interface HeaderProps {
  userName?: string
  userRole?: string
}

export const Header = ({ 
  userName = "Ing. Juan Pérez", 
  userRole = "Profesor Supervisor"
}: HeaderProps) => {
  return (
    <header className="bg-white flex items-center justify-between px-8 py-4 shadow-sm z-10 relative mt-6 rounded-[2rem] shrink-0">
      <div className="flex items-center text-gray-500 font-medium">
        <span>Sistema de Gestión Académica</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{userName}</p>
          <p className="text-xs text-gray-500">{userRole}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
          <User className="w-5 h-5" />
        </div>
      </div>
    </header>
  )
}

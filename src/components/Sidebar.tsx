import { LayoutDashboard, GraduationCap, Briefcase, Link, FlaskConical } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface MenuItem {
  path: string
  label: string
  icon: React.ElementType
}

const menuItems: MenuItem[] = [
  { path: '/', label: 'DASHBOARD', icon: LayoutDashboard },
  { path: '/titulacion', label: 'TITULACIÓN', icon: GraduationCap },
  { path: '/practicas', label: 'PRÁCTICAS', icon: Briefcase },
  { path: '/vinculacion', label: 'VINCULACIÓN', icon: Link },
  { path: '/investigacion', label: 'INVESTIGACIÓN', icon: FlaskConical },
]

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-primary-dark text-white flex flex-col z-20 overflow-visible relative shrink-0">
      <div className="px-6 py-6 flex justify-center">
        <img src="/logoUIleam.png" alt="Logo Universidad" className="h-10 object-contain" />
      </div>

      <nav className="flex-1 py-4 pl-4 pr-0">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `
                    w-full flex items-center gap-3 px-5 py-3 transition-all duration-300 group
                    ${isActive 
                      ? 'menu-active' 
                      : 'text-red-100/80 hover:bg-white/10 hover:text-white font-medium mr-4 rounded-[1.5rem]'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="text-sm tracking-wide font-medium">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
      
      <div className="p-6">
        <div className="text-xs text-red-100/60 text-center uppercase tracking-widest">
          SGA v2.0
        </div>
      </div>
    </aside>
  )
}

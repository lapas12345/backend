import { User, Mail, Phone, Calendar, MapPin, Award, ChevronRight } from 'lucide-react'

export const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
      {/* Columna Izquierda / Central */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Tarjeta de Perfil */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
          <div className="w-32 h-32 rounded-full overflow-hidden shrink-0 border-4 border-gray-50 relative z-10 bg-gray-100 flex items-center justify-center text-gray-400">
            <User className="w-16 h-16" />
          </div>
          
          <div className="flex-1 z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Ing. Juan Pérez</h2>
                <p className="text-gray-500 mb-4">Profesor Supervisor</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-600">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Fecha registro: 24 nov. 2022</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> Manta, Ecuador</div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> jperez@uleam.edu.ec</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> +593 99 999 9999</div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors">T</div>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors">P</div>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors">V</div>
            </div>
          </div>
          
          {/* Decoración de fondo suave */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-50 rounded-full opacity-50 z-0"></div>
        </div>

        {/* Proyectos / Timeline */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Mis Proyectos Activos</h3>
          
          <div className="space-y-4">
            <div className="bg-red-50/50 rounded-2xl p-5 flex items-center justify-between border border-red-100/50 hover:shadow-md transition-shadow">
              <div>
                <h4 className="font-semibold text-gray-900">Tesis: Sistema de Gestión Académica</h4>
                <p className="text-sm text-gray-500 mt-1">Revisión de marco teórico...</p>
                <div className="text-xs font-medium text-gray-400 mt-2">12 estudiantes asig.</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">En progreso</span>
                <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between border border-slate-100 hover:shadow-md transition-shadow">
              <div>
                <h4 className="font-semibold text-gray-900">Práctica: Empresa Tech XYZ</h4>
                <p className="text-sm text-gray-500 mt-1">Supervisión de prácticas pre-profesionales...</p>
                <div className="text-xs font-medium text-gray-400 mt-2">5 estudiantes</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Completado</span>
                <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-orange-50/50 rounded-2xl p-5 flex items-center justify-between border border-orange-100/50 hover:shadow-md transition-shadow">
              <div>
                <h4 className="font-semibold text-gray-900">Vinculación: Comunidad San José</h4>
                <p className="text-sm text-gray-500 mt-1">Proyecto de alfabetización digital...</p>
                <div className="text-xs font-medium text-gray-400 mt-2">20 estudiantes</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-semibold">Inicio: 15 Oct</span>
                <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Columna Derecha */}
      <div className="space-y-6">
        
        {/* Stats rápidos */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Resumen Semestral</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
              <span className="text-gray-600 font-medium">Horas de tutoría</span>
              <span className="text-lg font-bold text-gray-900">120h</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
              <span className="text-gray-600 font-medium">Proyectos activos</span>
              <span className="text-lg font-bold text-gray-900">14</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
              <span className="text-gray-600 font-medium">Estudiantes a cargo</span>
              <span className="text-lg font-bold text-gray-900">35</span>
            </div>
          </div>
        </div>

        {/* Tarjeta Informativa / Destacada */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-[2rem] p-8 shadow-md text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 p-4 opacity-10">
            <Award className="w-40 h-40" />
          </div>
          <h3 className="text-xl font-bold mb-4 relative z-10">Novedades del Sistema</h3>
          <ul className="space-y-3 mb-8 relative z-10 text-red-50 text-sm">
            <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0"></div> Nuevo módulo de titulación disponible</li>
            <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0"></div> Generación de reportes automáticos habilitada</li>
            <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0"></div> Mejoras en la velocidad del sistema</li>
          </ul>
          <button className="w-full bg-white text-primary font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors relative z-10 shadow-sm cursor-pointer">
            Ver actualizaciones
          </button>
        </div>
      </div>
    </div>
  )
}

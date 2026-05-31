import { useState, useEffect } from 'react';
import { getPeriods, generateReport } from './api';

interface Period {
  id_periodo: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

export default function ReportGenerator() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [oficio, setOficio] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar períodos al iniciar
  useEffect(() => {
    const loadPeriods = async () => {
  try {
    const data = await getPeriods();
    
    // Si el backend devuelve un objeto, extrae el array. Si ya es array, úsalo.
    const periods = Array.isArray(data) ? data : (data?.periods || []);
    
    // Ahora sí puedes usar .find()
    const current = periods.find((p: string) => p === '2025-1') || periods[0];
    
    setPeriods(periods);
    setSelectedPeriod(current);
  } catch (err) {
    console.error('Error cargando periodos:', err);
    setPeriods([]);
  }
};
    loadPeriods();
  }, []);

  const handleDownload = async () => {
    if (!selectedPeriod) {
      alert('Selecciona un período académico');
      return;
    }
    
    setLoading(true);
    try {
      const blob = await generateReport(selectedPeriod, oficio);
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `informe-tutorias-${selectedPeriod}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error generando PDF. Revisa que el backend esté corriendo.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'Arial', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '2px solid #1e40af', paddingBottom: '10px', color: '#1e40af' }}>
        Generador de Informe de Tutorías
      </h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
          Período Académico:
        </label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="">-- Selecciona un período --</option>
          {periods.map((p) => (
            <option key={p.id_periodo} value={p.nombre}>
              {p.nombre} {p.estado === 'ACTIVO' ? '(ACTIVO)' : `(${p.estado})`}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
          N° de Oficio:
        </label>
        <input
          type="text"
          value={oficio}
          onChange={(e) => setOficio(e.target.value)}
          placeholder="ULEAM-022-DPGA-TA-2025-2"
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#9ca3af' : '#1e40af',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Generando PDF...' : '📥 Descargar Informe PDF'}
      </button>
    </div>
  );
}

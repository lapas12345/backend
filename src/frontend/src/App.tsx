import ReportGenerator from './modules/reportGenerator/reportGenerator';

export const App = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <header style={{ backgroundColor: '#1e3a8a', color: 'white', padding: '15px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Sistema de Tutorías Académicas - ULEAM</h1>
      </header>
      <main>
        <ReportGenerator />
      </main>
    </div>
  );
}


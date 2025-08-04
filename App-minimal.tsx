import React from 'react';

const App: React.FC = () => {
  console.log('App component rendering...');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#333', marginBottom: '1rem' }}>
          Bible Study App
        </h1>
        <p style={{ color: '#666' }}>
          ✅ React is loading successfully!
        </p>
      </div>
    </div>
  );
};

export default App;
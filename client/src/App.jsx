import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('Could not reach API'));
  }, []);

  return (
    <div className="app">
      <h1>Find Businesses</h1>
      <p>{message || 'Loading...'}</p>
    </div>
  );
}

export default App;

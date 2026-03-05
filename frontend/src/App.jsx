import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FileText, Files, FileEdit, ArrowRightLeft, X, Upload, CheckCircle, Loader2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Verify from './pages/Verify';

const API_BASE = 'http://localhost:8002';

const tools = [
  { id: 'pdf-to-word', title: 'PDF to Word', desc: 'Convert your PDF documents to editable Word files with high accuracy.', icon: <FileText size={32} />, endpoint: '/pdf-to-word' },
  { id: 'word-to-pdf', title: 'Word to PDF', desc: 'Transform Word documents into professional PDF files instantly.', icon: <Files size={32} />, endpoint: '/word-to-pdf' },
  { id: 'merge', title: 'Merge PDF', desc: 'Combine multiple PDF files into a single document in seconds.', icon: <ArrowRightLeft size={32} />, endpoint: '/merge', multiple: true },
  { id: 'split', title: 'Split PDF', desc: 'Separate one PDF page or extract all pages into separate PDF files.', icon: <FileEdit size={32} />, endpoint: '/split' },
];

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function Dashboard() {
  const [activeTool, setActiveTool] = useState(null);
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('user_email');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  const handleToolClick = (tool) => {
    setActiveTool(tool);
    setFiles([]);
    setStatus('idle');
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(activeTool?.multiple ? selectedFiles : [selectedFiles[0]]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setStatus('uploading');

    const token = localStorage.getItem('token');
    const formData = new FormData();
    if (activeTool.multiple) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('file', files[0]);
    }

    try {
      const response = await fetch(`${API_BASE}${activeTool.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) throw new Error('Upload failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeTool.multiple ? 'processed.zip' : `processed_${files[0].name.split('.')[0]}.${activeTool.id === 'pdf-to-word' ? 'docx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">AntiPDF</div>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{userEmail}</span>
          <button className="btn-primary" onClick={handleLogout} style={{ padding: '0.6rem 1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main>
        <div className="hero">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            Precision PDF Tools
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            Welcome to your secure document workspace.
          </motion.p>
        </div>

        <div className="tools-grid">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              className="tool-card"
              onClick={() => handleToolClick(tool)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="tool-icon">{tool.icon}</div>
              <h3>{tool.title}</h3>
              <p>{tool.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {activeTool && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <button className="close-btn" onClick={() => setActiveTool(null)}><X size={24} /></button>
              <div className="tool-icon" style={{ margin: '0 auto 1.5rem' }}>{activeTool.icon}</div>
              <h2>{activeTool.title}</h2>
              {status === 'idle' && (
                <>
                  <div className="drop-zone" onClick={() => fileInputRef.current.click()}>
                    <Upload size={48} style={{ color: '#6366f1', marginBottom: '1rem' }} />
                    <p>Click or drag {activeTool.multiple ? 'files' : 'a file'} here</p>
                    <input type="file" className="file-input" ref={fileInputRef} onChange={handleFileChange} multiple={activeTool.multiple} />
                  </div>
                  <button className="btn-primary" disabled={files.length === 0} onClick={handleUpload}>Process Files</button>
                </>
              )}
              {status === 'uploading' && <div style={{ padding: '4rem 0' }}><Loader2 className="animate-spin" size={64} style={{ color: '#6366f1', margin: '0 auto' }} /><h3>Processing...</h3></div>}
              {status === 'success' && <div style={{ padding: '4rem 0' }}><CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto' }} /><h3>Success!</h3><button className="btn-primary" onClick={() => setActiveTool(null)}>Done</button></div>}
              {status === 'error' && <div style={{ padding: '4rem 0' }}><X size={64} style={{ color: '#ef4444', margin: '0 auto' }} /><h3>Error Occurred</h3><button className="btn-primary" onClick={() => setStatus('idle')}>Try Again</button></div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

import React, { useState, useContext, useEffect } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import useUploadStatus from '../hooks/useUploadStatus';
import Spinner from '../components/Spinner';

export default function UploadPage() {
  const { token } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('jsonld');
  const [uploadId, setUploadId] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  useUploadStatus(uploadId, token, (newStatus) => {
    setStatus(newStatus);
    if (newStatus.status === 'PENDING') {
      setMessage('Uploading...');
      setMessageType('info');
    } else if (newStatus.status === 'SUCCESS') {
      setMessage(`Successfully processed: ${newStatus.count} entities.`);
      setMessageType('success');
    } else if (newStatus.status === 'FAIL') {
      setMessage('Processing failed.');
      setMessageType('danger');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    try {
      const response = await api.upload(formData, token);
      setUploadId(response.data.uploadId);
    } catch {
      setStatus({ status: 'FAIL' });
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 600 }}>
      <h2>Upload CSV</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input
            type="file"
            accept=".csv"
            className="form-control"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Format:</label><br />
          {['jsonld', 'ngsiv2', 'both'].map((f) => (
            <div key={f} className="form-check form-check-inline">
              <input
                type="radio"
                id={f}
                name="format"
                value={f}
                checked={format === f}
                onChange={(e) => setFormat(e.target.value)}
                className="form-check-input"
              />
              <label htmlFor={f} className="form-check-label">
                {f.toUpperCase()}
              </label>
            </div>
          ))}
        </div>
        <button type="submit" className="btn btn-primary">
          Upload
        </button>
      </form>

      {message && (
        <div className={`alert alert-${messageType} mt-4`} role="alert">
          {message}
        </div>
      )}

      {status && status.status === 'PENDING' && (
        <div className="mt-3">
          <Spinner />
        </div>
      )}
    </div>
  );
}

import { useEffect } from 'react';
import api from '../api';

export default function useUploadStatus(uploadId, token, onUpdate) {
  useEffect(() => {
    if (!uploadId) return;
    const iv = setInterval(async () => {
      const res = await api.status(uploadId, token);
      onUpdate(res.data);
      if (['SUCCESS','FAIL'].includes(res.data.status)) {
        clearInterval(iv);
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [uploadId]);
}

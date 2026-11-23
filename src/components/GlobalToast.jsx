import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

let toastFn = null;

export const showToast = (message, severity = 'success') => {
  if (toastFn) {
    toastFn(message, severity);
  }
};

export default function GlobalToast() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [sev, setSev] = useState('success');

  useEffect(() => {
    toastFn = (message, severity = 'success') => {
      setMsg(message);
      setSev(severity);
      setOpen(true);
    };
    return () => {
      toastFn = null;
    };
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={() => setOpen(false)} severity={sev} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
        {msg}
      </Alert>
    </Snackbar>
  );
}

import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';

import '@react-pdf-viewer/core/lib/styles/index.css';

const PdfViewer = ({ fileUrl }) => {
  // No hooks used - simple functional component to avoid hooks order issues
  if (!fileUrl) {
    return <div className="text-center p-4">Loading PDF viewer...</div>;
  }

  return (
    <div style={{ height: '600px', border: '1px solid #ddd' }}>
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer fileUrl={fileUrl} />
      </Worker>
    </div>
  );
};

export default PdfViewer;


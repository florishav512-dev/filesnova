import initQpdf from '../../../node_modules/@jspawn/qpdf-wasm/qpdf.js';

let qpdf;

self.onmessage = async (event) => {
  const { file, password, action } = event.data;

  try {
    if (!qpdf) {
      qpdf = await initQpdf({
        locateFile: (f) => `/qpdf/${f}`
      });
    }

    const output = qpdf.call(
      password ? '--password=' + password : '',
      file.name,
      '/output.pdf',
      action === 'encrypt' ? '--encrypt' : '--decrypt',
      '--'
    );

    self.postMessage({ success: true, output });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

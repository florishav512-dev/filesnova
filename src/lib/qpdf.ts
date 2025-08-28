// Helper module to load the QPDF WebAssembly bundle on demand with a stable API.
//
// This module wraps the qpdf-wasm runtime and exposes a `run()` method that
// always returns a result object containing an exitCode, stderr, and any
// output files.  It avoids the undefined result that occurred when using
// qpdf.run directly from the CDN, and it writes input files into the
// Emscripten virtual FS before invoking callMain().  The returned object
// ensures consumers can safely read `exitCode` without encountering
// undefined errors.

export type QpdfRunResult = {
  exitCode: number;
  stderr: string;
  files: Record<string, Uint8Array>;
};

export type QpdfModule = {
  run: (argv: string[], files: Record<string, Uint8Array>) => Promise<QpdfRunResult>;
};

let qpdfPromise: Promise<QpdfModule> | null = null;

/**
 * Lazily load and initialise the qpdf WebAssembly module.
 *
 * The first time this function is called it will fetch the ESM loader
 * from jsDelivr and then instantiate qpdf using the provided `locateFile`
 * callback. Subsequent calls return the same promise.  The wasm binary
 * (`qpdf.wasm`) must be available under `/qpdf` in the public folder of
 * your deployment.  The returned module wraps qpdf's callMain() to
 * provide a stable run() API which always returns a QpdfRunResult.
 */
export function getQpdf(): Promise<QpdfModule> {
  if (!qpdfPromise) {
    qpdfPromise = (async () => {
      const createModule = (await import(/* @vite-ignore */
        'https://cdn.jsdelivr.net/npm/@jspawn/qpdf-wasm@0.0.2/qpdf.mjs'
      )).default;
      const mod: any = await createModule({
        locateFile: (file: string) => `/qpdf/${file}`,
        noInitialRun: true,
      });
      async function run(argv: string[], files: Record<string, Uint8Array>): Promise<QpdfRunResult> {
        const FS = mod.FS;
        // Write input files into the virtual FS, creating directories if needed
        for (const [name, data] of Object.entries(files || {})) {
          const parts = name.split('/');
          if (parts.length > 1) {
            let path = '';
            for (let i = 0; i < parts.length - 1; i++) {
              path += (i ? '/' : '') + parts[i];
              try { FS.mkdir(path); } catch { /* already exists */ }
            }
          }
          FS.writeFile(name, data);
        }
        const stderrLines: string[] = [];
        const oldPrintErr = mod.printErr;
        mod.printErr = (s: any) => {
          stderrLines.push(String(s));
          if (oldPrintErr) oldPrintErr(s);
        };
        let exitCode = 0;
        try {
          mod.callMain(argv);
        } catch (e: any) {
          if (typeof e?.status === 'number') {
            exitCode = e.status | 0;
          } else {
            stderrLines.push(String(e));
            exitCode = 1;
          }
        } finally {
          mod.printErr = oldPrintErr;
        }
        const outName = argv[argv.length - 1];
        const outFiles: Record<string, Uint8Array> = {};
        try {
          outFiles[outName] = FS.readFile(outName);
        } catch {
          // output not produced
        }
        return { exitCode, stderr: stderrLines.join('\n'), files: outFiles };
      }
      return { run } as QpdfModule;
    })();
  }
  return qpdfPromise;
}
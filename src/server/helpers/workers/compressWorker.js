/**
 * This is a worker script that will be executed using worker_threads as described in the NodeJS documentation: https://nodejs.org/api/worker_threads.html#worker_threads_worker_threads
 * This worker script takes a file path, opens that file and then decompresses the contents, returning a buffer.
 */

// eslint-disable-next-line
const { workerData, parentPort } = require('worker_threads');
const zlib = require('zlib');
const fs = require('fs');

try {
  // Get worker data.
  const { filePath } = workerData;

  fs.readFile(filePath, (err, data) => {
    if (err) {
      parentPort.postMessage({ buffer: null, ok: 0, err });
    } else {
      zlib.deflate(data, (zlibErr, compressedBuffer) => {
        if (zlibErr) {
          parentPort.postMessage({ buffer: null, ok: 0, err: zlibErr });
        } else {
          parentPort.postMessage({ buffer: compressedBuffer, ok: 1 });
        }
      });
    }
  });
} catch (error) {
  parentPort.postMessage({ buffer: null, ok: 0, err: error });
}

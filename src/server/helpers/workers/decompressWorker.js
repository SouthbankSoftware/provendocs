/**
 * This is a worker script that will be executed using worker_threads as described in the NodeJS documentation: https://nodejs.org/api/worker_threads.html#worker_threads_worker_threads
 * This worker script takes a buffer and decompresses the data inside, returns a new buffer.
 */

// eslint-disable-next-line
const { workerData, parentPort } = require('worker_threads');
const zlib = require('zlib');

try {
  // Get worker data.
  const { compressedBuffer } = workerData;
  // const decompressedBuffer = zlib.inflateSync(compressedBuffer);
  zlib.inflate(compressedBuffer, (err, decompressedBuffer) => {
    if (err) {
      parentPort.postMessage({ buffer: null, ok: 0, err });
    } else {
      parentPort.postMessage({ buffer: decompressedBuffer, ok: 1, status: 'Done' });
    }
  });
} catch (error) {
  parentPort.postMessage({ buffer: null, ok: 0, err: error });
}

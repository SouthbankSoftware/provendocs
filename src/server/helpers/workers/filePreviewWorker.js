/**
 * This is a worker script that will be executed using worker_threads as described in the NodeJS documentation: https://nodejs.org/api/worker_threads.html#worker_threads_worker_threads
 * This worker script takes in information about a file and proof, and then returns an object representing the certificate to be created.
 */

// $FlowFixMe
const { workerData, parentPort } = require('worker_threads'); // eslint-disable-line
// const Path = require('path');
const fs = require('fs');
const excel = require('xlsx');
const file2htmlText = require('file2html-text');
const file2htmlOoxml = require('file2html-ooxml');
const file2htmlImage = require('file2html-image');
const file2html = require('file2html');
const mammoth = require('mammoth');

const MIMETYPES = {
  EMAIL: 'email',
  PDF: 'application/pdf',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  SVG: 'image/svg+xml',
  OCTET_STREAM: 'application/octet-stream',
  JSON: 'application/json',
  TEXT: 'text/plain',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  HTML: 'text/html',
  JS: 'text/javascript',
  SHELL: 'text/x-sh',
};

const { path, fileInfo } = workerData;
const { mimetype } = fileInfo;

file2html.config({
  readers: [file2htmlText.default, file2htmlOoxml.default, file2htmlImage.default],
});

//
// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────────
//
//
// ───────────────────────────────────────────────────── END HELPER FUNCTIONS ─────
//
//
// ─── CREATE FILE PREVIEW ────────────────────────────────────────────────────────
//
try {
  fileInfo.mimeType = fileInfo.mimetype;
  if (mimetype === MIMETYPES.EMAIL) {
    //
    // ─── EMAIL HANDLING ─────────────────────────────────────────────────────────────
    //

    const {
      to, from, subject, attachments, cc, html,
    } = path;
    parentPort.postMessage({
      preview: {
        content: html,
        styles: {},
        to,
        from,
        subject,
        cc,
        attachments,
      },
      ok: 1,
    });
  } else if (
    mimetype === MIMETYPES.PDF
    || mimetype === MIMETYPES.DOC
    || mimetype === MIMETYPES.HTML
  ) {
    //
    // ─── PDF DOC AND HTML HANDLING ──────────────────────────────────────────────────
    //
    // @TODO -> These previews should be generated using the FilePreview Library or fetched
    parentPort.postMessage({ preview: { content: {}, styles: {} }, ok: 1 });
  } else if (
    mimetype === MIMETYPES.JS
    || mimetype === MIMETYPES.TEXT
    || mimetype === MIMETYPES.JSON
    || mimetype === MIMETYPES.OCTET_STREAM
    || mimetype === MIMETYPES.SHELL
  ) {
    //
    // ─── JS TEXT JSON OCTET-STREAM AND SHELL HANDLING ────────────────
    //
    fs.readFile(path, (err, buffer) => {
      if (err) {
        parentPort.postMessage({ preview: null, ok: 0, err });
      } else {
        fileInfo.mimeType = 'text/plain';
        file2html
          .read({ fileBuffer: buffer, meta: fileInfo })
          .then((fileHTML) => {
            const { styles, content } = fileHTML.getData();
            parentPort.postMessage({ preview: { content, styles }, ok: 1 });
          })
          .catch((file2htmlError) => {
            parentPort.postMessage({ preview: null, ok: 0, err: file2htmlError });
          });
      }
    });
  } else if (mimetype === MIMETYPES.DOCX) {
    //
    // ─── DOCX HANDLING ──────────────────────────────────────────────────────────────
    //
    mammoth
      .convertToHtml({ path })
      .then((result) => {
        const { value, messages } = result;
        parentPort.postMessage({ messages, preview: { content: value, style: {} }, ok: 1 });
      })
      .catch((mammothErr) => {
        parentPort.postMessage({ preview: null, ok: 0, err: mammothErr });
      })
      .done();
  } else if (
    mimetype === MIMETYPES.PNG
    || mimetype === MIMETYPES.SVG
    || mimetype === MIMETYPES.JPEG
  ) {
    //
    // ─── PNG SVG AND JPEG HANDLING ──────────────────────────────────────────────────
    //
    fs.readFile(path, (err, buffer) => {
      if (err) {
        parentPort.postMessage({ preview: null, ok: 0, err });
      } else {
        file2html
          .read({ fileBuffer: buffer, meta: fileInfo })
          .then((fileHTML) => {
            const { styles, content } = fileHTML.getData();
            parentPort.postMessage({ preview: { content, styles }, ok: 1 });
          })
          .catch((file2htmlError) => {
            parentPort.postMessage({ preview: null, ok: 0, err: file2htmlError });
          });
      }
    });
  } else if (mimetype === MIMETYPES.XLSX) {
    const workbook = excel.readFile(path);
    parentPort.postMessage({ preview: { content: workbook, styles: {} }, ok: 1 });
  } else {
    //
    // ─── MISC FILE HANDLING ─────────────────────────────────────────────────────────
    //
    parentPort.postMessage({ preview: { content: {}, styles: {} }, ok: 1 });
  }
} catch (err) {
  parentPort.postMessage({ document: null, ok: 0, err });
}
//
// ────────────────────────────────────────────────── END CREATE FILE PREVIEW ─────
//

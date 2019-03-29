/**
 * This is a worker script that will be executed using worker_threads as described in the NodeJS documentation: https://nodejs.org/api/worker_threads.html#worker_threads_worker_threads
 * This worker script takes in information about a file and proof, and then returns an object representing the certificate to be created.
 */

// $FlowFixMe
const { workerData, parentPort } = require('worker_threads'); // eslint-disable-line
const Path = require('path');
const Cryptr = require('cryptr');
const qr = require('qr-image');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const { urlEncryptionKey, uri } = workerData;
const cryptr = new Cryptr(urlEncryptionKey);

//
// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────────
//
/**
 * Takes a document object and appends a header to it.
 * @param {*} doc - The document to append the header
 * @param {*} proof - The proof JSON object containing information about the proof.
 * @param {*} file - The file JSON object containing information about the document.
 * @param {*} user - The user JSON object containing information about the owner of the document.
 * @returns A Promise resolving the document object.
 */
function addHeader(doc, file) {
  return new Promise((resolve) => {
    // Add left hand logo
    doc.image(Path.join(__dirname, 'certificate/provenDocsHorizontalLogo@2x.png'), 35, 35, {
      scale: 0.5,
    });
    // Add file name center.
    doc
      .fillColor('#595b60')
      .fontSize(9)
      .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
      .text(file.name, 175, 40, { width: 240, align: 'center', opacity: 0.8 });
    // Add right hand provendocs info
    doc
      .fillColor('#595b60')
      .fontSize(9)
      .font(Path.join(__dirname, 'certificate/Roboto-Medium.ttf'))
      .text('provendocs.com', 415, 35, { width: 140, align: 'right' });
    doc
      .fillColor('#595b60')
      .fontSize(9)
      .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
      .text('info@provendocs.com', 415, 50, { width: 140, align: 'right', opacity: 0.8 });

    // Add underline.
    doc
      .moveTo(35, 70)
      .lineTo(555, 70)
      .strokeOpacity(0.8)
      .strokeColor('#707070')
      .stroke();
    resolve(doc);
  });
}

/**
 * Takes a document object and appends a footer to it.
 * @param {*} doc - The document to append the footer.
 * @param {*} proof - The proof JSON object containing information about the proof.
 * @param {*} file - The file JSON object containing information about the document.
 * @param {*} user - The user JSON object containing information about the owner of the document.
 * @returns A Promise resolving the document object.
 */
function addFooter(doc, file, pageNumber, user) {
  return new Promise((resolve) => {
    const link = cryptr.encrypt(
      `${file._id.toString()}-${user._id}-${file._provendb_metadata.minVersion.toString()}`,
    );
    doc
      .fillColor('#595b60')
      .fontSize(9)
      .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
      .text('Proof of ProvenDocs document ', 35, 700, {
        align: 'left',
        opacity: 0.5,
        continued: true,
      })
      .fillColor('#31b2d4')
      .text(`${file._provendb_metadata.hash}`, {
        link: `${uri}/share/${link}`,
      });
    doc
      .fillColor('#595b60')
      .fontSize(9)
      .font(Path.join(__dirname, 'certificate/Roboto-Regular.ttf'))
      .text(`Page ${pageNumber} of 4`, 475, 700, { align: 'right', opacity: 0.5 });
    resolve(doc);
  });
}

/**
 * Takes a document object and appends the front page.
 * @param {*} doc - The document to append the front page to.
 * @param {*} proof - The proof JSON object containing information about the proof.
 * @param {*} file - The file JSON object containing information about the document.
 * @param {*} user - The user JSON object containing information about the owner of the document.
 * @returns A Promise resolving the document object.
 */
function addFrontPage(doc, proof, file, user) {
  return new Promise((resolve) => {
    // Constant strings.
    const bodyText = `This certificate constitutes proof that a document has been anchored to the bitcoin blockchain as of ${
      file.uploadedAt
    },`
      + ' thereby proving that the document existed in its current form on the date at which the blockchain entry was created.';
    const bodyTextTwo = 'You can use this proof to attest that:';
    const bodyTextThree = '(a) the document has not been altered in any way.';
    const bodyTextFour = '(b) the document existed in its current from on the specified date.';
    const link = cryptr.encrypt(`${file._id}-${user._id}-${file._provendb_metadata.minVersion}`);

    // Add Images
    doc.image(Path.join(__dirname, 'certificate/provenDocsVerticalLogo@2x.png'), 227, 50, {
      scale: 0.5,
    });
    doc.image(Path.join(__dirname, 'certificate/provenDocsSeal@2x.png'), 420, 600, {
      scale: 0.5,
    });

    // Add border
    doc
      .moveTo(25, 25)
      .lineTo(25, 770)
      .lineTo(590, 770)
      .lineTo(590, 25)
      .lineTo(25, 25)
      .strokeOpacity(0.8)
      .strokeColor('#595b60')
      .stroke();

    // Add generic text elements
    doc
      .fillColor('#595b60')
      .fontSize(25)
      .font(Path.join(__dirname, 'certificate/Roboto-Regular.ttf'))
      .text('Certificate of Blockchain Proof', 207, 250, { width: 190, align: 'center' });
    doc
      .fillColor('#595b60')
      .fontSize(12)
      .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
      .text(bodyText, 135, 450, { width: 350, align: 'center', opacity: 0.8 });
    doc
      .fillColor('#595b60')
      .fontSize(12)
      .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
      .text(bodyTextTwo, 205, 520, { width: 350, align: 'left', opacity: 0.8 });
    doc
      .fillColor('#595b60')
      .fontSize(12)
      .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
      .text(bodyTextThree, 165, 545, { width: 350, align: 'left', opacity: 0.8 });
    doc
      .fillColor('#595b60')
      .fontSize(12)
      .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
      .text(bodyTextFour, 130, 560, { width: 350, align: 'left', opacity: 0.8 });

    // Add Document Name and User
    const userString = `${user.name} (${user.provider} user: `;
    doc
      .fillColor('#58595b')
      .fontSize(14)
      .font(Path.join(__dirname, 'certificate/Roboto-Regular.ttf'))
      .text(file.name, 135, 350, { width: 350, align: 'center' });
    doc.moveDown();
    doc
      .fillColor('#595b60')
      .fontSize(12)
      .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
      .text(`${userString} `, {
        align: 'left',
        opacity: 0.8,
        continued: true,
      })
      .fillColor('#31b2d4')
      .text(`${user.email})`, {
        link: `mailto:${user.email}`,
      });

    // Add Footer Link
    const footerString = 'An online version of this proof can be found at:';
    doc
      .fillColor('#595b60')
      .fontSize(8)
      .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
      .text(footerString, 58, 725, {
        height: 50,
        width: 240,
        align: 'left',
        opacity: 0.8,
      });
    doc
      .fillColor('#31b2d4')
      .fontSize(8)
      .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
      .text(`${uri}/share/${link}`, 58, 735, {
        height: 50,
        width: 350,
        align: 'left',
        opacity: 0.8,

        link: `${uri}/share/${link}`,
      });

    // Create QR Code:
    const qrSVG = qr.imageSync(`${uri}/share/${link}`, {
      type: 'png',
      size: 2,
      margin: 0,
    });
    doc.image(qrSVG, 58, 610, { scale: 1 });

    resolve(doc);
  });
}

/**
 * Takes a document object and appends the second page.
 * @param {*} doc - The document to append the second page to.
 * @param {*} proof - The proof JSON object containing information about the proof.
 * @param {*} file - The file JSON object containing information about the document.
 * @param {*} user - The user JSON object containing information about the owner of the document.
 * @returns A Promise resolving the document object.
 */
function addSecondPage(doc, proof, file, user) {
  return new Promise((resolve) => {
    const link = cryptr.encrypt(`${file._id}-${user._id}-${file._provendb_metadata.minVersion}`);

    // First add a new page.
    doc.addPage();

    // Add Header.
    addHeader(doc, file).then((newDoc) => {
      // UTC Timestamp conversion
      const uploadDate = new Date(Date.parse(file.uploadedAt));
      const finalUploadDate = uploadDate.toISOString().replace(/[-:.Z]/g, '');

      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .text(`The document was uploaded by ${user.name} (${user.provider} user: `, 35, 91, {
          align: 'left',
          opacity: 0.8,
          continued: true,
        })
        .fillColor('#31b2d4')
        .text(`${user.email})`, { continued: true })
        .fillColor('#595b60')
        .text(' at ', { continued: true })
        .fillColor('#31b2d4')
        .text(`${file.uploadedAt}`, {
          link: `https://www.timeanddate.com/worldclock/converter.html?iso=${finalUploadDate}&p1=1440&p2=152&p3=136&p4=179&p5=137&p6=33&p7=248`,
        });
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .font(Path.join(__dirname, 'certificate/Roboto-Bold.ttf'))
        .fontSize(12)
        .text('Details of the document being proved');
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('The document name when hashed was ', { continued: true })
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .text(`"${file.name}"`, {});
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('You can view a copy of this document ', { continued: true })
        .fillColor('#31b2d4')
        .text('here', {
          link: `${uri}/share/${link}`,
        });
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('(permissions may be required to view the document)');
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('The cryptographic hash of the document is:');
      newDoc
        .fillColor('#595b60')
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .fontSize(10)
        .text(file._provendb_metadata.hash, {});
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .text('See Schedule 1 for details of the hashing algorithm employed.');
      newDoc.moveDown();
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .font(Path.join(__dirname, 'certificate/Roboto-Bold.ttf'))
        .fontSize(12)
        .text('Blockchain proof details');
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('The document hash was included within the', { continued: true })
        .fillColor('#31b2d4')
        .text(' Chainpoint', { continued: true, link: 'https://chainpoint.org' })
        .fillColor('#595b60')
        .text(' proof at', {});
      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(`${proof.details.protocol.chainpointLocation}`, {
          link: `${proof.details.protocol.chainpointLocation}`,
        });
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .text('See Schedule 2 for a detailed cryptographic proof.');
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('The Chainpoint proof was anchored to the bitcoin blockchain at block ', {
          continued: true,
        })
        .fillColor('#31b2d4')
        .text(`${proof.documentProof.btcBlockNumber} `, {
          continued: true,

          link: `https://live.blockcypher.com/btc/block/${proof.documentProof.btcBlockNumber}/`,
        })
        .fillColor('#595b60')
        .text('in bitcoin transaction', {});

      // UTC Timestamp conversion
      const date = new Date(Date.parse(proof.submitted));
      const newFinalDate = date.toISOString().replace(/[-:.Z]/g, '');

      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(`${proof.documentProof.btcTransaction}`, {
          continued: true,

          link: `https://live.blockcypher.com/btc/tx/${proof.documentProof.btcTransaction}/`,
        })
        .fillColor('#595b60')
        .text(' at UTC: ', { continued: true })
        .fillColor('#31b2d4')
        .text(`${date.toISOString()}`, {
          link: `https://www.timeanddate.com/worldclock/converter.html?iso=${newFinalDate}&p1=1440&p2=152&p3=136&p4=179&p5=137&p6=33&p7=248`,
        });

      newDoc.moveDown();
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .font(Path.join(__dirname, 'certificate/Roboto-Bold.ttf'))
        .fontSize(12)
        .text('Summary', {
          align: 'left',
        });
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('The document ', { continued: true })
        .fillColor('#595b60')
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .text(`${file.name} `, { continued: true })
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .fillColor('#595b60')
        .text(' with hash value', {});
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .text(`${file._provendb_metadata.hash}`, { continued: true })
        .fillColor('#595b60')
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(' was anchored to the bitcoin blockchain', {});

      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(`by ${user.name} (${user.provider} user: `, { continued: true })
        .fillColor('#31b2d4')
        .text(user.email, { continued: true, link: `mailto:${user.email}` })
        .fillColor('#595b60')
        .text(') at UTC: ', { continued: true })
        .fillColor('#31b2d4')
        .text(`${file.uploadedAt}`, {
          continued: true,

          link: `https://www.timeanddate.com/worldclock/converter.html?iso=${finalUploadDate}&p1=1440&p2=152&p3=136&p4=179&p5=137&p6=33&p7=248`,
        })
        .fillColor('#595b60')
        .text(
          '. Providing that the document continues to hash to that value, you can be certain that the document existed in its current form on or before that date.',
          {},
        );
      newDoc.image(Path.join(__dirname, 'certificate/provenDocsIcon@2x.png'), 190, 285, {
        scale: 0.5,
      });
      addFooter(newDoc, file, 2, user).then((doc2) => {
        resolve(doc2);
      });
    });
  });
}

/**
 * Takes a document object and appends the third page.
 * @param {*} doc - The document to append the third page to.
 * @param {*} proof - The proof JSON object containing information about the proof.
 * @param {*} file - The file JSON object containing information about the document.
 * @returns A Promise resolving the document object.
 */
function addThirdPage(doc, proof, file, user, proofBinary) {
  return new Promise((resolve) => {
    const link = cryptr.encrypt(`${file._id}-${user._id}-${file._provendb_metadata.minVersion}`);
    doc.addPage();
    addHeader(doc, file).then((newDoc) => {
      newDoc.moveTo(35, 85);
      newDoc
        .fillColor('#595b60')
        .font(Path.join(__dirname, 'certificate/Roboto-Bold.ttf'))
        .fontSize(12)
        .text('Schedule 1: Document hashing', 35, 85);
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('The document hash of ', { continued: true })
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .text(`${file._provendb_metadata.hash}`, {});
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('was obtained by performing a ', { continued: true })
        .fillColor('#31b2d4')
        .text('SHA-2 256 bit ', {
          continued: true,
          link: 'https://en.wikipedia.org/wiki/SHA-2',
        })
        .fillColor('#595b60')
        .text('hash on the document ', {});
      newDoc
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .fillColor('#31b2d4')
        .text('here', {
          continued: true,
          link: `https://provendocs/share/${link}`,
        })
        .fillColor('#595b60')
        .text(' (permission may be required to view this document).', {});
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(
          'The hash was calculated on the document and its metadata as stored in the ProvenDocs system.',
        );
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(
          'You can download a copy of the document and its metadata (permissions required) here',
        );
      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('here', {
          continued: true,
          link: `https://provendocs/share/${link}`,
        })
        .fillColor('#595b60')
        .text('You can independently validate the hash by using the', {});
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('open source hash validation tool at ', { continued: true })
        .fillColor('#31b2d4')
        .text(`${uri}/downloads/validateHash.`, {
          continued: true,
          link: `${uri}/downloads/validateHash`,
        })
        .fillColor('#595b60')
        .text('You can also extract the', {});
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('document from its metadata using this tool.');
      newDoc.moveDown();
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .font(Path.join(__dirname, 'certificate/Roboto-Bold.ttf'))
        .fontSize(12)
        .text('Schedule 2: Chainpoint proof');
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(
          'Chainpoint is an open standard for linking data to the public blockchain. It aggregates multiple hash values into a single',
        );
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(
          'hash value which is then placed on the blockchain. The following chainpoint proof proves that the hash value of',
        );
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .text(`${file._provendb_metadata.hash}`, {});
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(
          'is associated with the chainpoint proof placed on the bitcoin blockchain in transaction',
        );
      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(`${proof.documentProof.btcTransaction}`, {
          link: `https://live.blockcypher.com/btc/tx/${proof.documentProof.btcTransaction}/`,
        });
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .text('This proof can be downloaded (permissions required) ', { continued: true })
        .fillColor('#31b2d4')
        .text('here', {
          link: `${uri}/share/${link}`,
        });
      newDoc.moveDown();
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .font(Path.join(__dirname, 'certificate/Roboto-Bold.ttf'))
        .fontSize(12)
        .text('Below is a binary representation of the Blockchain proof');
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(8)
        .font(Path.join(__dirname, 'certificate/Roboto-LightItalic.ttf'))
        .text(proofBinary, {
          width: 500,
          align: 'justify',
        });
      newDoc.image(Path.join(__dirname, 'certificate/provenDocsIcon@2x.png'), 190, 285, {
        scale: 0.5,
      });
      addFooter(newDoc, file, 3, user).then((doc2) => {
        resolve(doc2);
      });
    });
  });
}

/**
 * Takes a document object and appends the fourth page.
 * @param {*} doc - The document to append the fourth page to.
 * @param {*} proof - The proof JSON object containing information about the proof.
 * @param {*} file - The file JSON object containing information about the document.
 * @returns A Promise resolving the document object.
 */
function addFourthPage(doc, proof, file, user) {
  return new Promise((resolve) => {
    const link = cryptr.encrypt(`${file._id}-${user._id}-${file._provendb_metadata.minVersion}`);
    doc.addPage();
    addHeader(doc, file).then((newDoc) => {
      newDoc.moveTo(35, 85);
      newDoc
        .fillColor('#595b60')
        .font(Path.join(__dirname, 'certificate/Roboto-Bold.ttf'))
        .fontSize(12)
        .text('Schedule 3: List of printable links in the document', 35, 85);
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('Document being proven:');
      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(`${uri}/share/${link}`, {
          link: `${uri}/share/${link}`,
        });
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('Chainpoint.org:');
      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('https://chainpoint.org', { link: 'https://chainpoint.org' });
      newDoc.image(Path.join(__dirname, 'certificate/provenDocsIcon@2x.png'), 190, 285, {
        scale: 0.5,
      });
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('Chainpoint proof for the document:');
      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(`https://provendocs/share/${link}`, {
          link: `https://provendocs/share/${link}`,
        });
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('Chainpoint calendar entry for the proven document:');
      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(proof.details.protocol.chainpointLocation, {
          link: proof.details.protocol.chainpointLocation,
        });
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('Bitcoin block containing the proof:');
      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(`https://live.blockcypher.com/btc/block/${proof.documentProof.btcBlockNumber}`, {
          link: `https://live.blockcypher.com/btc/block/${proof.documentProof.btcBlockNumber}`,
        });
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('Blockchain transaction:');
      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(`https://live.blockcypher.com/btc/tx/${proof.documentProof.btcTransaction}`, {
          link: `https://live.blockcypher.com/btc/tx/${proof.documentProof.btcTransaction}`,
        });
      newDoc.moveDown();
      newDoc
        .fillColor('#595b60')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text('Open source validation tool:');
      newDoc
        .fillColor('#31b2d4')
        .fontSize(10)
        .font(Path.join(__dirname, 'certificate/Roboto-Light.ttf'))
        .text(`${uri}/downloads/validateHash`, {
          link: `${uri}/downloads/validateHash`,
        });
      addFooter(newDoc, file, 3, user).then((doc2) => {
        resolve(doc2);
      });
    });
  });
}
//
// ───────────────────────────────────────────────────── END HELPER FUNCTIONS ─────
//
//
// ─── CREATE CERTIFICATE ─────────────────────────────────────────────────────────
//
const {
  path, proof, file, user, binaryProof,
} = workerData;

try {
  // Setup cert.
  const document = new PDFDocument();
  const writeStream = fs.createWriteStream(path);
  document.pipe(writeStream);

  writeStream.on('close', () => {
    parentPort.postMessage({ message: 'Certificate Created.', ok: 1 });
  });
  writeStream.on('finish', () => {
    parentPort.postMessage({ message: 'Certificate Created.', ok: 1 });
  });

  // Create certificate.
  addFrontPage(document, proof, file, user).then((doc2) => {
    addSecondPage(doc2, proof, file, user).then((doc3) => {
      addThirdPage(doc3, proof, file, user, binaryProof).then((doc4) => {
        addFourthPage(doc4, proof, file, user).then(() => {
          document.end();
        });
      });
    });
  });
} catch (err) {
  parentPort.postMessage({ document: null, ok: 0, err });
}
//
// ─────────────────────────────────────────────────── END CREATE CERTIFICATE ─────
//

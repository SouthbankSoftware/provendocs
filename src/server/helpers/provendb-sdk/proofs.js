// @Flow
type getDocumentProofParams = {
  collection: string;
  filter: Object | null;
  provenDbId: string | null;
  version: number;
  format: 'json' | 'binary';
};

/**
 * Wrapper function for getting a document proof.
 *
 * @param {MongoClient} mongoClient - The MongoClient object for executing the
 * @param {getDocumentProofParams} parameters - Object containing the parameters.
 *   @param {string} parameters.collection - The collection the document exists in.
 *   NOTE: Only one of (filter | provenDbId) should be provided.
 *   @param {Object} parameters.filter - The filter applied for finding the select document.
 *   @param {string} parameters.provenDbId - The provenDbID value of the document.
 *   @param {'json' | 'binary'} parameters.format - The format of the returned proof.
 * @returns {Promise} - A promise resolving the result of the command.
 * @returns {Promise} - A promise rejecting with a sanitization error or a mongodb error.
 */
export const getDocumentProof = (mongoClient: Object, parameters: getDocumentProofParams) => new Promise((resolve, reject) => {
  // Sanitization of parameters:
  if (parameters.filter && parameters.provenDbId) {
    reject(
      new Error({
        message:
            'getDocumentProof can only contain one of parameters.filter and parameters.provenDbId',
      }),
    );
  } else if (
    !parameters.collection
      || !parameters.version
      || (!parameters.filter && !parameters.provenDbId)
  ) {
    reject(
      new Error({
        message:
            'getDocumentProof has the following required parameters [collection, (filter | provenDbId), version, format]',
      }),
    );
  } else if (!mongoClient) {
    reject(
      new Error({
        message: 'getDocumentProof requires a connected mongoClient.',
      }),
    );
  }

  // Execution of command
  mongoClient.command(
    {
      getDocumentProof: parameters,
    },
    (getProofError, getProofResult) => {
      if (getProofError) {
        reject(new Error({ message: 'Error getting proof: ', getProofError }));
      } else {
        resolve(getProofResult);
      }
    },
  );
});

export const getProof = (mongoClient: Object, parameters: getDocumentProofParams) => new Promise((resolve, reject) => {
  mongoClient.command(
    {
      getDocumentProof: parameters,
    },
    (getProofError, getProofResult) => {
      if (getProofError) {
        reject(new Error({ message: 'Error getting proof: ', getProofError }));
      } else {
        resolve(getProofResult);
      }
    },
  );
});

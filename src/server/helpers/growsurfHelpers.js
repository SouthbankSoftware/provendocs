import CryptoJS from 'crypto-js';
/**
 * Compares the GrowSurf header provided signature against the expected
 * signature.
 *
 * @param {Object} body the request body provided by GrowSurf
 * @param {String} signature the signature hash value provided within the header of the request
 * @returns {Boolean} valid true if the expected matches the given
 * @throws {Exception} thrown if the expected signature value does not match the given
 */
const validateSignature = function (body, signature) {
  // Extract
  const parts = signature.split(',');
  // t value
  const timestamp = parts[0].split('=')[1];
  // v value
  const hash = parts[1].split('=')[1];
  // Generate hash
  const message = `${timestamp}.${JSON.stringify(body)}`;
  const expected = CryptoJS.HmacSHA256(message, process.env.GROWSURF_SECRET).toString();

  // Validate/Compare
  if (expected === hash) {
    return true;
  }
  throw new Error('Invalid Signature');
};

export default validateSignature;

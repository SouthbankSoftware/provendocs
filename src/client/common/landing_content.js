/* @flow
 * provendocs
 * Copyright (C) 2019  Southbank Software Ltd.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * @Author: Michael Harrison
 * @Date:   2019-03-29T10:46:51+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-03T09:18:20+11:00
 */
const HOW_DOES_IT_WORK_STEPS = [
  {
    title: 'The Blockchain',
    content:
      'Information stored on the public blockchain is immutable - '
      + 'it cannot be changed or deleted. By storing cryptographic signatures'
      + ' of the contents of your document on the blockchain, we can prove that'
      + ' the document existed at a specific time and that you uploaded it.',
  },
  {
    title: 'Document Proofs',
    content:
      'This proof is mathematically indisputable and is increasingly recognized in legislation,'
      + ' making it a powerful asset in court. We will provide you with all the information'
      + ' (simplified in clear language) and steps required to prove your document with or without'
      + ' ProvenDocs.',
  },
  {
    title: 'Security',
    content:
      'Only the cryptographic signature (hash) is stored on the public blockchain and'
      + ' cannot be used to view your document contents. Your document is stored securely'
      + ' in the ProvenDocs database and cannot be viewed by anyone without your permission.',
  },
];
export default HOW_DOES_IT_WORK_STEPS;

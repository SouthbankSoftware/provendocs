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

import 'regenerator-runtime/runtime'; // This is required to support Async function without using babel/polyfill
import _ from 'lodash';
import axios from 'axios';
import { DOMAINS } from './constants';

export default {
  checkStatus: () => new Promise<void>((resolve, reject) => {
    axios
      .get('/api/serviceUrls')
      .then((result) => {
        if (result.data) {
          DOMAINS.ID = result.data.ID;
          DOMAINS.PROVENDOCS = result.data.PROVENDOCS;
          DOMAINS.API = result.data.API;
        } else {
          reject(new Error('Failed to fetch service URLs'));
        }
        axios
          .get('/api/checkStatus')
          .then((checkStatusResult) => {
            resolve(checkStatusResult);
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  }),
  getServiceUrls: () => axios.get('/api/serviceUrls'),
  createUser: (name: string, email: string, password: string, activated: boolean) => axios.post('/api/createUser', {
    name,
    email,
    password,
    activated,
  }),
  updateUser: (id: string, name: string, gender: string, language: string) => axios.post('/api/updateUser', {
    id,
    name,
    gender,
    language,
  }),
  authUser: (email: string, password: string) => axios.post('/api/authUser', {
    email,
    password,
  }),
  sendVerificationEmail: (toEmail: string, verifyLink: string) => axios.post('/api/sendVerifyEmail', {
    toEmail,
    verifyLink,
  }),
  resendVerificationEmail: (toEmail: string) => axios.post('/api/resendVerifyEmail', {
    toEmail,
  }),
  resetPassword: (email: string) => axios.post('/api/resetPassword', {
    email,
  }),
  getNumberOfFileVersions: (fileId: string) => axios.get(`/api/numFileVersions/${fileId}`),
  getFileHistoryForUser: (fileName: string) => axios.get(`/api/fileHistory/${fileName}`),
  getFileListForUser: () => axios.get('/api/fileList'),
  getFileSizeForUser: () => axios.get('/api/filesSize'),
  uploadFiles: (
    fileData: Array<Object>,
    force: boolean,
    comment: string,
    commentTags: Array<string>,
  ) => {
    const fd = new FormData();
    _.forEach(fileData, (file) => {
      if (file) {
        fd.append('files[]', file, file.originalname);
      }
    });
    fd.append('force', force.toString());
    fd.append('tags', commentTags.join());
    fd.append('comment', comment);
    return axios.post('/api/upload', fd);
  },
  uploadNewVersions: (fileData: Array<Object>, comment: string, commentTags: Array<string>) => {
    const fd = new FormData();
    _.forEach(fileData, (file) => {
      if (file) {
        fd.append('files[]', file, file.originalname);
      }
    });
    fd.append('tags', commentTags.join());
    fd.append('comment', comment);
    return axios.post('/api/uploadNewVersion', fd);
  },
  getFilePreviewForUser: (fileId: string) => axios.get(`/api/filePreview/${fileId}`),
  getFullFileForUser: (fileId: string) => axios.get(`/api/fullFilePreview/${fileId}`),
  getFullFileForUserFromHistory: (fileName: string, version: number) => axios.get(`/api/fullFileFromHistory/${fileName}/${version}`),
  getProofForUser: (fileId: string) => axios.get(`/api/proof/${fileId}`),
  getHistoricalProofInfoForUser: (fileName: string, version: number) => axios.get(`/api/historicalProofInfo/${fileName}/${version}`),
  getHistoricalFileId: (fileName: string, fileVersion: number) => axios.get(`api/historicalFileId/${fileName}/${fileVersion}`),
  downloadProofArchiveForFile: (fileName: string, version: number) => window.open(`/api/util/getArchive/${fileName}/${version}`),
  downloadFile: (file: Object) => window.open(`/api/file/inline/${file._id}#view=fitH`),
  downloadHistoricalFile: (fileName: string, version: number) => window.open(`/api/historicalFile/download/${fileName}/${version}`),
  getListOfDuplicates: (fileList: Array<Object>) => {
    const fd = [];
    _.forEach(fileList, (file) => {
      if (file) {
        fd.push({ originalname: file.name });
      }
    });
    return axios.post('/api/getListOfDuplicates', fd);
  },
  getShareStatus: (fileId: string, version: number) => axios.get(`/api/getShareStatus/${fileId}/${version}`),
  clearShareStatus: (fileId: string, version: number, type: string) => axios.get(`/api/clearShareStatus/${fileId}/${version}/${type}`),
  createShareEmail: (fileId: string, version: number, emailList: Array<string>) => axios.post(`/api/createShareEmail/${fileId}/${version}`, emailList),
  createShareLink: (fileId: string, version: number) => axios.get(`/api/createShareLink/${fileId}/${version}`),
  checkSharedAccess: (link: string) => axios.get(`/api/checkSharedAccess/${link}`),
  getSharedFile: (link: string) => axios.get(`/api/getSharedFile/${link}`),
  getSharedProof: (link: string) => axios.get(`/api/getSharedProof/${link}`),
  forgetFile: (file: Object) => axios.get(`/api/forgetFile/${file._id}`),
  sendEmailProof: (fileName: string, version: string | number, toEmail: string) => axios.get(`/api/sendEmailProof/${fileName}/${version}/${toEmail}`),
  postEmailSubscribe: (values: Object) => axios.post('/api/sendConfirmation', values),
  deleteAccount: () => axios.get('/api/util/deleteAccount'),
  isReferralRequired: () => axios.get('/api/util/isReferralRequired'),
};

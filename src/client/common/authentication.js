/*
 * @Author: Michael Harrison
 * @Date:   2018-12-07T11:42:20+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T15:54:37+11:00
 */
import axios from 'axios';

export const checkAuthentication = () => axios.get('/api/authenticate');
export const getUserDetails = () => axios.get('/api/getUserDetails');
export const logout = () => axios.get('/api/logout');

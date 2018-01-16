/**
 * Created by Andy Likuski on 2018.01.11
 * Copyright (c) 2018 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import GoogleSpreadsheets from 'google-spreadsheets';
import google from 'googleapis';
import Task from 'data.task';

const clientAuth = {
  "web":
    {
      "client_id": "521774367161-fs2t4hikkpsqmsp149l64a8dtih18id3.apps.googleusercontent.com",
      "project_id": "hip-orbit-191818",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://accounts.google.com/o/oauth2/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_secret": "-tZFuFr3mYITZyFM1e1rL4WC",
      "redirect_uris": ["http://localhost:3000/oauth2callback"],
      "javascript_origins": ["http://localhost:3000"]
    }
};

const oauth2Client = new google.auth.OAuth2(clientAuth.web.client_id, clientAuth.web.client_secret, clientAuth.web.redirect_uris[0]);
// Assuming you already obtained an OAuth2 token that has access to the correct scopes somehow...
/*
oauth2Client.setCredentials({
  access_token: ACCESS_TOKEN,
  refresh_token: REFRESH_TOKEN
});
*/

export const loadSpreadsheet = key => {
  return new Task((reject, resolve) => {
    return GoogleSpreadsheets({
      key,
      auth: oauth2Client
    }, (err, spreadsheet) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(spreadsheet);
      }
    });
  });
};

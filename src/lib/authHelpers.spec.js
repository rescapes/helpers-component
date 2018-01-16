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

import {loadSpreadsheet} from 'helpers/authHelpers';

const publishedUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSoIoERtsGlNhJfKUlCpTRt1RUOVo66C5NrCXyDrlZw5zXbuy2JkkU2p6oQCvlT5GS4iGN3dUvjklO_/pubhtml'
describe('authHelpers', () => {
  test('loadSpreadsheet', () => {
    loadSpreadsheet('1rnyHarvMFhSmC1bsmfvxQxF2X8DzmUwpU0Jsu0ZssF0').fork(
      error => {
        throw error

      },
      spreadsheet => {
        spreadsheet.worksheets[0].cells(
          {range: 'R1C1:R5C5'},
          (err, cells) => {
            // Cells will contain a 2 dimensional array with all cell data in the
            // range requested.
          });
      }
    );
  });
});
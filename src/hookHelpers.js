/**
 * Created by Andy Likuski on 2020.10.19
 * Copyright (c) 2020 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import _React from "react";
const {useState, useEffect, default: React} = _React

//https://rangle.io/blog/simplifying-controlled-inputs-with-hooks/
/**
 * React to changers on input
 * @param initialValue
 * @returns {{onChange: React.DOMAttributes.onChange, setValue: (value: unknown) => void, reset: (function(): void), value: unknown}}
 */
export const useInput = initialValue => {
  const [value, setValue] = useState(initialValue);

  return {
    value,
    setValue,
    reset: () => setValue(""),
    onChange: event => {
      setValue(event.target.value);
    }
  };
};

/**
 * Simple state holder for whether a popup is open. This could become more complex later
 * @param {Boolean} isOpen pass true if the state is initially open, else false
 * @returns {[]}
 */
export function usePopupState(isOpen) {
  const [popupState, setPopupState] = useState(isOpen);
  return [popupState, setPopupState];
}

/**
 * https://stackoverflow.com/questions/36862334/get-viewport-window-height-in-reactjs
 * @returns {{width: number, height: number}}
 */
const getWindowDimensions = () => {
  const {innerWidth: width, innerHeight: height} = window;
  return {
    width,
    height
  };
};

/**
 * React Hook to respond to browser window dimensions
 * @returns {{width: number, height: number}}
 */
export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}
/**
 * HMR binary data are consist with two section: emit JSON and emit files:
 *
 * | field                | byte                 | type     |     // emit JSON:
 * |----------------------|----------------------|----------|
 * | lenOfContentLength   | 1                    | UInt8    |
 * | JSONContentLength    | lenOfContentLength   | UInt8    |
 * | JSONContent          | JSONContentLength    | Buffer   |
 * | fileNum              | 1                    | UInt8    |     // emit files
 * | lenOfFname_i         | 1                    | UInt8    |
 * | fileName_i           | lenOfFname_i         | String   |
 * | lenOfContentLength_i | 1                    | UInt8    |
 * | fileContentLength_i  | lenOfContentLength_i | UInt8    |
 * | fileContent_i        | fileContentLength_i  | Buffer   |
 */

export { encodeHMRData } from './encode';
export { decodeHMRData } from './decode';

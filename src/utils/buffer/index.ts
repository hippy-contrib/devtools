/**
 * 文件 Buffer 协议
 * | field                | byte                 | type     |
 * |----------------------|----------------------|----------|
 * | isFile               | 1                    | UInt8: 1 |
 * | fileNum              | 1                    | UInt8    |
 * | lenOfFname_1         | 1                    | UInt8    |
 * | fileName_1           | lenOfFname_1         | String   |
 * | lenOfContentLength_1 | 1                    | UInt8    |
 * | fileContentLength_1  | lenOfContentLength_1 | UInt8    |
 * | fileContent_1        | fileContentLength_1  | Buffer   |
 * | lenOfFname_2         | 1                    | UInt8    |
 * | fileName_2           | lenOfFname_2         | String   |
 * | lenOfContentLength_2 | 1                    | UInt8    |
 * | fileContentLength_2  | lenOfContentLength_2 | UInt8    |
 * | fileContent_2        | fileContentLength_2  | Buffer   |
 * 
 * JSON Buffer 协议
 * | field              | byte               | type     |
 * |--------------------|--------------------|----------|
 * | isFile             | 1                  | UInt8: 0 |
 * | lenOfContentLength | 1                  | UInt8    |
 * | JSONContentLength  | lenOfContentLength | UInt8    |
 * | JSONContent        | JSONContentLength  | Buffer   |
 */
export { encodeHMRData } from './encode';
export { decodeHMRData } from './decode';
// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
export class WasmDisassembly {
    offsets;
    functionBodyOffsets;
    constructor(offsets, functionBodyOffsets) {
        this.offsets = offsets;
        this.functionBodyOffsets = functionBodyOffsets;
    }
    get lineNumbers() {
        return this.offsets.length;
    }
    bytecodeOffsetToLineNumber(bytecodeOffset) {
        let l = 0, r = this.offsets.length - 1;
        while (l <= r) {
            const m = Math.floor((l + r) / 2);
            const offset = this.offsets[m];
            if (offset < bytecodeOffset) {
                l = m + 1;
            }
            else if (offset > bytecodeOffset) {
                r = m - 1;
            }
            else {
                return m;
            }
        }
        return l;
    }
    lineNumberToBytecodeOffset(lineNumber) {
        return this.offsets[lineNumber];
    }
    /**
     * returns an iterable enumerating all the non-breakable line numbers in the disassembly
     */
    *nonBreakableLineNumbers() {
        let lineNumber = 0;
        let functionIndex = 0;
        while (lineNumber < this.lineNumbers) {
            if (functionIndex < this.functionBodyOffsets.length) {
                const offset = this.lineNumberToBytecodeOffset(lineNumber);
                if (offset >= this.functionBodyOffsets[functionIndex].start) {
                    lineNumber = this.bytecodeOffsetToLineNumber(this.functionBodyOffsets[functionIndex++].end);
                    continue;
                }
            }
            yield lineNumber++;
        }
    }
}
//# sourceMappingURL=WasmDisassembly.js.map
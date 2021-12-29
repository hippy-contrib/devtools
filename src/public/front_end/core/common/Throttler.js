// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
export class Throttler {
    timeout;
    isRunningProcess;
    asSoonAsPossible;
    process;
    lastCompleteTime;
    schedulePromise;
    scheduleResolve;
    processTimeout;
    constructor(timeout) {
        this.timeout = timeout;
        this.isRunningProcess = false;
        this.asSoonAsPossible = false;
        this.process = null;
        this.lastCompleteTime = 0;
        this.schedulePromise = new Promise(fulfill => {
            this.scheduleResolve = fulfill;
        });
    }
    _processCompleted() {
        this.lastCompleteTime = this._getTime();
        this.isRunningProcess = false;
        if (this.process) {
            this._innerSchedule(false);
        }
        this._processCompletedForTests();
    }
    _processCompletedForTests() {
        // For sniffing in tests.
    }
    _onTimeout() {
        delete this.processTimeout;
        this.asSoonAsPossible = false;
        this.isRunningProcess = true;
        Promise.resolve()
            .then(this.process)
            .catch(console.error.bind(console))
            .then(this._processCompleted.bind(this))
            .then(this.scheduleResolve);
        this.schedulePromise = new Promise(fulfill => {
            this.scheduleResolve = fulfill;
        });
        this.process = null;
    }
    schedule(process, asSoonAsPossible) {
        // Deliberately skip previous process.
        this.process = process;
        // Run the first scheduled task instantly.
        const hasScheduledTasks = Boolean(this.processTimeout) || this.isRunningProcess;
        const okToFire = this._getTime() - this.lastCompleteTime > this.timeout;
        asSoonAsPossible = Boolean(asSoonAsPossible) || (!hasScheduledTasks && okToFire);
        const forceTimerUpdate = asSoonAsPossible && !this.asSoonAsPossible;
        this.asSoonAsPossible = this.asSoonAsPossible || asSoonAsPossible;
        this._innerSchedule(forceTimerUpdate);
        return this.schedulePromise;
    }
    _innerSchedule(forceTimerUpdate) {
        if (this.isRunningProcess) {
            return;
        }
        if (this.processTimeout && !forceTimerUpdate) {
            return;
        }
        if (this.processTimeout) {
            this._clearTimeout(this.processTimeout);
        }
        const timeout = this.asSoonAsPossible ? 0 : this.timeout;
        this.processTimeout = this._setTimeout(this._onTimeout.bind(this), timeout);
    }
    _clearTimeout(timeoutId) {
        clearTimeout(timeoutId);
    }
    _setTimeout(operation, timeout) {
        return window.setTimeout(operation, timeout);
    }
    _getTime() {
        return window.performance.now();
    }
}

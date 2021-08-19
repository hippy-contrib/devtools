// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable rulesdir/no_underscored_properties */
import * as TextUtils from '../../models/text_utils/text_utils.js';
import { CSSQuery } from './CSSQuery.js';
export class CSSMediaQuery {
    _active;
    _expressions;
    constructor(payload) {
        this._active = payload.active;
        this._expressions = [];
        for (let j = 0; j < payload.expressions.length; ++j) {
            this._expressions.push(CSSMediaQueryExpression.parsePayload(payload.expressions[j]));
        }
    }
    static parsePayload(payload) {
        return new CSSMediaQuery(payload);
    }
    active() {
        return this._active;
    }
    expressions() {
        return this._expressions;
    }
}
export class CSSMediaQueryExpression {
    _value;
    _unit;
    _feature;
    _valueRange;
    _computedLength;
    constructor(payload) {
        this._value = payload.value;
        this._unit = payload.unit;
        this._feature = payload.feature;
        this._valueRange = payload.valueRange ? TextUtils.TextRange.TextRange.fromObject(payload.valueRange) : null;
        this._computedLength = payload.computedLength || null;
    }
    static parsePayload(payload) {
        return new CSSMediaQueryExpression(payload);
    }
    value() {
        return this._value;
    }
    unit() {
        return this._unit;
    }
    feature() {
        return this._feature;
    }
    valueRange() {
        return this._valueRange;
    }
    computedLength() {
        return this._computedLength;
    }
}
export class CSSMedia extends CSSQuery {
    source;
    sourceURL;
    mediaList;
    static parseMediaArrayPayload(cssModel, payload) {
        return payload.map(mq => new CSSMedia(cssModel, mq));
    }
    constructor(cssModel, payload) {
        super(cssModel);
        this.reinitialize(payload);
    }
    reinitialize(payload) {
        this.text = payload.text;
        this.source = payload.source;
        this.sourceURL = payload.sourceURL || '';
        this.range = payload.range ? TextUtils.TextRange.TextRange.fromObject(payload.range) : null;
        this.styleSheetId = payload.styleSheetId;
        this.mediaList = null;
        if (payload.mediaList) {
            this.mediaList = [];
            for (let i = 0; i < payload.mediaList.length; ++i) {
                this.mediaList.push(CSSMediaQuery.parsePayload(payload.mediaList[i]));
            }
        }
    }
    active() {
        if (!this.mediaList) {
            return true;
        }
        for (let i = 0; i < this.mediaList.length; ++i) {
            if (this.mediaList[i].active()) {
                return true;
            }
        }
        return false;
    }
}
export const Source = {
    LINKED_SHEET: 'linkedSheet',
    INLINE_SHEET: 'inlineSheet',
    MEDIA_RULE: 'mediaRule',
    IMPORT_RULE: 'importRule',
};
//# sourceMappingURL=CSSMedia.js.map
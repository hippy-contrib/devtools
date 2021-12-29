// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable rulesdir/no_underscored_properties */
export class Tooltip {
    _anchorElement;
    _tooltipLastOpened;
    _tooltipLastClosed;
    static install(element, tooltipContent, _actionId, _options) {
        element.title = tooltipContent || '';
    }
}

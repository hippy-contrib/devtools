// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const styles = new CSSStyleSheet();
styles.replaceSync(
`/*
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

:host {
  flex: auto;
  display: flex;
  min-height: 20px;
}

.settings {
  display: flex;
  flex-wrap: wrap;
  margin: 0 12px 12px 12px;
  column-gap: 45px;
  row-gap: 15px;
}

.value-types-selection {
  display: flex;
  flex-direction: column;
}

.group {
  font-weight: bold;
  margin-bottom: 11px;
}

.type-label {
  white-space: nowrap;
}

.group + .type-label {
  margin-top: 5px;
}

.type-label input {
  margin: 0 6px 0 0;
  padding: 0;
}

.type-label + .type-label {
  margin-top: 6px;
}

/*# sourceURL=valueInterpreterSettings.css */
`);
export default styles;

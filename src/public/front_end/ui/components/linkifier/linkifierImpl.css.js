// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const styles = new CSSStyleSheet();
styles.replaceSync(
`/*
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

.link:link,
.link:visited {
  color: var(--color-link);
  text-decoration: underline;
  cursor: pointer;
}

/*# sourceURL=linkifierImpl.css */
`);
export default styles;

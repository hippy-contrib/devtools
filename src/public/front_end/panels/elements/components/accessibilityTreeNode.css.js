// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const styles = new CSSStyleSheet();
styles.replaceSync(
`.ax-readable-string {
  font-style: italic;
}

.monospace {
  font-family: var(--monospace-font-family);
  font-size: var(--monospace-font-size);
}

/*# sourceURL=accessibilityTreeNode.css */
`);
export default styles;

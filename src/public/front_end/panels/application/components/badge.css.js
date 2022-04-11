// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const styles = new CSSStyleSheet();
styles.replaceSync(
`/*
 * Copyright (c) 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

:host .badge-error {
  --override-adorner-text-color: var(--color-red);
  --override-adorner-border-color: var(--color-red);
}

:host .badge-success {
  --override-adorner-text-color: var(--color-accent-green);
  --override-adorner-border-color: var(--color-accent-green);
}

:host .badge-secondary {
  --override-adorner-text-color: var(--color-text-secondary);
  --override-adorner-border-color: var(--color-text-secondary);
}

/* Use mono-space source code font to assist reading of adorner content */
:host {
  font-family: var(--source-code-font-family);
}

/*# sourceURL=badge.css */
`);
export default styles;

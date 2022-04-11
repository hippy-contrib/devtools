// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const styles = new CSSStyleSheet();
styles.replaceSync(
`/*
 * Copyright (c) 2017 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

:host {
  overflow: auto;
  background-color: var(--color-background-elevation-1);
}

.tree-outline-disclosure {
  max-width: 100%;
  padding-left: 6px;
}

.count {
  flex: none;
  margin: 0 8px;
}

[is=ui-icon] {
  margin: 0 5px;
}

li {
  height: 24px;
}

li .largeicon-navigator-file {
  margin: 0;
}

li .largeicon-navigator-folder {
  margin: -3px -3px 0 -5px;
}

.tree-element-title {
  flex-shrink: 100;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-outline li:hover:not(.selected) .selection {
  display: block;
  background-color: var(--item-hover-color);
}

@media (forced-colors: active) {
  [is=ui-icon].icon-mask {
    background-color: ButtonText;
  }

  .tree-outline li:hover:not(.selected) .selection {
    forced-color-adjust: none;
    background-color: Highlight;
  }

  .tree-outline li:hover .tree-element-title,
  .tree-outline li.selected .tree-element-title,
  .tree-outline li:hover .count,
  .tree-outline li.selected .count {
    forced-color-adjust: none;
    color: HighlightText;
  }

  .tree-outline li:hover [is=ui-icon].icon-mask,
  .tree-outline li.selected [is=ui-icon].icon-mask,
  .tree-outline li.selected:focus .spritesheet-mediumicons:not(.icon-mask) {
    background-color: HighlightText !important; /* stylelint-disable-line declaration-no-important */
  }
}

/*# sourceURL=consoleSidebar.css */
`);
export default styles;

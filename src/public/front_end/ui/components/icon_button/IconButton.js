// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ComponentHelpers from '../../components/helpers/helpers.js';
import * as LitHtml from '../../lit-html/lit-html.js';
import { Icon } from './Icon.js';
import iconButtonStyles from './iconButton.css.js';
export class IconButton extends HTMLElement {
    static litTagName = LitHtml.literal `icon-button`;
    shadow = this.attachShadow({ mode: 'open' });
    clickHandler = undefined;
    groups = [];
    leadingText = '';
    trailingText = '';
    accessibleName;
    set data(data) {
        this.groups = data.groups.map(group => ({ ...group })); // Ensure we make a deep copy.
        this.clickHandler = data.clickHandler;
        this.trailingText = data.trailingText ?? '';
        this.leadingText = data.leadingText ?? '';
        this.accessibleName = data.accessibleName;
        this.render();
    }
    get data() {
        return {
            groups: this.groups.map(group => ({ ...group })),
            accessibleName: this.accessibleName,
            clickHandler: this.clickHandler,
            leadingText: this.leadingText,
            trailingText: this.trailingText,
        };
    }
    setTexts(texts) {
        if (texts.length !== this.groups.length) {
            throw new Error(`Wrong number of texts, expected ${this.groups.length} but got ${texts.length}`);
        }
        for (let i = 0; i < texts.length; ++i) {
            this.groups[i].text = texts[i];
        }
        this.render();
    }
    connectedCallback() {
        this.shadow.adoptedStyleSheets = [iconButtonStyles];
    }
    onClickHandler(event) {
        if (this.clickHandler) {
            event.preventDefault();
            this.clickHandler();
        }
    }
    render() {
        const buttonClasses = LitHtml.Directives.classMap({
            'icon-button': true,
            'with-click-handler': Boolean(this.clickHandler),
        });
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        LitHtml.render(LitHtml.html `
      <button class="${buttonClasses}" @click=${this.onClickHandler} aria-label="${LitHtml.Directives.ifDefined(this.accessibleName)}">
      ${this.leadingText ? LitHtml.html `<span class="icon-button-title">${this.leadingText}</span>` : LitHtml.nothing}
      ${this.groups.filter(counter => counter.text !== undefined).map(counter => LitHtml.html `
      <${Icon.litTagName} class="status-icon"
      .data=${{ iconName: counter.iconName, color: counter.iconColor || '', width: counter.iconWidth || '1.5ex', height: counter.iconHeight || '1.5ex' }}>
      </${Icon.litTagName}>
      <span class="icon-button-title">${counter.text}</span>
      </button>`)}
      ${this.trailingText ? LitHtml.html `<span class="icon-button-title">${this.trailingText}</span>` : LitHtml.nothing}
    `, this.shadow, { host: this });
        // clang-format on
    }
}
ComponentHelpers.CustomElements.defineComponent('icon-button', IconButton);

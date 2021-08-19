// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../../core/i18n/i18n.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as Linkifier from '../../../ui/components/linkifier/linkifier.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import sidebarDeprecationStyles from './sidebarDeprecation.css.js';
const UIStrings = {
    /**
     * @description The main text for the deprecation warning in the Console Sidebar.
     */
    deprecationNotice: 'This sidebar will be removed in a future version of Chrome. If you have feedback, please let us know via the',
    /**
      * @description the clickable text to take the user to the CRBug to give feedback.
      */
    issueTrackerLinkText: 'issue tracker',
};
const str_ = i18n.i18n.registerUIStrings('panels/console/components/SidebarDeprecation.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class SidebarDeprecation extends HTMLElement {
    static litTagName = LitHtml.literal `devtools-console-sidebar-deprecation`;
    shadow = this.attachShadow({ mode: 'open' });
    renderBound = this.render.bind(this);
    connectedCallback() {
        this.shadow.adoptedStyleSheets = [sidebarDeprecationStyles];
        ComponentHelpers.ScheduledRender.scheduleRender(this, this.renderBound);
    }
    async render() {
        if (!ComponentHelpers.ScheduledRender.isScheduledRender(this)) {
            throw new Error('ConsoleSidebar render was not scheduled');
        }
        // clang-format off
        const link = LitHtml.html `<${Linkifier.Linkifier.Linkifier.litTagName} .data=${{
            url: 'https://crbug.com/1232937',
        }}>${i18nString(UIStrings.issueTrackerLinkText)}</${Linkifier.Linkifier.Linkifier.litTagName}>`;
        LitHtml.render(LitHtml.html `<p>
      ${i18nString(UIStrings.deprecationNotice)} ${link}.
    </p>`, this.shadow, { host: this });
        // clang-format on
    }
}
ComponentHelpers.CustomElements.defineComponent('devtools-console-sidebar-deprecation', SidebarDeprecation);
//# sourceMappingURL=SidebarDeprecation.js.map
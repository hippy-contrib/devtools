// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ElementsComponents from './components/components.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';
export function sdkNodeToAXTreeNode(sdkNode) {
    const treeNodeData = sdkNode;
    if (!sdkNode.numChildren()) {
        return {
            treeNodeData,
            id: sdkNode.id(),
        };
    }
    return {
        treeNodeData,
        children: async () => {
            if (sdkNode.numChildren() === sdkNode.children().length) {
                return Promise.resolve(sdkNode.children().map(child => sdkNodeToAXTreeNode(child)));
            }
            // numChildren returns the number of children that this node has, whereas node.children()
            // returns only children that have been loaded. If these two don't match, that means that
            // there are backend children that need to be loaded into the model, so request them now.
            await sdkNode.accessibilityModel().requestAXChildren(sdkNode.id());
            if (sdkNode.numChildren() !== sdkNode.children().length) {
                throw new Error('Once loaded, number of children and length of children must match.');
            }
            const treeNodeChildren = [];
            for (const child of sdkNode.children()) {
                treeNodeChildren.push(sdkNodeToAXTreeNode(child));
            }
            return Promise.resolve(treeNodeChildren);
        },
        id: sdkNode.id(),
    };
}
export function accessibilityNodeRenderer(node) {
    const tag = ElementsComponents.AccessibilityTreeNode.AccessibilityTreeNode.litTagName;
    const sdkNode = node.treeNodeData;
    const name = sdkNode.name()?.value || '';
    const role = sdkNode.role()?.value || '';
    const ignored = sdkNode.ignored();
    return LitHtml.html `<${tag} .data=${{ name, role, ignored }}></${tag}>`;
}
//# sourceMappingURL=AccessibilityTreeUtils.js.map
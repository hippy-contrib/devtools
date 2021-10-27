(function(e){function t(t){for(var r,i,d=t[0],a=t[1],s=t[2],u=0,b=[];u<d.length;u++)i=d[u],Object.prototype.hasOwnProperty.call(o,i)&&o[i]&&b.push(o[i][0]),o[i]=0;for(r in a)Object.prototype.hasOwnProperty.call(a,r)&&(e[r]=a[r]);l&&l(t);while(b.length)b.shift()();return c.push.apply(c,s||[]),n()}function n(){for(var e,t=0;t<c.length;t++){for(var n=c[t],r=!0,d=1;d<n.length;d++){var a=n[d];0!==o[a]&&(r=!1)}r&&(c.splice(t--,1),e=i(i.s=n[0]))}return e}var r={},o={"ui-inspector":0},c=[];function i(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.e=function(){return Promise.resolve()},i.m=e,i.c=r,i.d=function(e,t,n){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},i.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)i.d(n,r,function(t){return e[t]}.bind(null,r));return n},i.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="/extensions/";var d=window["webpackJsonp"]=window["webpackJsonp"]||[],a=d.push.bind(d);d.push=t,d=d.slice();for(var s=0;s<d.length;s++)t(d[s]);var l=a;c.push([1,"chunk-vendors","chunk-common"]),n()})({"08e8":function(e,t,n){},"0e8d":function(e,t,n){},1:function(e,t,n){e.exports=n("81a5")},"291f":function(e,t,n){"use strict";n("08e8")},"2b86":function(e,t,n){"use strict";n("40c9")},3918:function(e,t,n){"use strict";n("bc9a")},"40c9":function(e,t,n){},"5c0f":function(e,t,n){"use strict";n("0e8d")},"81a5":function(e,t,n){"use strict";n.r(t);n("e260"),n("e6cf"),n("cca6"),n("a79d");var r=n("7a23"),o=n("7864"),c=n("f548"),i=n("9c4e"),d=Object(r["hb"])("data-v-194027a0");Object(r["I"])("data-v-194027a0");var a={class:"ui-inspector-wrapper"},s={class:"sider-bar"};Object(r["G"])();var l=d((function(e,t,n,o,l,u){var b=i["a"],v=c["a"];return Object(r["F"])(),Object(r["k"])("div",a,[Object(r["o"])("div",s,[(Object(r["F"])(!0),Object(r["k"])(r["b"],null,Object(r["M"])(e.panes,(function(t,n){return Object(r["F"])(),Object(r["k"])("div",{class:["pane-thumb"],key:n,onClick:function(n){return e.togglePane(t.id)}},[Object(r["o"])("i",{class:[t.icon,t.show?"pane-showed":""],style:{fontWeight:t.show?"500":"400"}},null,6)],8,["onClick"])})),128))]),Object(r["o"])(v,{class:"custom-resizer",layout:"vertical",onPaneResizeStop:e.onPaneResizeStop},{default:d((function(){return[(Object(r["F"])(!0),Object(r["k"])(r["b"],null,Object(r["M"])(e.visiablePanes,(function(e,t){return Object(r["F"])(),Object(r["k"])(r["b"],{key:t},[0!==t?(Object(r["F"])(),Object(r["k"])(b,{key:0,id:"resizer-"+t},null,8,["id"])):Object(r["l"])("",!0),(Object(r["F"])(),Object(r["k"])(Object(r["Q"])(e.component),{class:"pane-wrap",style:e.style},null,8,["style"]))],64)})),128))]})),_:1},8,["onPaneResizeStop"])])})),u=(n("4de4"),n("7db0"),n("5502")),b=n("a1d2"),v=n("32ae"),p=(n("f3fc"),n("163d"),n("4104")),f=(n("3bc8"),Object(r["hb"])("data-v-229f3e74"));Object(r["I"])("data-v-229f3e74");var O={class:"screenshot-wrap",ref:"screenshotRef"},j={class:"action-bar"},h={class:"screenshot-img-wrap",style:{width:"100%"}};Object(r["G"])();var m=f((function(e,t,n,o,c,i){var d,a,s,l,u=Object(r["O"])("refresh"),b=p["a"],m=v["a"];return Object(r["F"])(),Object(r["k"])("div",O,[Object(r["o"])("div",j,[Object(r["o"])(m,{class:"item",effect:"dark",content:"refresh",placement:"bottom"},{default:f((function(){return[Object(r["o"])(b,{class:"action-btn",size:20,onClick:e.update},{default:f((function(){return[Object(r["o"])(u)]})),_:1},8,["onClick"])]})),_:1})]),Object(r["o"])("div",h,[Object(r["o"])("img",{src:e.screenshot,style:{width:"100%"}},null,8,["src"]),Object(r["o"])("div",{class:"node-bounds margin-wrap",style:null===(d=e.selectedNodeBounds)||void 0===d?void 0:d.marginBounds},null,4),Object(r["o"])("div",{class:"node-bounds border-wrap",style:null===(a=e.selectedNodeBounds)||void 0===a?void 0:a.borderBounds},null,4),Object(r["o"])("div",{class:"node-bounds padding-wrap",style:null===(s=e.selectedNodeBounds)||void 0===s?void 0:s.paddingBounds},null,4),Object(r["o"])("div",{class:"node-bounds content-wrap",style:null===(l=e.selectedNodeBounds)||void 0===l?void 0:l.contentBounds},null,4)])],512)})),g=n("b98b"),y=n("d988"),k=n("a313"),w=Object(r["p"])({name:"Screenshot",components:{Refresh:g["a"]},setup:function(){var e=Object(r["K"])(null),t=Object(u["b"])(),n=function(){var n,r=(null===(n=e.value)||void 0===n?void 0:n.clientWidth)||0,o=t.state.screenshot||{},c=o.metadata;c=void 0===c?{deviceHeight:void 0,deviceWidth:void 0}:c;var i=c.deviceHeight,d=c.deviceWidth;return r*i/d};return{screenshotRef:e,screenshot:Object(r["i"])((function(){return t.getters.screenshotImg})),selectedNodeBounds:Object(r["i"])((function(){var r,o,c,i,d,a;if(t.state.screenshot){var s=null===(r=t.state.domTree)||void 0===r?void 0:r.itree,l=null===(o=t.state.renderTree)||void 0===o?void 0:o.rtree;if(t.state.screenshotBoundType===k["b"].DOM&&s){if(!(null===(c=t.state.selectedDomNode)||void 0===c?void 0:c.bounds))return;var u=s.width,b=s.height,v=(null===(i=e.value)||void 0===i?void 0:i.clientWidth)||0,p=n();return Object(y["b"])(t.state.selectedDomNode,{rootWidth:u,rootHeight:b,imgHeight:p,imgWidth:v})}if(t.state.screenshotBoundType===k["b"].Render&&l){if(!(null===(d=t.state.selectedRenderNode)||void 0===d?void 0:d.bounds))return;var f=l.bounds,O=f.left,j=f.right,h=f.top,m=f.bottom,g=j-O,w=m-h,R=(null===(a=e.value)||void 0===a?void 0:a.clientWidth)||0,N=n();return Object(y["c"])(t.state.selectedRenderNode,{rootWidth:g,rootHeight:w,imgHeight:N,imgWidth:R})}return{marginBounds:{},borderBounds:{},paddingBounds:{},contentBounds:{}}}}))}},methods:{update:function(){this.$store.dispatch("getDomTree"),this.$store.dispatch("getRenderTree"),this.$store.dispatch("getScreenshot")}}});n("5c0f");w.render=m,w.__scopeId="data-v-229f3e74";var R=w,N=Object(r["hb"])("data-v-7fe52fab");Object(r["I"])("data-v-7fe52fab");var x={class:"attr-wrap"},T=Object(r["o"])("div",{class:"divider"},null,-1);Object(r["G"])();var D=N((function(e,t,n,o,c,i){var d=Object(r["O"])("attr-form");return Object(r["F"])(),Object(r["k"])("div",x,[Object(r["o"])(d,{node:e.selectedDomNode,"title-class":"action-bar",title:"DOM Node"},null,8,["node"]),T,Object(r["o"])(d,{node:e.selectedRenderNode,"title-class":"action-bar",title:"Render Node"},null,8,["node"])])})),S=n("24a6"),F=(n("8ac7"),n("1393")),P=(n("0bd6"),n("e31b")),_=(n("34c0"),n("b64b"),Object(r["hb"])("data-v-20614202"));Object(r["I"])("data-v-20614202");var B={key:2,class:"no-node"};Object(r["G"])();var C=_((function(e,t,n,o,c,i){var d=P["a"],a=Object(r["O"])("attr-form",!0),s=F["a"],l=S["a"];return Object(r["F"])(),Object(r["k"])(r["b"],null,[e.title?(Object(r["F"])(),Object(r["k"])("div",{key:0,class:[e.titleClass,"title"]},Object(r["S"])(e.title),3)):Object(r["l"])("",!0),e.node?(Object(r["F"])(),Object(r["k"])(l,{key:1,class:"attr-form",size:"mini",model:e.node,disabled:!0,"label-position":"left","label-width":"120px"},{default:_((function(){return[(Object(r["F"])(!0),Object(r["k"])(r["b"],null,Object(r["M"])(Object.keys(e.node),(function(t){return Object(r["F"])(),Object(r["k"])(s,{class:[e.node[t]instanceof Object?"form-in-form":""],label:t,key:t},{default:_((function(){return[e.node[t]instanceof Object?(Object(r["F"])(),Object(r["k"])(a,{key:1,node:e.node[t]},null,8,["node"])):(Object(r["F"])(),Object(r["k"])(d,{key:0,modelValue:e.node[t],"onUpdate:modelValue":function(n){return e.node[t]=n}},null,8,["modelValue","onUpdate:modelValue"]))]})),_:2},1032,["class","label"])})),128))]})),_:1},8,["model"])):(Object(r["F"])(),Object(r["k"])("div",B,"未选择节点"))],64)})),M=Object(r["p"])({name:"AttrForm",components:{},props:["node","title","titleClass"]});n("291f");M.render=C,M.__scopeId="data-v-20614202";var I=M,W=Object(r["p"])({name:"Attribute",components:{AttrForm:I},setup:function(){var e=Object(u["b"])();return{selectedDomNode:Object(r["i"])((function(){if(e.state.selectedDomNode){var t=e.state.selectedDomNode,n=Object.assign(Object.assign({},t),{flexNodeStyle:Object.assign(Object.assign({},t.flexNodeStyle),{margin:Object(y["d"])(t.flexNodeStyle.margin),padding:Object(y["d"])(t.flexNodeStyle.padding),border:Object.assign(Object.assign({},Object(y["a"])(t.flexNodeStyle.border)),{color:t.borderColor})})});return delete n.child,n}})),selectedRenderNode:Object(r["i"])((function(){if(e.state.selectedRenderNode){var t=Object.assign({},e.state.selectedRenderNode);return delete t.child,t}}))}}});n("3918");W.render=D,W.__scopeId="data-v-7fe52fab";var z=W,H=n("7f5e"),$=(n("e750"),Object(r["o"])("div",{class:"action-bar"},"Dom Tree",-1));function A(e,t,n,o,c,i){var d=H["a"];return Object(r["F"])(),Object(r["k"])("div",null,[$,Object(r["o"])(d,{data:e.tree,props:e.treeProps,"node-key":"id","expand-on-click-node":!0,onNodeClick:e.onNodeClick},null,8,["data","props","onNodeClick"])])}var G=Object(r["p"])({name:"DomTree",components:{},setup:function(){var e=Object(u["b"])();return{tree:Object(r["i"])((function(){var t,n=null===(t=e.state.domTree)||void 0===t?void 0:t.itree;return n?[n]:null})),treeProps:{label:"nodeType",children:"child"}}},methods:{onNodeClick:function(e){this.$store.commit("selectDomNode",e)}}});G.render=A;var V=G,J=Object(r["o"])("div",{class:"action-bar"},"Render Tree",-1);function K(e,t,n,o,c,i){var d=H["a"];return Object(r["F"])(),Object(r["k"])("div",null,[J,Object(r["o"])(d,{data:e.tree,props:e.treeProps,"node-key":"id",onNodeClick:e.onNodeClick},null,8,["data","props","onNodeClick"])])}var U=Object(r["p"])({name:"RenderTree",components:{},setup:function(){var e=Object(u["b"])();return{tree:Object(r["i"])((function(){var t,n=null===(t=e.state.renderTree)||void 0===t?void 0:t.rtree;return n?[n]:null})),treeProps:{label:"name",children:"child"}}},methods:{onNodeClick:function(e){this.$store.commit("selectRenderNode",e),this.$store.dispatch("getSelectedRenderObject",e)}}});U.render=K;var q=U,E=(n("46dc"),Object(r["p"])({name:"App",components:{Multipane:b["a"],MultipaneResizer:b["b"],Screenshot:R,Attribute:z,DomTree:V,RenderTree:q},setup:function(){var e=Object(u["b"])();e.dispatch("getDomTree"),e.dispatch("getRenderTree"),e.dispatch("getScreenshot");var t=Object(r["K"])([{id:1,component:Object(r["R"])(R),style:{width:"25%"},show:!0,icon:"el-icon-mobile-phone"},{id:2,component:Object(r["R"])(V),style:{width:"25%"},show:!0,icon:"el-icon-grape"},{id:3,component:Object(r["R"])(q),style:{width:"25%"},show:!0,icon:"el-icon-grape"},{id:4,component:Object(r["R"])(z),style:{flex:1},show:!0,icon:"el-icon-menu"}]),n=Object(r["i"])((function(){return t.value.filter((function(e){return e.show}))})),o=function(e){var r=t.value.find((function(t){return t.id===e})),o=n.value,c=o[o.length-1],i=o[o.length-2],d=c.id===e,a=!r.show&&r.id>c.id;d&&(i.style={flex:1}),a&&(r.style={flex:1},1===c.style.flex&&(c.style={width:"25%"})),r.show=!r.show},c=function(e,t){n.value[e].style.width=t};return{panes:t,visiablePanes:n,togglePane:o,onPaneResizeStop:c}}}));n("2b86");E.render=l,E.__scopeId="data-v-194027a0";var Q=E,L=(n("96cf"),n("4160"),n("159b"),n("9ab4")),X=n("08c1"),Y=n("2ef7"),Z=Object(u["a"])({state:{screenshot:void 0,domTree:void 0,renderTree:void 0,selectedDomNode:void 0,selectedRenderNode:void 0,screenshotBoundType:void 0},getters:{screenshotImg:function(e){var t,n;return(null===(t=e.screenshot)||void 0===t?void 0:t.data)?"data:image/png;base64,".concat(null===(n=e.screenshot)||void 0===n?void 0:n.data):""}},mutations:{updateDomTree:function(e,t){e.domTree=t},updateRenderTree:function(e,t){e.renderTree=t},updateScreenshot:function(e,t){e.screenshot=t},selectDomNode:function(e,t){e.selectedDomNode=t,e.screenshotBoundType=k["b"].DOM},selectRenderNode:function(e,t){t&&(e.selectedRenderNode||(e.selectedRenderNode={}),Object.keys(t).forEach((function(n){e.selectedRenderNode[n]=t[n]})),e.screenshotBoundType=k["b"].Render)}},actions:{getDomTree:function(e){var t=e.commit;return Object(L["a"])(this,void 0,void 0,regeneratorRuntime.mark((function e(){var n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,Object(X["a"])();case 3:n=e.sent,t("updateDomTree",n.result),e.next=11;break;case 7:e.prev=7,e.t0=e["catch"](0),console.error(e.t0),Object(o["b"])({title:"获取DOM树失败",type:k["a"].error});case 11:case"end":return e.stop()}}),e,null,[[0,7]])})))},getRenderTree:function(e){var t=e.commit;return Object(L["a"])(this,void 0,void 0,regeneratorRuntime.mark((function e(){var n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,Object(X["b"])();case 3:n=e.sent,t("updateRenderTree",n.result),e.next=11;break;case 7:e.prev=7,e.t0=e["catch"](0),console.error(e.t0),Object(o["b"])({title:"获取Render树失败",type:k["a"].error});case 11:case"end":return e.stop()}}),e,null,[[0,7]])})))},getScreenshot:function(e){var t=e.commit;return Object(L["a"])(this,void 0,void 0,regeneratorRuntime.mark((function e(){var n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,Object(X["c"])({format:"png",quality:100,maxWidth:1500,maxHeight:3e3});case 3:n=e.sent,t("updateScreenshot",n.result),e.next=11;break;case 7:e.prev=7,e.t0=e["catch"](0),console.error(e.t0),Object(o["b"])({title:"获取截图失败",type:k["a"].error});case 11:case"end":return e.stop()}}),e,null,[[0,7]])})))},getSelectedRenderObject:function(e,t){var n,r=e.state,c=e.commit;return Object(L["a"])(this,void 0,void 0,regeneratorRuntime.mark((function e(){var i,d;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:if(!t.hadFetchedDetailInfo){e.next=2;break}return e.abrupt("return");case 2:return e.prev=2,e.next=5,Object(X["d"])({id:t.id});case 5:if(i=e.sent,null===(n=i.result.rtree)||void 0===n?void 0:n.properties){e.next=8;break}return e.abrupt("return");case 8:delete i.result.rtree.child,d=Object(Y["a"])(i.result.rtree.properties),c("selectRenderNode",Object.assign(Object.assign(Object.assign({},r.selectedRenderNode||{}),d),{hadFetchedDetailInfo:!0})),e.next=17;break;case 13:e.prev=13,e.t0=e["catch"](2),console.error(e.t0),Object(o["b"])({title:"获取Render Object失败",type:k["a"].error});case 17:case"end":return e.stop()}}),e,null,[[2,13]])})))}},modules:{}}),ee=(n("a471"),n("7dd6"),Object(r["j"])(Q));ee.use(o["d"]),ee.use(Z).mount("#app")},bc9a:function(e,t,n){}});
//# sourceMappingURL=ui-inspector.1b373940.js.map
(function(e){function t(t){for(var r,o,s=t[0],c=t[1],u=t[2],d=0,h=[];d<s.length;d++)o=s[d],Object.prototype.hasOwnProperty.call(a,o)&&a[o]&&h.push(a[o][0]),a[o]=0;for(r in c)Object.prototype.hasOwnProperty.call(c,r)&&(e[r]=c[r]);l&&l(t);while(h.length)h.shift()();return i.push.apply(i,u||[]),n()}function n(){for(var e,t=0;t<i.length;t++){for(var n=i[t],r=!0,s=1;s<n.length;s++){var c=n[s];0!==a[c]&&(r=!1)}r&&(i.splice(t--,1),e=o(o.s=n[0]))}return e}var r={},a={"core-performance":0},i=[];function o(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,o),n.l=!0,n.exports}o.e=function(){return Promise.resolve()},o.m=e,o.c=r,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)o.d(n,r,function(t){return e[t]}.bind(null,r));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="/extensions/";var s=window["webpackJsonp"]=window["webpackJsonp"]||[],c=s.push.bind(s);s.push=t,s=s.slice();for(var u=0;u<s.length;u++)t(s[u]);var l=c;i.push([4,"chunk-vendors","chunk-common"]),n()})({"2e49":function(e,t,n){},4:function(e,t,n){e.exports=n("6870")},"548c":function(e,t,n){"use strict";n("962a")},6567:function(e,t,n){"use strict";n("2e49")},6870:function(e,t,n){"use strict";n.r(t);n("e260"),n("e6cf"),n("cca6"),n("a79d");var r=n("7a23"),a=n("7864"),i=n("2aa9"),o=(n("f3fc"),n("ab0d"),n("b58f")),s=(n("47b1"),n("59eb")),c=(n("250e"),n("38e9")),u=(n("4af4"),function(e){return Object(r["M"])("data-v-644eafad"),e=e(),Object(r["K"])(),e}),l={class:"performance"},d=Object(r["p"])("开始"),h=Object(r["p"])("结束"),f=Object(r["p"])("清空"),p=Object(r["p"])("导出"),v={class:"tip"},m={class:"init main-text"},g=Object(r["p"])(" 请点击 “开始” 按钮开始收集性能数据，点击 “结束” 按钮结束收集 "),b=u((function(){return Object(r["n"])("div",{class:"sub-tip accent-text"}," 由于记录的是实时性能数据，在点击“开始”后的数据收集时间内，请确保页面有进行“渲染”或者触发了一些“JS 事件”，否则收集到的数据可能为空 ",-1)})),O=[g,b],w={class:"collecting main-text"},y=u((function(){return Object(r["n"])("i",{class:"el-icon-loading",style:{"font-size":"18px"}},null,-1)})),S=Object(r["p"])(" 数据收集中...... "),T=[y,S],x={class:"analysing main-text"},j=u((function(){return Object(r["n"])("i",{class:"el-icon-loading",style:{"font-size":"18px"}},null,-1)})),C=Object(r["p"])(" 数据解析中...... "),M=[j,C],k={key:0,style:{margin:"10px 15px"}},D=u((function(){return Object(r["n"])("h4",{class:"main-text"},"帧率统计：",-1)})),z=u((function(){return Object(r["n"])("h4",{class:"main-text"},"Core 堆栈数据",-1)})),E=u((function(){return Object(r["n"])("h4",{class:"main-text"},"JS 堆栈数据",-1)}));function I(e,t,n,a,u,g){var b=c["a"],y=s["a"],S=o["a"],j=i["a"],C=Object(r["S"])("performance-chart"),I=Object(r["S"])("flame-graph");return Object(r["J"])(),Object(r["m"])("div",l,[Object(r["q"])(j,{style:{padding:"20px"}},{default:Object(r["hb"])((function(){return[Object(r["q"])(S,{class:"row-bg",justify:"end",type:"flex"},{default:Object(r["hb"])((function(){return[Object(r["q"])(y,{size:"mini"},{default:Object(r["hb"])((function(){return[Object(r["q"])(b,{type:"primary",disabled:e.isStartBtnDisabled,onClick:e.start,icon:"el-icon-check",size:"mini"},{default:Object(r["hb"])((function(){return[d]})),_:1},8,["disabled","onClick"]),Object(r["q"])(b,{type:"primary",disabled:e.isEndBtnDisabled,onClick:e.stop,icon:"el-icon-close",size:"mini"},{default:Object(r["hb"])((function(){return[h]})),_:1},8,["disabled","onClick"]),Object(r["q"])(b,{type:"primary",disabled:e.isClearBtnDisabled,onClick:e.clear,icon:"el-icon-delete",size:"mini"},{default:Object(r["hb"])((function(){return[f]})),_:1},8,["disabled","onClick"]),Object(r["q"])(b,{type:"primary",disabled:e.isClearBtnDisabled,onClick:e.exportData,icon:"el-icon-download",size:"mini"},{default:Object(r["hb"])((function(){return[p]})),_:1},8,["disabled","onClick"])]})),_:1})]})),_:1})]})),_:1}),Object(r["n"])("div",v,[Object(r["ib"])(Object(r["n"])("div",m,O,512),[[r["eb"],e.isInitState]]),Object(r["ib"])(Object(r["n"])("div",w,T,512),[[r["eb"],e.isCollectingState]]),Object(r["ib"])(Object(r["n"])("div",x,M,512),[[r["eb"],e.isAnalysingState]])]),e.isCollectedState?(Object(r["J"])(),Object(r["m"])("div",k,[D,Object(r["q"])(C,{option:e.option,class:"charts",ref:"chartRef"},null,8,["option"]),z,Object(r["q"])(I,{"end-time":e.endTime,"start-time":e.startTime,"render-trace":e.renderCoreTrace,"render-trace-map":e.renderCoreTraceMap,"viewport-height":e.viewportHeight,"viewport-width":e.viewportWidth,class:"flame-graph",ref:"coreFlamegraphRef"},null,8,["end-time","start-time","render-trace","render-trace-map","viewport-height","viewport-width"]),E,Object(r["q"])(I,{"end-time":e.isIOS&&e.renderV8Trace.length?0:e.endTime,"start-time":e.isIOS&&e.renderV8Trace.length?0:e.startTime,"render-trace":e.renderV8Trace,"render-trace-map":e.renderV8TraceMap,"viewport-height":e.viewportHeight,"viewport-width":e.viewportWidth,class:"flame-graph",ref:"v8flamegraphRef"},null,8,["end-time","start-time","render-trace","render-trace-map","viewport-height","viewport-width"])])):Object(r["l"])("",!0)])}n("0d03");var A=n("5502"),W=n("84a2"),F=n.n(W),H=n("cd3f"),V=n.n(H);function N(e,t,n,a,i,o){return Object(r["J"])(),Object(r["m"])("div",{style:Object(r["A"])(e.style),ref:"chart"},null,4)}var R,B=n("313e"),P=n("e088"),$=Object(r["r"])({name:"PerformanceChart",props:{width:{type:String,default:"100%"},height:{type:String,default:"200px"},option:{type:Object,default:{}}},watch:{option:{handler:function(e){R?this.$nextTick((function(){e&&R.setOption(e)})):this.init()},deep:!0}},computed:{style:function(){var e=this.height,t=this.width;return{height:e,width:t}}},methods:{init:function(){var e=this;R&&R.dispose();var t=Object(P["a"])()?"dark":"";R=B["a"](this.$refs.chart,t),R.setOption(this.option),R.on("click",(function(t){var n=[t.offsetX,t.offsetY];if(R.containPixel("grid",n)){var r=R.convertFromPixel({seriesIndex:0},[t.offsetX,t.offsetY])[0];e.$emit("selected-option",r)}}))},resize:function(){R.resize()}}}),_=n("6b0d"),X=n.n(_);const L=X()($,[["render",N]]);var G=L;function J(e,t,n,a,i,o){var s=Object(r["S"])("mini-show"),c=Object(r["S"])("time-line"),u=Object(r["S"])("canvas-render");return Object(r["J"])(),Object(r["m"])("div",null,[Object(r["q"])(s,{ref:"minishow","render-trace":e.renderTrace,"render-trace-map":e.renderTraceMap,center:e.center,"vertical-offset":e.verticalOffset,zoom:e.zoom,"min-zoom":e.minZoom,extent:e.extent,"viewport-width":e.viewportWidth,"viewport-height":e.viewportHeight,"start-time":e.startTime,"on-state-change":e.handleStateChange,onOnStateChange:e.handleStateChange},null,8,["render-trace","render-trace-map","center","vertical-offset","zoom","min-zoom","extent","viewport-width","viewport-height","start-time","on-state-change","onOnStateChange"]),Object(r["q"])(c,{ref:"timeline","viewport-width":e.viewportWidth,zoom:e.zoom,center:e.center,extent:e.extent},null,8,["viewport-width","zoom","center","extent"]),Object(r["n"])("div",{style:Object(r["A"])({cursor:e.isDragging?"grabbing":"grab",position:"relative"})},[Object(r["q"])(u,{ref:"canvasrender","render-trace":e.renderTrace,"render-trace-map":e.renderTraceMap,"is-dragging":e.isDragging,"is-drag-moved":e.isDragMoved,selection:e.selection,hovered:e.hovered,center:e.center,"vertical-offset":e.verticalOffset,zoom:e.zoom,"min-zoom":e.minZoom,"viewport-width":e.viewportWidth,"viewport-height":e.viewportHeight,"start-time":e.startTime,"on-state-change":e.handleStateChange,onOnStateChange:e.handleStateChange},null,8,["render-trace","render-trace-map","is-dragging","is-drag-moved","selection","hovered","center","vertical-offset","zoom","min-zoom","viewport-width","viewport-height","start-time","on-state-change","onOnStateChange"])],4)])}n("a9e3"),n("4ec9"),n("d3b7"),n("3ca3"),n("ddb0"),n("4160"),n("159b"),n("b64b");var Y={class:"wrap"},Z=["width","height"];function q(e,t,n,a,i,o){return Object(r["J"])(),Object(r["m"])("div",Y,[Object(r["n"])("canvas",{ref:"canvas",style:Object(r["A"])({width:"".concat(e.viewportWidth,"px"),height:"".concat(e.canvasHeight,"px")}),width:e.viewportWidth,height:e.canvasHeight,onMousedown:t[0]||(t[0]=function(){return e.mouseDown&&e.mouseDown.apply(e,arguments)}),onMousemove:t[1]||(t[1]=function(){return e.mouseMove&&e.mouseMove.apply(e,arguments)}),onMouseout:t[2]||(t[2]=function(){return e.mouseOut&&e.mouseOut.apply(e,arguments)}),onClick:t[3]||(t[3]=function(){return e.click&&e.click.apply(e,arguments)})},null,44,Z)])}n("7db0"),n("a630");var U=n("5b0a"),K=1,Q=18,ee=1,te=1,ne=100,re=8,ae=35,ie=2,oe="2d",se=!1;function ce(e){return Object(U["a"])((function(e){if(e){var t=e.getContext(oe,{alpha:!1}),n=window.devicePixelRatio||1;return ue(e,n),t.scale(n,n),t}}))(e)}function ue(e,t){var n=e.getBoundingClientRect();e.width=n.width*t,e.height=n.height*t,e.style.width="".concat(n.width,"px"),e.style.height="".concat(n.height,"px")}function le(e,t){var n=t instanceof HTMLCanvasElement?t.getBoundingClientRect():{left:0,top:0},r=e.clientX-n.left,a=e.clientY-n.top;return{canvasMouseX:r,canvasMouseY:a}}function de(e,t,n){e.preventDefault(),e.stopPropagation();var r=n.viewportWidth,a=n.zoom,i=n.minZoom,o=n.center,s=n.onStateChange,c=le(e,t),u=c.canvasMouseX,l=u-r/2,d=1,h=.005,f=a*(d+h*-e.deltaY),p=o+l/K/a-l/K/f;he(i,f)!==a&&s({zoom:f,center:p})}function he(e,t){return Math.max(e,Math.min(ne,t))}function fe(e,t,n){return Math.max(e,Math.min(t,n))}var pe=n("d4ec"),ve=n("bee2");n("10d1"),n("99af"),n("13d5"),n("fb6a");function me(){return[Math.floor(256*(1-.4*Math.random())),Math.floor(256*(1-.5*Math.random())),Math.floor(256*(1-.6*Math.random()))]}function ge(e,t,n){var r=e.center,a=e.zoom,i=e.viewportWidth,o=t.measure,s=t.stackIndex,c=Math.max((o.duration||0)*K*a-te,1),u=Q,l=((o.startTime||0)-r)*K*a+i/2,d=s*(Q+ee)+n;return{width:c,height:u,x:l,y:d,isInView:!(l+c<0||i<l)}}function be(e,t){var n=e.x,r=e.y,a=e.width,i=e.height,o=t.x,s=t.y;return!(o<n||n+a<o||s<r||r+i<s)}function Oe(e,t){return function(n){return t.has(n)||t.set(n,e(n)),t.get(n)||e(n)}}var we=function(){function e(){Object(pe["a"])(this,e),this.cache=new WeakMap}return Object(ve["a"])(e,[{key:"getTraceColor",value:function(e){return Oe((function(){return me()}),this.cache)(e)}},{key:"getTraceColorRGB",value:function(e){var t=this;return Oe((function(){var n=t.getTraceColor(e),r=.8;return"rgba(".concat(n[0],",").concat(n[1],",").concat(n[2],", ").concat(r,")")}),this.cache)(e)}},{key:"getMaxStackIndex",value:function(e){return Oe((function(){return e.reduce((function(e,t){return Math.max(t.stackIndex,e)}),0)}),this.cache)(e)}}]),e}(),ye=new we,Se=ye,Te=50,xe=2,je=6,Ce=Object(r["r"])({props:{renderTrace:{type:Array,default:function(){return[]}},renderTraceMap:{type:Map,default:function(){return new Map}},extent:{type:Object,default:function(){return{startOffset:0,endOffset:0,size:0}}},center:{type:Number,default:0},viewportWidth:{type:Number,default:0},zoom:{type:Number,default:1},minZoom:{type:Number,default:1},onStateChange:{type:Function,default:null}},data:function(){return{canvas:{},mouse:{mouseX:0,mouseY:0,isMouseDown:!1},canvasHeight:0,barHeight:0}},watch:{center:function(){this.renderCanvasAtNextTick()},viewportWidth:function(){this.renderCanvasAtNextTick()}},methods:{init:function(){this.canvas=this.$refs.canvas,this.barHeight=this.getBarHeight(),this.canvasHeight=this.getCanvasHeight(),document.addEventListener("mouseup",this.mouseUp),this.canvas instanceof HTMLCanvasElement&&this.canvas.addEventListener("wheel",this.handleWheel),this.renderCanvas()},renderCanvasAtNextTick:function(){var e=this;this.$nextTick((function(){e.renderCanvas()}))},getCanvasHeight:function(){var e=this.barHeight*(Se.getMaxStackIndex(this.renderTrace)+1);return Math.max(e,Te)},getBarHeight:function(){var e=Te/je,t=this.renderTrace.find((function(t){return t.stackIndex>e}));return void 0===t?je:xe},renderCanvas:function(){var e=this.$refs.canvas;if(e instanceof HTMLCanvasElement){var t=ce(e);t.fillStyle="#ffffff",t.fillRect(0,0,e.width,e.height);for(var n=this.renderTraceMap||new Map,r=Array.from(n.keys()),a=0,i=0,o=r;i<o.length;i++){var s=o[i],c=n.get(s);if(c){this.renderTraceGroup(t,c,a);var u=Se.getMaxStackIndex(c);a+=(u+1)*this.barHeight}}this.renderMask(t,0,a)}},renderTraceGroup:function(e,t,n){if(t.length){var r=this.extent,a=this.viewportWidth,i=this.barHeight;t.forEach((function(t){var o=t.measure,s=t.stackIndex,c=Math.max(o.duration/r.size*a,1),u=(o.startTime-r.startOffset)/r.size*a,l=s*i+n;e.fillStyle=Se.getTraceColorRGB(o),e.fillRect(u,l,c,i)}))}},renderMask:function(e,t,n){var r=this.center,a=this.extent,i=this.viewportWidth,o=this.zoom,s=a.startOffset,c=a.size,u=(r-s)/a.size,l=i/(c*o),d=u-l/2,h=u+l/2,f=Math.max(n-t,Te);e.fillStyle="rgba(200, 200, 200, 0.2)",e.fillRect(0,t,Math.max(d,0)*i,f),e.fillRect(Math.min(h,1)*i,t,i-Math.min(h,1)*i,f)},mouseDown:function(){this.mouse.isMouseDown=!0},mouseMove:function(e){var t=this.getCanvasMousePosition(e),n=t.canvasMouseX,r=t.canvasMouseY;this.mouse.mouseX=n,this.mouse.mouseY=r,this.mouse.isMouseDown&&this.setCenterFromMousePosition(e)},mouseUp:function(){this.mouse.isMouseDown=!1},mouseOut:function(){this.mouse.isMouseDown=!1},click:function(e){this.setCenterFromMousePosition(e)},handleWheel:function(e){de(e,this.canvas,{viewportWidth:this.viewportWidth,center:this.center,zoom:this.zoom,minZoom:this.minZoom,onStateChange:this.onStateChange})},getCanvasMousePosition:function(e){return le(e,this.canvas)},setCenterFromMousePosition:function(e){var t=this.getCanvasMousePosition(e),n=t.canvasMouseX,r=this.extent,a=r.size,i=r.startOffset,o=n/this.viewportWidth*a+i;this.$emit("onStateChange",{center:o})}}});const Me=X()(Ce,[["render",q]]);var ke=Me,De=["width","height"];function ze(e,t,n,a,i,o){var s=Object(r["S"])("tool-tip");return Object(r["J"])(),Object(r["m"])("div",{class:"wrap",style:Object(r["A"])({width:"".concat(e.viewportWidth,"px"),height:"".concat(e.canvasHeight,"px")})},[Object(r["n"])("canvas",{ref:"canvas",style:Object(r["A"])({width:"".concat(e.viewportWidth,"px"),height:"".concat(e.canvasHeight,"px")}),width:e.viewportWidth,height:e.canvasHeight,onMousedown:t[0]||(t[0]=function(){return e.mouseDown&&e.mouseDown.apply(e,arguments)}),onMousemove:t[1]||(t[1]=function(){return e.mouseMove&&e.mouseMove.apply(e,arguments)}),onMouseout:t[2]||(t[2]=function(){return e.mouseOut&&e.mouseOut.apply(e,arguments)})},null,44,De),Object(r["q"])(s,{mouse:e.mouse,"is-show":e.tooltip.iShow,text:e.tooltip.textContent||""},null,8,["mouse","is-show","text"])],4)}var Ee=n("3835");n("b0c0"),n("b680"),n("4de4");function Ie(e,t,n,a,i,o){return Object(r["ib"])((Object(r["J"])(),Object(r["m"])("div",{ref:"toop-tip",class:"wrap",style:Object(r["A"])({userSelect:"none",position:"absolute",backgroundColor:"white",fontSize:10,fontFamily:" Lucida Grande",padding:"2px 4px",boxShadow:"3px 3px 5px rgba(0,0,0,0.4)",left:"".concat(e.tooltipX,"px"),top:"".concat(e.tooltipY,"px")})},Object(r["W"])(e.text),5)),[[r["eb"],e.isShow]])}var Ae=Object(r["r"])({props:{text:{type:String,default:""},mouse:{type:Object,default:function(){return{posX:0,posY:0}}},isShow:{type:Boolean,default:!1}},computed:{tooltipX:function(){return this.mouse.posX+re},tooltipY:function(){return this.mouse.posY+re}}});const We=X()(Ae,[["render",Ie]]);var Fe=We,He=se?function(e){return e}:Math.floor,Ve=80,Ne=400,Re=Object(r["r"])({components:{ToolTip:Fe},props:{renderTrace:{type:Array,default:function(){return[]}},renderTraceMap:{type:Map,default:function(){return new Map}},selection:{type:Object,default:function(){return{}}},hovered:{type:Object,default:function(){return{measure:""}}},center:{type:Number,default:0},viewportWidth:{type:Number,default:0},zoom:{type:Number,default:1},minZoom:{type:Number,default:1},isDragging:{type:Boolean,default:!1},isDragMoved:{type:Boolean,default:!1},verticalOffset:{type:Number,default:0},onStateChange:{type:Function}},data:function(){return{canvas:{},mouse:{posX:0,posY:0},renderedShapes:[],canvasHeight:0,tooltip:{iShow:!1,textContent:""}}},watch:{center:function(){this.renderCanvasAtNextTick()},viewportWidth:function(){this.renderCanvasAtNextTick()}},methods:{init:function(){document.addEventListener("mouseup",this.mouseUp),this.canvas=this.$refs.canvas,this.canvasHeight=this.getCanvasHeight(),this.canvas instanceof HTMLCanvasElement&&this.canvas.addEventListener("wheel",this.handleWheel),this.renderCanvas(this.canvas)},renderCanvasAtNextTick:function(){var e=this;this.$nextTick((function(){e.renderCanvas(e.canvas)}))},getCanvasHeight:function(){var e=Q*(Se.getMaxStackIndex(this.renderTrace)+1);return Math.min(Ne,Math.max(e,Ve))},renderCanvas:function(e){if(e instanceof HTMLCanvasElement){var t=ce(e);t.fillStyle="#ffffff",t.fillRect(0,0,e.width,e.height);for(var n=this.renderTraceMap,r=Array.from(n.keys()),a=0,i=0,o=r;i<o.length;i++){var s=o[i],c=n.get(s);if(c){this.renderTraceGroup(t,c,a+this.verticalOffset,s);var u=Se.getMaxStackIndex(c);a+=(u+1)*Q}}}},renderTraceGroup:function(e,t,n,r){if(t.length)for(var a in void 0!==r&&this.renderKeyLine(r,e,n),this.renderedShapes=[],t){var i=t[a],o=ge({center:this.center,zoom:this.zoom,viewportWidth:this.viewportWidth},i,n),s=o.width,c=o.height,u=o.x,l=o.y,d=o.isInView;d&&(e.fillStyle=Se.getTraceColorRGB(i.measure),e.fillRect(He(u),He(l),He(s),He(c)),this.renderTraceLabel(e,i,o),this.renderedShapes.push([o,i]))}},renderKeyLine:function(e,t,n){t.font="italic 10px Lucida Grande",t.fillStyle="#419e30",t.fillText("Thread ".concat(e),0,n+10),n>0&&(t.beginPath(),t.setLineDash([5]),t.moveTo(0,n),t.lineTo(this.viewportWidth,n),t.closePath(),t.lineWidth=.5,t.strokeStyle="#c4ffd6",t.stroke())},renderTraceLabel:function(e,t,n){var r=t.measure.name,a=n.x,i=n.y,o=n.width;if(!(o<ae)){var s=He(Math.max(o-ie,0));e.font="10px Lucida Grande",e.fillStyle="black",e.fillText(r,He(a+ie),He(i+Q/2+4),s)}},mouseDown:function(){this.$emit("onStateChange",{isDragging:!0,isDragMoved:!1})},mouseMove:function(e){var t=le(e,this.canvas),n=t.canvasMouseX,r=t.canvasMouseY;this.mouse.posX=n,this.mouse.posY=r;var a=this.tooltip,i=this.isDragging,o=this.center,s=this.verticalOffset,c=this.getIntersectingTrace(e);if(c){var u=c.measure;a.textContent="".concat(u.duration.toFixed(1),"ms ").concat(u.name),a.iShow=!0}else a.iShow=!1;if(i){var l=o-e.movementX/K/this.zoom,d=Math.min(0,s+e.movementY);this.$emit("onStateChange",{verticalOffset:d,center:l,hovered:c,isDragMoved:!0})}},mouseOut:function(){this.tooltip.iShow=!1},mouseUp:function(e){this.$emit("onStateChange",{isDragging:!1,isDragMoved:!1,selection:this.isDragMoved?this.selection:this.getIntersectingTrace(e)})},handleWheel:function(e){de(e,this.canvas,{viewportWidth:this.viewportWidth,center:this.center,zoom:this.zoom,minZoom:this.minZoom,onStateChange:this.onStateChange})},getIntersectingTrace:function(e){var t=le(e,this.canvas),n=t.canvasMouseX,r=t.canvasMouseY,a=this.renderedShapes.filter((function(e){var t=Object(Ee["a"])(e,1),a=t[0],i=a.x,o=a.y,s=a.width,c=a.height;return be({x:i,y:o,width:s,height:c},{x:n,y:r})}));return a.length?a[0][1]:null}}});n("548c");const Be=X()(Re,[["render",ze],["__scopeId","data-v-17c60dcc"]]);var Pe=Be,$e={class:"wrap"},_e=["width"];function Xe(e,t,n,a,i,o){return Object(r["J"])(),Object(r["m"])("div",$e,[Object(r["n"])("canvas",{class:"area",ref:"canvas",style:Object(r["A"])({width:"".concat(e.viewportWidth,"px"),height:"".concat(14,"px")}),width:e.viewportWidth},null,12,_e)])}var Le=Object(r["r"])({props:{extent:{type:Object,default:function(){return{startOffset:0,endOffset:0,size:0}}},center:{type:Number,default:0},zoom:{type:Number,default:1},viewportWidth:{type:Number,default:0}},watch:{center:function(){this.renderCanvasAtNextTick()},viewportWidth:function(){this.renderCanvasAtNextTick()}},methods:{init:function(){this.renderCanvas()},renderCanvasAtNextTick:function(){var e=this;this.$nextTick((function(){e.renderCanvas()}))},renderCanvas:function(){var e=this.$refs.canvas,t=ce(e);t.fillStyle="#ffffff",t.fillRect(0,0,e.width,e.height);var n=this.extent,r=n.startOffset,a=n.size,i=this.zoom,o=this.center,s=this.viewportWidth,c=10,u=10,l=6,d=(o-r)/a,h=s/(a*i),f=d-h/2,p=d+h/2,v=Math.max(f,0)*a,m=Math.min(p,1)*a,g=(m-v)/l,b=Math.round(s/l);t.font="10px Lucida Grande",t.fillStyle="#666",t.fillText("".concat(Math.round(v)),0,u);for(var O=1;O<l;O++)t.fillText("".concat(Math.round(v+g*O)),0+b*O-c,u);t.fillText("".concat(Math.round(m)),this.viewportWidth-30,u)}}});n("6567");const Ge=X()(Le,[["render",Xe],["__scopeId","data-v-06cbb47e"]]);var Je=Ge,Ye=Object(r["r"])({components:{MiniShow:ke,CanvasRender:Pe,TimeLine:Je},props:{startTime:{type:Number,default:0},endTime:{type:Number,default:0},renderTrace:{type:Array,default:function(){return[]}},renderTraceMap:{type:Map,default:function(){return new Map}},viewportWidth:{type:Number,default:0},viewportHeight:{type:Number,default:0}},data:function(){return{isDragging:!1,isDragMoved:!1,selection:null,hovered:{measure:""},center:0,zoom:.2,minZoom:1,verticalOffset:0,extent:{startOffset:0,endOffset:0,size:1}}},methods:{init:function(){this.extent=this.getExtents(),this.center=this.getInitialCenter(),this.minZoom=this.getMinZoom(),this.$refs.minishow.init(),this.$refs.timeline.init(),this.$refs.canvasrender.init()},getInitialCenter:function(){return this.extent.startOffset+this.viewportWidth/K/2},getExtents:function(){var e,t,n,r=this.renderTrace,a=this.startTime,i=this.endTime;if(r.length>=0&&a&&i)return{startOffset:a,endOffset:i,size:i-a};var o=null!==(e=this.startTime)&&void 0!==e?e:(null===(t=r[0].measure)||void 0===t?void 0:t.startTime)||0,s=r.length>0?r[r.length-1]:{measure:{startTime:0,duration:0}},c=null!==(n=this.endTime)&&void 0!==n?n:(s.measure.startTime||0)+(s.measure.duration||0);return{startOffset:o,endOffset:c,size:c-o}},handleStateChange:function(e){var t=this;Object.keys(e).forEach((function(n){if("zoom"===n&&"number"===typeof e.zoom)t.zoom=he(t.getMinZoom(),e.zoom);else if("center"===n&&"number"===typeof e.center){var r=t.extent,a=r.startOffset,i=r.endOffset;t.center=fe(a,i,e.center)}else t[n]=e[n]}))},getMinZoom:function(){var e=this.extent.size;return this.viewportWidth/e}}});const Ze=X()(Ye,[["render",J]]);var qe=Ze,Ue=(n("277d"),{title:{},tooltip:{trigger:"axis",axisPointer:{type:"cross"},formatter:function(e){var t=Array.isArray(e)?e[0]:e,n="时间点: ".concat(t.axisValue," ms<br/>");return"".concat(n," ").concat(t.seriesName,": ").concat(t.data[1],"<br/>")}},grid:{left:"50px",right:"50px",top:"50px",bottom:"40px"},legend:{data:[{name:"UI FPS"},{name:"Raster FPS"}]},dataZoom:[{type:"inside",xAxisIndex:[0],start:0,end:100,minValueSpan:10}],xAxis:{type:"value",name:"ms",show:!0,axisTick:{show:!1},min:0},yAxis:{type:"value",name:"FPS",axisTick:{show:!0},min:0,splitLine:{show:!0,lineStyle:{color:["#FFF","#DDD","#FFF","#FFF","#DDD","#FFF","#FFF","#FFF","#DDD"]}}},series:[{name:"Raster FPS",type:"line",step:"true",symbol:"none",data:[],emphasis:{focus:"series"},areaStyle:{},select:{itemStyle:{borderWidth:2}}},{name:"UI FPS",type:"line",step:"true",symbol:"none",data:[],areaStyle:{},select:{itemStyle:{borderWidth:2}}}]}),Ke=n("b85c"),Qe=n("2909"),et=(n("96cf"),n("acd8"),n("a434"),n("9ab4")),tt=(n("e25e"),n("bf72")),nt=1e6,rt=3,at=function(e){return Math.round(e)},it=function(e,t){var n=(e-t)/nt/1e3;return n?parseInt(String(1/n),10):0},ot=function(e,t,n){var r,a,i=e.frameTimings,o=[],s=[],c=0;return Array.isArray(i)?(t||(t=parseFloat(Object(tt["a"])(i[0].ui.e/nt,rt))),i.forEach((function(e,n){var u=e.ui,l=e.raster,d=it(u.e,u.b),h=it(l.e,l.b),f=u.b/nt,p=u.e/nt,v=l.b/nt,m=l.e/nt;r&&(o.push([at(r+1-t),0]),o.push([at(f-1-t),0])),a&&(s.push([at(a+1-t),0]),s.push([at(v-1-t),0])),o.push([at(f-t),d]),o.push([at(p-t),d]),s.push([at(v-t),h]),s.push([at(m-t),h]),r=f,a=p,n===i.length-1&&(c=at(m-t))})),n&&(c=at(n-t)),{ui:o,raster:s,maxXAxis:c}):{ui:o,raster:s,maxXAxis:c}},st=n("a313"),ct=1e3,ut=3,lt=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:ct,n=[],r=new Map,a=new Map,i=new Map,o=new Map,s=[],c=new Map;return Array.isArray(e)?(e.forEach((function(e){var u,l,d,h,f=e.tid,p=e.name,v=e.ts,m=e.ph;if(e.ph===st["e"].Complete)ft(r,f,[]),r.get(f).push(e);else if(m===st["e"].Begin)ft(r,f,[]),r.get(f).push(e),a.set(f,Math.max(a.get(f)||0)+1),ft(o,f,new Map),ft(o.get(f),p,[]),o.get(f).get(p).push(v);else if(m===st["e"].End&&r.has(f)&&(null===(u=o.get(f))||void 0===u?void 0:u.get(p))){var g=null===(l=o.get(f))||void 0===l?void 0:l.get(p);if(!(null===g||void 0===g?void 0:g.length))throw new Error("".concat(JSON.stringify(e)," no match start event"));var b=g[g.length-1];g.splice(g.length-1,1);var O="".concat(p,"_").concat(b);if(ft(i,f,new Map),ft(i.get(f),O,[]),null===(h=null===(d=i.get(f))||void 0===d?void 0:d.get(O))||void 0===h||h.push(v),r.get(f).push(e),a.set(f,a.get(f)-1),0===a.get(f)){var w;n.push(r.get(f));var y=dt(r.get(f),i.get(f),t);s.push.apply(s,Object(Qe["a"])(y)),ft(c,f,[]),(w=c.get(f)).push.apply(w,Object(Qe["a"])(y)),r.set(f,[]),i.set(f,new Map),o.set(f,new Map)}}else r.get(f)&&(ft(r,f,[]),r.get(f).push(e))})),{renderTraceMap:c,renderTrace:s}):{renderTraceMap:c,renderTrace:s}},dt=function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:ct,r=[],a=new Map;e.forEach((function(e){var i,o=e.ph,s=e.ts,c=e.name,u=e.dur;if(o===st["e"].Begin){var l="".concat(c,"_").concat(s),d=t.get(l);if(!d||d.length<1)throw new Error("".concat(JSON.stringify(e)," no match end event"));var h=d[d.length-1];d.splice(d.length-1,1);var f=parseFloat(Object(tt["a"])(s/n,ut));r.push(Object.assign({duration:parseFloat(Object(tt["a"])((h-s)/n,ut)),startTime:f},e)),ft(a,c,[]),null===(i=a.get(c))||void 0===i||i.push(f)}else if(o===st["e"].End){var p=a.get(c);if(!(null===p||void 0===p?void 0:p.length))throw new Error("".concat(JSON.stringify(e)," no match start event"));var v=p[p.length-1];p.splice(p.length-1,1),r.push(Object.assign({startTime:v},e))}else o===st["e"].Complete?r.push(Object.assign({startTime:parseFloat(Object(tt["a"])(s/n,ut)),duration:parseFloat(Object(tt["a"])(u/n,ut))},e)):r.push(Object.assign({},e))}));var i=[];return ht(r,i),i},ht=function(e,t){var n=[],r={};e.forEach((function(e){var a=e.name,i=e.startTime,o=e.ph,s=n.length,c="".concat(a,"_").concat(i),u=r[c],l=u?u[u.length-1]:void 0,d=n.length;switch(o){case st["e"].Begin:t.push({stackIndex:s,measure:e}),r[c]||(r[c]=[]),r[c].push(s),n.push(e);break;case st["e"].Complete:t.push({stackIndex:s,measure:e});break;case st["e"].End:void 0!==l&&(n[l]=null,u.splice(u.length-1,1));while(d>0&&null===n[d-1])d-=1;n.length!==d&&(n.length=d);break;default:throw new Error("".concat(JSON.stringify(e)," doesn't match the PH event"))}}))};function ft(e,t,n){e.has(t)||e.set(t,n)}var pt,vt,mt,gt=n("110c"),bt=n("79f6"),Ot=n("feed"),wt=Object(gt["a"])("platform")===st["a"].IOS,yt=5e3,St=1e6,Tt=1e3,xt=3,jt=1e3;(function(e){e["IsStartBtnDisabled"]="isStartBtnDisabled",e["IsEndBtnDisabled"]="isEndBtnDisabled",e["IsClearBtnDisabled"]="isClearBtnDisabled",e["IsInitState"]="isInitState",e["IsCollectingState"]="isCollectingState",e["IsAnalysingState"]="isAnalysingState",e["IsCollectedState"]="isCollectedState"})(pt||(pt={})),function(e){e["SetOperateState"]="setOperateState"}(vt||(vt={})),function(e){e["Start"]="start",e["End"]="end",e["Clear"]="clear",e["GetFrameTimings"]="getFrameTimings",e["GetTimeline"]="getTimeline",e["GetV8Trace"]="getV8Trace",e["HandleErrorCallback"]="handleErrorCallback",e["SetV8Trace"]="setV8Trace"}(mt||(mt={}));var Ct={getters:pt,mutations:vt,actions:mt},Mt=Object(A["a"])({state:{startTime:0,endTime:0,operatState:st["d"].Init,renderCoreTrace:[],renderCoreTraceMap:new Map,renderV8Trace:[],renderV8TraceMap:new Map,timelineEventsStr:""},getters:{isStartBtnDisabled:function(e){return!(e.operatState===st["d"].Init||e.operatState===st["d"].Collected)},isEndBtnDisabled:function(e){return!(e.operatState===st["d"].Collecting)},isClearBtnDisabled:function(e){return!(e.operatState===st["d"].Collected)},isInitState:function(e){return e.operatState===st["d"].Init},isCollectingState:function(e){return e.operatState===st["d"].Collecting},isAnalysingState:function(e){return e.operatState===st["d"].Analysing},isCollectedState:function(e){return e.operatState===st["d"].Collected}},mutations:{setOperateState:function(e,t){switch(t){case st["d"].Init:e.operatState===st["d"].Collected&&(e.operatState=st["d"].Init);break;case st["d"].Collecting:e.operatState!==st["d"].Init&&e.operatState!==st["d"].Collected||(e.operatState=st["d"].Collecting);break;case st["d"].Analysing:e.operatState===st["d"].Collecting&&(e.operatState=st["d"].Analysing);break;case st["d"].Collected:e.operatState===st["d"].Analysing&&(e.operatState=st["d"].Collected);break;default:break}}},actions:{start:function(e){var t=e.state,n=e.commit,r=e.dispatch;return Object(et["a"])(this,void 0,void 0,regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:Object(bt["p"])().then((function(e){e.result.startTime&&(t.startTime=parseFloat(Object(tt["a"])(e.result.startTime/St,xt)),n(Ct.mutations.SetOperateState,st["d"].Collecting))}))["catch"]((function(e){r(Ct.actions.HandleErrorCallback,e)})),wt&&Object(bt["q"])();case 2:case"end":return e.stop()}}),e)})))},end:function(e){var t=e.state,n=e.commit,r=e.dispatch;return Object(et["a"])(this,void 0,void 0,regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:Object(bt["d"])().then((function(e){if(e.result.endTime)return t.endTime=parseFloat(Object(tt["a"])(e.result.endTime/St,xt)),void n(Ct.mutations.SetOperateState,st["d"].Analysing)}))["catch"]((function(e){e&&r(Ct.actions.HandleErrorCallback,e)})),wt&&Object(bt["e"])();case 2:case"end":return e.stop()}}),e)})))},clear:function(e){var t=e.state;t.timelineEventsStr=""},getFrameTimings:function(e){var t=e.state,n=e.dispatch;return Object(et["a"])(this,void 0,void 0,regeneratorRuntime.mark((function e(){var r;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,Object(bt["l"])();case 3:return r=e.sent,e.abrupt("return",ot(r.result,t.startTime,t.endTime));case 7:e.prev=7,e.t0=e["catch"](0),e.t0&&n(Ct.actions.HandleErrorCallback,e.t0);case 10:case"end":return e.stop()}}),e,null,[[0,7]])})))},getTimeline:function(e){var t,n=e.state,r=e.dispatch;return Object(et["a"])(this,void 0,void 0,regeneratorRuntime.mark((function e(){var a,i,o,s,c,u,l,d;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,Object(bt["m"])();case 3:i=e.sent,n.timelineEventsStr=JSON.stringify(i.result),(null===(t=i.result)||void 0===t?void 0:t.traceEvents)||Ot["a"].error("getTimeline json traceEvents nil: ".concat(JSON.stringify(i))),Array.isArray(i.result.traceEvents)||Ot["a"].error("getTimeline json traceEvents is not an Array: ".concat(JSON.stringify(i))),o=lt(i.result.traceEvents,St),s=o.renderTrace,c=o.renderTraceMap,n.renderCoreTrace.splice(0,n.renderCoreTrace.length),(a=n.renderCoreTrace).push.apply(a,Object(Qe["a"])(s)),n.renderCoreTraceMap.clear(),u=Object(Ke["a"])(c.keys());try{for(u.s();!(l=u.n()).done;)d=l.value,n.renderCoreTraceMap.set(d,c.get(d)||[])}catch(h){u.e(h)}finally{u.f()}e.next=18;break;case 15:e.prev=15,e.t0=e["catch"](0),e.t0&&r(Ct.actions.HandleErrorCallback,e.t0);case 18:case"end":return e.stop()}}),e,null,[[0,15]])})))},getV8Trace:function(e){var t=e.state,n=e.dispatch;return Object(et["a"])(this,void 0,void 0,regeneratorRuntime.mark((function e(){var r,a,i,o,s,c,u,l;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,Object(bt["n"])();case 2:r=e.sent;try{i=lt(r.result.traceEvents,Tt),o=i.renderTrace,s=i.renderTraceMap,t.renderV8Trace.splice(0,t.renderV8Trace.length),(a=t.renderV8Trace).push.apply(a,Object(Qe["a"])(o)),t.renderV8TraceMap.clear(),c=Object(Ke["a"])(s.keys());try{for(c.s();!(u=c.n()).done;)l=u.value,t.renderV8TraceMap.set(l,s.get(l)||[])}catch(d){c.e(d)}finally{c.f()}}catch(h){h&&n(Ct.actions.HandleErrorCallback,h)}case 4:case"end":return e.stop()}}),e)})))},handleErrorCallback:function(e,t){var n=e.commit;(null===t||void 0===t?void 0:t.code)===yt&&(n(Ct.mutations.SetOperateState,st["d"].Init),a["a"].warning({message:"请求超时，请重试",type:"warning",duration:jt}))},setV8Trace:function(e,t){var n=e.dispatch,r=e.state,a=t.error,i=t.json;if(a)n(Ct.actions.HandleErrorCallback,a);else{i.traceEvents=i.value;try{var o,s=lt(i.traceEvents,Tt),c=s.renderTrace,u=s.renderTraceMap;r.renderV8Trace.splice(0,r.renderV8Trace.length),(o=r.renderV8Trace).push.apply(o,Object(Qe["a"])(c)),r.renderV8TraceMap.clear();var l,d=Object(Ke["a"])(u.keys());try{for(d.s();!(l=d.n()).done;){var h=l.value;r.renderV8TraceMap.set(h,u.get(h)||[])}}catch(f){d.e(f)}finally{d.f()}}catch(a){Ot["a"].error(a)}}}},modules:{}}),kt=n("d257"),Dt=(n("46dc"),!0),zt=200,Et=30,It=50,At=Dt?400:window.innerHeight-zt-Et,Wt=window.innerWidth-2*It,Ft=Object(kt["e"])("platform")===st["a"].IOS,Ht=Object(r["r"])({name:"Performance",setup:function(){var e=Object(A["b"])(),t=Object(r["Z"])(e.state),n=t.renderCoreTrace,a=t.renderCoreTraceMap,i=t.renderV8Trace,o=t.renderV8TraceMap,s=t.startTime,c=t.endTime,u=t.operatState,l=t.timelineEventsStr,d=Object(r["Z"])(e.getters),h=d.isStartBtnDisabled,f=d.isEndBtnDisabled,p=d.isClearBtnDisabled,v=d.isInitState,m=d.isCollectingState,g=d.isAnalysingState,b=d.isCollectedState,O=Object(r["O"])(Wt),w=Object(r["O"])(At),y=Object(r["O"])(null),S=Object(r["O"])(null),T=Object(r["O"])(null);Object(r["G"])((function(){window.onresize=F()((function(){O.value=window.innerWidth-2*It,y&&y.value.resize()}),400,{leading:!0})}));var x=function(){e.commit(Ct.mutations.SetOperateState,st["d"].Collected),Object(r["y"])((function(){y.value.init(),S.value.init(),T.value.init()}))};return{renderCoreTrace:n,renderCoreTraceMap:a,renderV8Trace:i,renderV8TraceMap:o,startTime:s,endTime:c,operatState:u,timelineEventsStr:l,isStartBtnDisabled:h,isEndBtnDisabled:f,isClearBtnDisabled:p,isInitState:v,isCollectingState:m,isAnalysingState:g,isCollectedState:b,viewportWidth:O,viewportHeight:w,chartRef:y,coreFlamegraphRef:S,v8flamegraphRef:T,initVisualization:x}},data:function(){return{option:Ue,isIOS:Ft}},components:{FlameGraph:qe,PerformanceChart:G},created:function(){Ft&&Object(bt["a"])(this.onTraceDataCollected)},beforeDestroy:function(){Object(bt["o"])(this.onTraceDataCollected)},methods:{onTraceDataCollected:function(e,t){this.$store.dispatch(Ct.actions.SetV8Trace,{error:e,json:t}),this.initVisualization()},start:function(){this.$store.dispatch(Ct.actions.Start)},stop:function(){var e=this;this.$store.dispatch(Ct.actions.End),this.$store.dispatch(Ct.actions.GetFrameTimings).then((function(t){e.refreshChartData(t)})),this.$store.dispatch(Ct.actions.GetTimeline).then((function(){e.initVisualization()})),Ft||this.$store.dispatch(Ct.actions.GetV8Trace).then((function(){e.initVisualization()}))},refreshChartData:function(e){var t=e.ui,n=e.raster,r=e.maxXAxis,a=V()(this.option);a.series[0].data=n,a.series[1].data=t,a.xAxis.max=r,this.option=a},clear:function(){this.refreshChartData([[],[],0]),this.$store.dispatch(Ct.actions.Clear),this.$store.commit(Ct.mutations.SetOperateState,st["d"].Init)},exportData:function(){var e=this.timelineEventsStr,t="data:application/json;charset=utf-8,+ ".concat(encodeURIComponent(e)),n="tdf_devtools_events_".concat((new Date).getTime(),".json"),r=document.createElement("a");r.setAttribute("href",t),r.setAttribute("download",n),r.click()}}});n("f05e");const Vt=X()(Ht,[["render",I],["__scopeId","data-v-644eafad"]]);var Nt=Vt,Rt=(n("a471"),n("7dd6"),Object(r["j"])(Nt));Rt.use(a["d"]),Rt.use(Mt).mount("#app")},"962a":function(e,t,n){},f05e:function(e,t,n){"use strict";n("f954")},f954:function(e,t,n){}});
//# sourceMappingURL=core-performance.545d4d71.js.map
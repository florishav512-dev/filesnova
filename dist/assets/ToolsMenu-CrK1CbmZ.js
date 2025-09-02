import{r as l,j as e,L as k}from"./index-B-P-8OYA.js";import{c as s}from"./createLucideIcon-LAAGRmDe.js";import{F as t,I as o,S as b,A as m,Q as f,T as P}from"./FILESNOVANEWICON-BHe6sz7Q.js";/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],j=s("chevron-down",F);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]],C=s("external-link",D);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],E=s("layers",N);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]],I=s("lock-open",L);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",key:"1ngwbx"}]],S=s("wrench",M),T=[{title:"Convert to PDF",items:[{name:"Word to PDF",href:"/tools/docx-to-pdf",icon:t},{name:"PowerPoint to PDF",href:"/tools/pptx-to-pdf",icon:t},{name:"JPG to PDF",href:"/tools/jpg-to-pdf",icon:o},{name:"PNG to PDF",href:"/tools/png-to-pdf",icon:o},{name:"Images to PDF",href:"/tools/images-to-pdf",icon:o},{name:"Markdown to PDF",href:"/tools/markdown-to-pdf",icon:t},{name:"Text to PDF",href:"/tools/text-to-pdf",icon:t},{name:"HTML to PDF",href:"/tools/html-to-pdf",icon:t},{name:"EPUB to PDF",href:"/tools/epub-to-pdf",icon:t}]},{title:"Convert from / between",items:[{name:"PDF to JPG",href:"/tools/pdf-to-jpg",icon:o},{name:"SVG to PNG",href:"/tools/svg-to-png",icon:o},{name:"WEBP Converter",href:"/tools/webp-converter",icon:o},{name:"GIF to MP4",href:"/tools/gif-to-mp4",icon:o},{name:"XLSX to CSV",href:"/tools/xlsx-to-csv",icon:t},{name:"RTF to DOCX",href:"/tools/rtf-to-docx",icon:t},{name:"Image to PDF",href:"/tools/image-to-pdf",icon:o}]},{title:"Merge & Split",items:[{name:"Merge PDF",href:"/tools/merge-pdfs",icon:E},{name:"Split PDF",href:"/tools/split-pdf",icon:b},{name:"Create ZIP",href:"/tools/create-zip",icon:m},{name:"Combine ZIPs",href:"/tools/combine-zips",icon:m},{name:"Extract ZIP",href:"/tools/extract-zip",icon:m}]},{title:"PDF Tools",items:[{name:"Extract Images",href:"/tools/extract-images",icon:o},{name:"Extract Text (OCR)",href:"/tools/extract-text",icon:t},{name:"Unlock PDF",href:"/tools/unlock-pdf",icon:I}]},{title:"Images & QR",items:[{name:"Compress Images",href:"/tools/compress-image",icon:o},{name:"Image Resizer",href:"/tools/image-resizer",icon:o},{name:"Background Remover",href:"/tools/background-remover",icon:S},{name:"QR Generator",href:"/tools/qr-generator",icon:f},{name:"QR Scanner",href:"/tools/qr-scanner",icon:f}]},{title:"Text Utilities",items:[{name:"Case Converter",href:"/tools/case-converter",icon:P},{name:"Word Counter",href:"/tools/word-counter",icon:t}]}],G=({sections:g,triggerLabel:x="Tools",triggerClassName:u=""})=>{const y=g??T,[i,c]=l.useState(!1),d=l.useRef(null),p=l.useRef(null);l.useEffect(()=>{const n=a=>{if(!i)return;const h=a.target;d.current?.contains(h)||p.current?.contains(h)||c(!1)},r=a=>a.key==="Escape"&&c(!1);return document.addEventListener("mousedown",n),document.addEventListener("keydown",r),()=>{document.removeEventListener("mousedown",n),document.removeEventListener("keydown",r)}},[i]);const v="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none",w={backgroundImage:"linear-gradient(90deg, rgb(236,72,153), rgb(147,51,234), rgb(59,130,246))",backgroundSize:"200% 200%",animation:"gradientShift 6s ease infinite"};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}),e.jsxs("button",{ref:d,onClick:()=>c(n=>!n),"aria-haspopup":"menu","aria-expanded":i,className:`${v} ${u}`,style:w,children:[x,e.jsx(j,{className:"w-4 h-4 opacity-90"})]}),i&&e.jsx("div",{ref:p,role:"menu",className:`fixed right-4 top-20 w-[1000px] max-w-[96vw] max-h-[75vh] overflow-auto z-[100]
                     bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-5`,children:e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",children:y.map(n=>e.jsxs("div",{children:[e.jsx("h4",{className:"text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3",children:n.title}),e.jsx("ul",{className:"space-y-2",children:n.items.map(r=>{const a=r.icon??t;return e.jsx("li",{children:e.jsxs(k,{to:r.href,onClick:()=>c(!1),className:"group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors",children:[e.jsxs("span",{className:"flex items-center gap-2 text-sm text-gray-800 group-hover:text-gray-900",children:[e.jsx(a,{className:"w-4 h-4 text-gray-500 group-hover:text-gray-700"}),r.name]}),e.jsx(C,{className:"w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"})]})},r.href)})})]},n.title))})})]})};export{j as C,C as E,I as L,G as T,E as a};

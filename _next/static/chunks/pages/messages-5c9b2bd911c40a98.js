(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[313],{4755:function(e,t,s){(window.__NEXT_P=window.__NEXT_P||[]).push(["/messages",function(){return s(4066)}])},4066:function(e,t,s){"use strict";s.r(t),s.d(t,{default:function(){return d}});var r=s(5893),a=s(3487),n=s(7294),o=s(1664),i=s.n(o);function d(){let{session:e}=(0,a.k)(),[t,s]=(0,n.useState)([]),[o,d]=(0,n.useState)(!0),[l,c]=(0,n.useState)(""),h=(e,t)=>{if(!t)return e;let s=t.length,r="";for(let a=0;a<e.length;a++)r+=String.fromCharCode(e.charCodeAt(a)^t.charCodeAt(a%s));return r},u=e=>{if(!e)return"";try{let t=atob(e),s=new Uint8Array(t.length);for(let e=0;e<t.length;e++)s[e]=t.charCodeAt(e);return new TextDecoder().decode(s)}catch(e){return console.error("Decoding error:",e),""}},g=async(e,t)=>{try{var s,r;let a=await fetch("https://wax-testnet.eosphere.io/v1/history/get_transaction",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:e})});if(!a.ok)throw Error("HTTP error! status: ".concat(a.status));let n=(await a.json()).traces.find(e=>"sendmsg"===e.act.name&&"hashtesttest"===e.act.account);if(null==n?void 0:null===(r=n.act)||void 0===r?void 0:null===(s=r.data)||void 0===s?void 0:s.message){let e=u(n.act.data.message);return h(e,t.toString())}return"Message not found"}catch(e){return console.error("Error fetching transaction:",e),"Error loading message"}},p=async()=>{try{let e=await fetch("https://wax-testnet.eosphere.io/v1/chain/get_table_rows",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:"hashtesttest",scope:"hashtesttest",table:"idtable",limit:100,json:!0,index_position:"5",key_type:"i64",lower_bound:"1704067200",upper_bound:"1735689600"})});if(!e.ok)throw Error("HTTP error! status: ".concat(e.status));let t=await e.json();if(t.rows&&Array.isArray(t.rows)){let e=(await Promise.all(t.rows.map(async e=>{let t=x(e.release_date)?await g(e.hash_str,e.id):"Message Locked";return{id:e.id,user:e.user,release_date:e.release_date.toString(),hash_str:e.hash_str,message:t}}))).sort((e,t)=>new Date(t.release_date).getTime()-new Date(e.release_date).getTime());s(e)}else c("No messages found")}catch(e){console.error("Error fetching messages:",e),c("Failed to load messages")}finally{d(!1)}};(0,n.useEffect)(()=>{p()},[]);let f=e=>e.split("T")[0],x=e=>new Date>=new Date(e);return(0,r.jsxs)("div",{style:{padding:"20px"},children:[(0,r.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"},children:[(0,r.jsx)("h1",{children:"Time Capsule Messages"}),(0,r.jsx)(i(),{href:"/",style:{padding:"10px 20px",fontSize:"16px",cursor:"pointer",backgroundColor:"#f0f0f0",textDecoration:"none",color:"black",borderRadius:"4px"},children:"Back to Home"})]}),o?(0,r.jsx)("p",{children:"Loading messages..."}):l?(0,r.jsx)("p",{style:{color:"red"},children:l}):0===t.length?(0,r.jsx)("p",{children:"No messages found"}):(0,r.jsx)("div",{style:{display:"grid",gap:"20px"},children:t.map(e=>(0,r.jsxs)("div",{style:{border:"1px solid #ccc",borderRadius:"8px",padding:"15px",backgroundColor:x(e.release_date.toString())?"#f9f9f9":"#f0f0f0"},children:[(0,r.jsxs)("div",{style:{marginBottom:"10px"},children:[(0,r.jsx)("strong",{children:"From:"})," ",e.user]}),(0,r.jsxs)("div",{style:{marginBottom:"10px"},children:[(0,r.jsx)("strong",{children:"Release Date:"})," ",f(e.release_date.toString())]}),(0,r.jsx)("div",{style:{marginBottom:"10px"},children:x(e.release_date.toString())?(0,r.jsxs)("div",{children:[(0,r.jsx)("strong",{children:"Message: "}),e.message]}):(0,r.jsxs)("div",{children:[(0,r.jsx)("strong",{children:"Status: "}),"Locked until release date"]})})]},e.id))})]})}}},function(e){e.O(0,[664,888,774,179],function(){return e(e.s=4755)}),_N_E=e.O()}]);
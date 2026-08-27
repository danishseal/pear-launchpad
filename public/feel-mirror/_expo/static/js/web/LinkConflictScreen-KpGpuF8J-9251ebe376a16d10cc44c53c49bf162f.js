var _sentryDebugIds,_sentryDebugIdIdentifier;void 0===_sentryDebugIds&&(_sentryDebugIds={});try{var stack=(new Error).stack;stack&&(_sentryDebugIds[stack]="13249f4b-510e-4e3d-818e-99e371810ff3",_sentryDebugIdIdentifier="sentry-dbid-13249f4b-510e-4e3d-818e-99e371810ff3")}catch(e){}
var SENTRY_RELEASE;SENTRY_RELEASE={name: "Feel.cash", version: "0.0.19"};
__d(function(_g,r,_i,_a,_m,_e,_d){"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"LinkConflictScreen",{enumerable:!0,get:function(){return M}}),Object.defineProperty(_e,"LinkConflictScreenView",{enumerable:!0,get:function(){return $}}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return M}});var t=r(_d[0]),n=e(r(_d[1])),s=e(r(_d[2])),o=r(_d[3]),a=r(_d[4]),i=r(_d[5]),c=r(_d[6]),l=r(_d[7]),d=r(_d[8]),u=r(_d[9]),f=r(_d[10]),h=r(_d[11]),x=e(r(_d[12])),p=e(r(_d[13]));r(_d[14]),r(_d[15]),r(_d[16]),r(_d[17]),r(_d[18]),r(_d[19]),r(_d[20]),r(_d[21]),r(_d[22]),r(_d[23]),r(_d[24]),r(_d[25]),r(_d[26]),r(_d[27]),r(_d[28]),r(_d[29]),r(_d[30]),r(_d[31]),r(_d[32]),r(_d[33]),r(_d[34]),r(_d[35]),r(_d[36]),r(_d[37]);const g=i.styled.span`
  && {
    width: 82px;
    height: 82px;
    border-width: 4px;
    border-style: solid;
    border-color: ${e=>e.color??"var(--privy-color-accent)"};
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1.2s linear infinite;
    transition: border-color 800ms;
    border-bottom-color: ${e=>e.color??"var(--privy-color-accent)"};
  }
`;function y(e){return(0,t.jsxs)("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},e,{children:[(0,t.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,t.jsx)("line",{x1:"12",x2:"12",y1:"8",y2:"12"}),(0,t.jsx)("line",{x1:"12",x2:"12.01",y1:"16",y2:"16"})]}))}const m=({onTransfer:e,isTransferring:n,transferSuccess:s})=>(0,t.jsx)(a.P,Object.assign({},s?{success:!0,children:"Success!"}:{warn:!0,loading:n,onClick:e,children:"Transfer and delete account"})),j=i.styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding-bottom: 16px;
`,b=i.styled.div`
  display: flex;
  flex-direction: column;
  && p {
    font-size: 14px;
  }
  width: 100%;
  gap: 16px;
`,v=i.styled.div`
  display: flex;
  cursor: pointer;
  align-items: center;
  width: 100%;
  border: 1px solid var(--privy-color-foreground-4) !important;
  border-radius: var(--privy-border-radius-md);
  padding: 8px 10px;
  font-size: 14px;
  font-weight: 500;
  gap: 8px;
`,T=(0,i.styled)(x.default)`
  position: relative;
  width: ${({$iconSize:e})=>`${e}px`};
  height: ${({$iconSize:e})=>`${e}px`};
  color: var(--privy-color-foreground-3);
  margin-left: auto;
`,w=(0,i.styled)(p.default)`
  position: relative;
  width: 15px;
  height: 15px;
  color: var(--privy-color-foreground-3);
  margin-left: auto;
`,k=i.styled.ol`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  width: 100%;
  text-align: left;
`,C=i.styled.li`
  font-size: 14px;
  list-style-type: auto;
  list-style-position: outside;
  margin-left: 1rem;
  margin-bottom: 0.5rem; /* Adjust the margin as needed */

  &:last-child {
    margin-bottom: 0; /* Remove margin from the last item */
  }
`,A=i.styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  margin: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
`;let S=()=>(0,t.jsx)(A,{children:(0,t.jsx)(T,{$iconSize:60})});const W=({address:e,onClose:n,onRetry:o,onTransfer:i,isTransferring:c,transferSuccess:d})=>{let{defaultChain:u}=(0,h.u)(),f=u.blockExplorers?.default.url??"https://etherscan.io";return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(a.M,{onClose:n,backFn:o}),(0,t.jsxs)(j,{children:[(0,t.jsx)(S,{}),(0,t.jsxs)(b,{children:[(0,t.jsx)("h3",{children:"Check account assets before transferring"}),(0,t.jsx)("p",{children:"Before transferring, ensure there are no assets in the other account. Assets in that account will not transfer automatically and may be lost."}),(0,t.jsxs)(k,{children:[(0,t.jsx)("p",{children:" To check your balance, you can:"}),(0,t.jsx)(C,{children:"Log out and log back into the other account, or "}),(0,t.jsxs)(C,{children:["Copy your wallet address and use a"," ",(0,t.jsx)("u",{children:(0,t.jsx)("a",{target:"_blank",href:f,children:"block explorer"})})," ","to see if the account holds any assets."]})]}),(0,t.jsxs)(v,{onClick:()=>navigator.clipboard.writeText(e).catch(console.error),children:[(0,t.jsx)(s.default,{color:"var(--privy-color-foreground-1)",strokeWidth:2,height:"28px",width:"28px"}),(0,t.jsx)(l.A,{address:e,showCopyIcon:!1}),(0,t.jsx)(w,{})]}),(0,t.jsx)(m,{onTransfer:i,isTransferring:c,transferSuccess:d})]})]}),(0,t.jsx)(a.B,{})]})},M={component:()=>{let{initiateAccountTransfer:e,closePrivyModal:n}=(0,d.u)(),{data:s,navigate:a,lastScreen:i,setModalData:c}=(0,u.u)(),[l,f]=(0,o.useState)(void 0),[h,x]=(0,o.useState)(!1),[p,g]=(0,o.useState)(!1),y=async()=>{try{if(!s?.accountTransfer?.nonce||!s?.accountTransfer?.account)throw Error("missing account transfer inputs");g(!0),await e({nonce:s?.accountTransfer?.nonce,account:s?.accountTransfer?.account,accountType:s?.accountTransfer?.linkMethod,externalWalletMetadata:s?.accountTransfer?.externalWalletMetadata,telegramWebAppData:s?.accountTransfer?.telegramWebAppData,telegramAuthResult:s?.accountTransfer?.telegramAuthResult,farcasterEmbeddedAddress:s?.accountTransfer?.farcasterEmbeddedAddress,oAuthUserInfo:s?.accountTransfer?.oAuthUserInfo}),x(!0),g(!1),setTimeout(n,1e3)}catch(e){c({errorModalData:{error:e,previousScreen:i||"LinkConflictScreen"}}),a("ErrorScreen",!0)}};return l?(0,t.jsx)(W,{address:l,onClose:n,onRetry:()=>f(void 0),onTransfer:y,isTransferring:p,transferSuccess:h}):(0,t.jsx)($,{onClose:n,onInfo:()=>f(s?.accountTransfer?.embeddedWalletAddress),onContinue:()=>f(s?.accountTransfer?.embeddedWalletAddress),onTransfer:y,isTransferring:p,transferSuccess:h,data:s})}},$=({onClose:e,onContinue:s,onInfo:o,onTransfer:i,transferSuccess:l,isTransferring:d,data:u})=>{if(!u?.accountTransfer?.linkMethod||!u?.accountTransfer?.displayName)return;let h={method:u?.accountTransfer?.linkMethod,handle:u?.accountTransfer?.displayName,disclosedAccount:u?.accountTransfer?.embeddedWalletAddress?{type:"wallet",handle:u?.accountTransfer?.embeddedWalletAddress}:void 0};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(a.M,{closeable:!0}),(0,t.jsxs)(j,{children:[(0,t.jsx)(c.e,{children:(0,t.jsxs)("div",{children:[(0,t.jsx)(g,{color:"var(--privy-color-error)"}),(0,t.jsx)(n.default,{height:38,width:38,stroke:"var(--privy-color-error)"})]})}),(0,t.jsxs)(b,{children:[(0,t.jsxs)("h3",{children:[(function(e){switch(e){case"sms":return"Phone number";case"email":return"Email address";case"siwe":return"Wallet address";case"siws":return"Solana wallet address";case"linkedin":return"LinkedIn profile";case"google":case"apple":case"discord":case"github":case"instagram":case"spotify":case"tiktok":case"line":case"twitch":case"twitter":case"telegram":case"farcaster":return`${(0,f.e)(e.replace("_oauth",""))} profile`;default:return e.startsWith("privy:")?"Cross-app account":e}})(h.method)," is associated with another account"]}),(0,t.jsxs)("p",{children:["Do you want to transfer",(0,t.jsx)("b",{children:h.handle?` ${h.handle}`:""})," to this account instead? This will delete your other account."]}),(0,t.jsx)(z,{onClick:o,disclosedAccount:h.disclosedAccount})]}),(0,t.jsxs)(b,{style:{gap:12,marginTop:12},children:[u?.accountTransfer?.embeddedWalletAddress?(0,t.jsx)(a.P,{onClick:s,children:"Continue"}):(0,t.jsx)(m,{onTransfer:i,transferSuccess:l,isTransferring:d}),(0,t.jsx)(a.S,{onClick:e,children:"No thanks"})]})]}),(0,t.jsx)(a.B,{})]})};function z({disclosedAccount:e,onClick:n}){return e?(0,t.jsxs)(v,{onClick:n,children:[(0,t.jsx)(s.default,{color:"var(--privy-color-foreground-1)",strokeWidth:2,height:"28px",width:"28px"}),(0,t.jsx)(l.A,{address:e.handle,showCopyIcon:!1}),(0,t.jsx)(y,{width:15,height:15,color:"var(--privy-color-foreground-3)",style:{marginLeft:"auto"}})]}):null}},12524,[1404,12649,12618,1194,12580,8154,13031,12629,5052,8149,13032,5054,13029,13030,8171,3447,5061,5056,5057,5062,3256,3628,4638,4830,8153,5049,5050,5053,3016,5063,8147,8148,12581,12582,12583,12584,12578,5055]);
__d(function(g,r,i,a,m,e,d){var t=r(d[0]).default;const n=["title","titleId"],l=r(d[1]);function o(o,s){let{title:c,titleId:u}=o,f=t(o,n);return l.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:s,"aria-labelledby":u},f),c?l.createElement("title",{id:u},c):null,l.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"}))}const s=l.forwardRef(o);m.exports=s},13030,[15,1194]);
//# sourceMappingURL=/feel-mirror/_expo/static/js/web/LinkConflictScreen-KpGpuF8J-9251ebe376a16d10cc44c53c49bf162f.js.map
//# debugId=13249f4b-510e-4e3d-818e-99e371810ff3
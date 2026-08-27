var _sentryDebugIds,_sentryDebugIdIdentifier;void 0===_sentryDebugIds&&(_sentryDebugIds={});try{var stack=(new Error).stack;stack&&(_sentryDebugIds[stack]="d2fa84b2-892b-43d5-aafc-95b863e1585d",_sentryDebugIdIdentifier="sentry-dbid-d2fa84b2-892b-43d5-aafc-95b863e1585d")}catch(e){}
var SENTRY_RELEASE;SENTRY_RELEASE={name: "Feel.cash", version: "0.0.19"};
__d(function(_g,_r,_i,_a,_m,_e,_d){"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"FarcasterConnectStatusScreen",{enumerable:!0,get:function(){return k}}),Object.defineProperty(_e,"FarcasterConnectStatusView",{enumerable:!0,get:function(){return T}}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return k}});var e=_r(_d[0]),t=_r(_d[1]),r=_r(_d[2]),a=_r(_d[3]),i=_r(_d[4]),n=_r(_d[5]),o=_r(_d[6]),s=_r(_d[7]),l=_r(_d[8]),c=_r(_d[9]),d=_r(_d[10]),u=_r(_d[11]),p=_r(_d[12]),h=_r(_d[13]),g=_r(_d[14]),m=_r(_d[15]),f=_r(_d[16]),y=_r(_d[17]);_r(_d[18]),_r(_d[19]),_r(_d[20]),_r(_d[21]),_r(_d[22]),_r(_d[23]),_r(_d[24]),_r(_d[25]),_r(_d[26]),_r(_d[27]),_r(_d[28]),_r(_d[29]),_r(_d[30]),_r(_d[31]),_r(_d[32]),_r(_d[33]),_r(_d[34]),_r(_d[35]),_r(_d[36]),_r(_d[37]),_r(_d[38]),_r(_d[39]),_r(_d[40]),_r(_d[41]),_r(_d[42]),_r(_d[43]),_r(_d[44]),_r(_d[45]),_r(_d[46]),_r(_d[47]),_r(_d[48]),_r(_d[49]),_r(_d[50]),_r(_d[51]),_r(_d[52]),_r(_d[53]),_r(_d[54]),_r(_d[55]),_r(_d[56]),_r(_d[57]),_r(_d[58]),_r(_d[59]),_r(_d[60]),_r(_d[61]),_r(_d[62]),_r(_d[63]),_r(_d[64]);let v=a.styled.div`
  width: 100%;
`,x=a.styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  height: 56px;
  background: ${e=>e.$disabled?"var(--privy-color-background-2)":"var(--privy-color-background)"};
  border: 1px solid var(--privy-color-foreground-4);
  border-radius: var(--privy-border-radius-md);

  &:hover {
    border-color: ${e=>e.$disabled?"var(--privy-color-foreground-4)":"var(--privy-color-foreground-3)"};
  }
`,b=a.styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
`,S=a.styled.span`
  display: block;
  font-size: 16px;
  line-height: 24px;
  color: ${e=>e.$disabled?"var(--privy-color-foreground-2)":"var(--privy-color-foreground)"};
  overflow: hidden;
  text-overflow: ellipsis;
  /* Use single-line truncation without nowrap to respect container width */
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  word-break: break-all;

  @media (min-width: 441px) {
    font-size: 14px;
    line-height: 20px;
  }
`,w=(0,a.styled)(S)`
  color: var(--privy-color-foreground-3);
  font-style: italic;
`,E=(0,a.styled)(c.L)`
  margin-bottom: 0.5rem;
`,C=(0,a.styled)(l.S)`
  && {
    gap: 0.375rem;
    font-size: 14px;
    flex-shrink: 0;
  }
`;const j=({value:r,title:a,placeholder:i,className:n,showCopyButton:o=!0,truncate:l,maxLength:c=40,disabled:d=!1})=>{let[u,p]=(0,t.useState)(!1),h=l&&r?((e,t,r)=>{if((e=e.startsWith("https://")?e.slice(8):e).length<=r)return e;if("middle"===t){let t=Math.ceil(r/2)-2,a=Math.floor(r/2)-1;return`${e.slice(0,t)}...${e.slice(-a)}`}return`${e.slice(0,r-3)}...`})(r,l,c):r;return(0,t.useEffect)(()=>{if(u){let e=setTimeout(()=>p(!1),3e3);return()=>clearTimeout(e)}},[u]),(0,e.jsxs)(v,{className:n,children:[a&&(0,e.jsx)(E,{children:a}),(0,e.jsxs)(x,{$disabled:d,children:[(0,e.jsx)(b,{children:r?(0,e.jsx)(S,{$disabled:d,title:r,children:h}):(0,e.jsx)(w,{$disabled:d,children:i||"No value"})}),o&&r&&(0,e.jsx)(C,{onClick:function(e){e.stopPropagation(),navigator.clipboard.writeText(r).then(()=>p(!0)).catch(console.error)},size:"sm",children:(0,e.jsxs)(e.Fragment,u?{children:["Copied",(0,e.jsx)(s.Check,{size:14})]}:{children:["Copy",(0,e.jsx)(s.Copy,{size:14})]})})]})]})},T=({connectUri:t,loading:a,success:s,errorMessage:l,onBack:c,onClose:d,onOpenFarcaster:u})=>(0,e.jsx)(f.S,r.isMobile||a?r.isIOS?{title:l?l.message:"Sign in with Farcaster",subtitle:l?l.detail:"To sign in with Farcaster, please open the Farcaster app.",icon:y.F,iconVariant:"loading",iconLoadingStatus:{success:s,fail:!!l},primaryCta:t&&u?{label:"Open Farcaster app",onClick:u}:void 0,onBack:c,onClose:d,watermark:!0}:{title:l?l.message:"Signing in with Farcaster",subtitle:l?l.detail:"This should only take a moment",icon:y.F,iconVariant:"loading",iconLoadingStatus:{success:s,fail:!!l},onBack:c,onClose:d,watermark:!0,children:t&&r.isMobile&&(0,e.jsx)(A,{children:(0,e.jsx)(n.O,{text:"Take me to Farcaster",url:t,color:"#8a63d2"})})}:{title:"Sign in with Farcaster",subtitle:"Scan with your phone's camera to continue.",onBack:c,onClose:d,watermark:!0,children:(0,e.jsxs)(F,{children:[(0,e.jsx)(O,{children:t?(0,e.jsx)(o.Q,{url:t,size:275,squareLogoElement:y.F}):(0,e.jsx)(R,{children:(0,e.jsx)(i.L,{})})}),(0,e.jsxs)(_,{children:[(0,e.jsx)(L,{children:"Or copy this link and paste it into a phone browser to open the Farcaster app."}),t&&(0,e.jsx)(j,{value:t,truncate:"end",maxLength:30,showCopyButton:!0,disabled:!0})]})]})}),k={component:()=>{let{authenticated:r,logout:a,ready:i,user:n}=(0,g.u)(),{lastScreen:o,navigate:s,navigateBack:l,setModalData:c}=(0,h.u)(),f=(0,d.u)(),{getAuthFlow:y,loginWithFarcaster:v,closePrivyModal:x,createAnalyticsEvent:b}=(0,p.u)(),[S,w]=(0,t.useState)(void 0),[E,C]=(0,t.useState)(!1),[j,k]=(0,t.useState)(!1),A=(0,t.useRef)([]),F=y(),O=F?.meta.connectUri;return(0,t.useEffect)(()=>{let e=Date.now(),t=setInterval(async()=>{let r=await F.pollForReady.execute(),a=Date.now()-e;if(r){clearInterval(t),C(!0);try{await v(),k(!0)}catch(e){let t={retryable:!1,message:"Authentication failed"};if(e?.privyErrorCode===u.a.ALLOWLIST_REJECTED)return void s("AllowlistRejectionScreen");if(e?.privyErrorCode===u.a.USER_LIMIT_REACHED)return console.error(new u.j(e).toString()),void s("UserLimitReachedScreen");if(e?.privyErrorCode===u.a.USER_DOES_NOT_EXIST)return void s("AccountNotFoundScreen");if(e?.privyErrorCode===u.a.LINKED_TO_ANOTHER_USER)t.detail=e.message??"This account has already been linked to another user.";else{if(e?.privyErrorCode===u.a.ACCOUNT_TRANSFER_REQUIRED&&e.data?.data?.nonce)return c({accountTransfer:{nonce:e.data?.data?.nonce,account:e.data?.data?.subject,displayName:e.data?.data?.account?.displayName,linkMethod:"farcaster",embeddedWalletAddress:e.data?.data?.otherUser?.embeddedWalletAddress,farcasterEmbeddedAddress:e.data?.data?.otherUser?.farcasterEmbeddedAddress}}),void s("LinkConflictScreen");e?.privyErrorCode===u.a.INVALID_CREDENTIALS?(t.retryable=!0,t.detail="Something went wrong. Try again."):e?.privyErrorCode===u.a.TOO_MANY_REQUESTS&&(t.detail="Too many requests. Please wait before trying again.")}w(t)}}else a>12e4&&(clearInterval(t),w({retryable:!0,message:"Authentication failed",detail:"The request timed out. Try again."}))},2e3);return()=>{clearInterval(t),A.current.forEach(e=>clearTimeout(e))}},[]),(0,t.useEffect)(()=>{if(i&&r&&j&&n){if(f?.legal.requireUsersAcceptTerms&&!n.hasAcceptedTerms){let e=setTimeout(()=>{s("AffirmativeConsentScreen")},d.r);return()=>clearTimeout(e)}j&&((0,m.s)(n,f.embeddedWallets)?A.current.push(setTimeout(()=>{c({createWallet:{onSuccess:()=>{},onFailure:e=>{console.error(e),b({eventName:"embedded_wallet_creation_failure_logout",payload:{error:e,screen:"FarcasterConnectStatusScreen"}}),a()},callAuthOnSuccessOnClose:!0}}),s("EmbeddedWalletOnAccountCreateScreen")},d.r)):A.current.push(setTimeout(()=>x({shouldCallAuthOnSuccess:!0,isSuccess:!0}),d.r)))}},[j,i,r,n]),(0,e.jsx)(T,{connectUri:O,loading:E,success:j,errorMessage:S,onBack:o?l:void 0,onClose:x,onOpenFarcaster:()=>{O&&(window.location.href=O)}})}};let A=a.styled.div`
  margin-top: 24px;
`,F=a.styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`,O=a.styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 275px;
`,_=a.styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`,L=a.styled.div`
  font-size: 0.875rem;
  text-align: center;
  color: var(--privy-color-foreground-2);
`,R=a.styled.div`
  position: relative;
  width: 82px;
  height: 82px;
`},12514,[1404,1194,5063,8154,8171,12664,12594,12578,12580,12647,5054,5056,5052,8149,5049,12589,12579,12639,3447,5061,5062,3256,3628,4638,4830,8153,5053,3016,8147,8148,10920,12581,12582,12583,12584,5055,5057,5050,4637,5048,4678,5065,5120,8125,8126,8127,4873,4832,8128,8142,3200,8145,8146,8150,8172,8381,8382,8383,4642,8384,8385,4858,9804,12585,12586]);
//# sourceMappingURL=/feel-mirror/_expo/static/js/web/FarcasterConnectStatusScreen-FVkT-G3_-33f15f6bf6e0d01570b3b82b09058c80.js.map
//# debugId=d2fa84b2-892b-43d5-aafc-95b863e1585d
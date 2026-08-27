var _sentryDebugIds,_sentryDebugIdIdentifier;void 0===_sentryDebugIds&&(_sentryDebugIds={});try{var stack=(new Error).stack;stack&&(_sentryDebugIds[stack]="d346517c-0aa9-4026-9b0c-db8bed2ad340",_sentryDebugIdIdentifier="sentry-dbid-d346517c-0aa9-4026-9b0c-db8bed2ad340")}catch(e){}
var SENTRY_RELEASE;SENTRY_RELEASE={name: "Feel.cash", version: "0.0.19"};
__d(function(g,_r,_i,_a,_m,_e2,_d){"use strict";Object.defineProperty(_e2,'__esModule',{value:!0}),Object.defineProperty(_e2,"default",{enumerable:!0,get:function(){return be}});var e=_r(_d[0]),r=_r(_d[1]),t=_r(_d[2]),n=_r(_d[3]),s=_r(_d[4]),o=_r(_d[5]),i=_r(_d[6]),a=_r(_d[7]),l=_r(_d[8]),d=_r(_d[9]),c=_r(_d[10]),u=_r(_d[11]),m=_r(_d[12]),p=_r(_d[13]),h=_r(_d[14]),f=_r(_d[15]),y=_r(_d[16]),b=_r(_d[17]);_r(_d[18]),_r(_d[19]),_r(_d[20]),_r(_d[21]),_r(_d[22]),_r(_d[23]),_r(_d[24]),_r(_d[25]),_r(_d[26]),_r(_d[27]),_r(_d[28]),_r(_d[29]),_r(_d[30]),_r(_d[31]),_r(_d[32]),_r(_d[33]),_r(_d[34]),_r(_d[35]),_r(_d[36]),_r(_d[37]),_r(_d[38]),_r(_d[39]),_r(_d[40]),_r(_d[41]);class x extends r.Component{static getDerivedStateFromError(){return{hasError:!0}}componentDidCatch(e,r){this.props.onError(e)}componentDidUpdate(e){e.resetKey!==this.props.resetKey&&this.state.hasError&&this.setState({hasError:!1})}render(){return this.state.hasError?null:this.props.children}constructor(...e){super(...e),this.state={hasError:!1}}}function C(e,r,t){let n=Number(e);return Number.isFinite(n)&&0!==n?n>=.01?`1 ${r} \u2248 ${v(n)} ${t}`:`${v(1/n)} ${r} \u2248 1 ${t}`:`1 ${r} \u2248 ${e} ${t}`}function v(e){return e>=1e3?new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(Math.round(e)):e>=100?new Intl.NumberFormat("en-US",{maximumFractionDigits:1}).format(e):e>=1?new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(e):new Intl.NumberFormat("en-US",{maximumFractionDigits:4}).format(e)}function E(e,r){let t=Number(e);if(!Number.isFinite(t)||0===t)return e;let n=null!=r?t/10**r:t;return n>=1e3?new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n):n>=1?new Intl.NumberFormat("en-US",{maximumFractionDigits:4}).format(n):n>=1e-4?new Intl.NumberFormat("en-US",{maximumFractionDigits:6}).format(n):new Intl.NumberFormat("en-US",{maximumSignificantDigits:4}).format(n)}function w({address:e,caip2:r,config:t}){for(let n of t.currencies){let t=n.chains.find(t=>t.caip2===r&&t.address.toLowerCase()===e.toLowerCase());if(t)return{symbol:n.symbol.toUpperCase(),decimals:t.decimals}}return{symbol:e,decimals:void 0}}function j(e,r){return r[e]?.displayName??e}function _(e,r){if(!e.chains[r.destinationChain])return`Unsupported destination chain: "${r.destinationChain}". Check that the chain is in CAIP-2 format (e.g. "eip155:8453") and is supported for deposit addresses.`;let t=r.destinationCurrency.toLowerCase();return e.currencies.some(e=>e.chains.some(e=>e.caip2===r.destinationChain&&e.address.toLowerCase()===t))?null:`Unsupported destination currency "${r.destinationCurrency}" on chain "${r.destinationChain}". Check that this token address is supported on the specified chain.`}let T=new Set(["ROUTE_UNAVAILABLE","UNEXPECTED_STATE","TIMEOUT_WAITING_FOR_NEXT_ORDER","TIMEOUT_ORDER_COMPLETION","DEPOSIT_FAILED","DEPOSIT_REFUNDED","USER_EXITED","AMOUNT_TOO_LOW","INSUFFICIENT_LIQUIDITY","UNSUPPORTED_CHAIN","UNSUPPORTED_CURRENCY","UNSUPPORTED_ROUTE","NO_SWAP_ROUTES_FOUND","NO_INTERNAL_SWAP_ROUTES_FOUND","NO_QUOTES","SANCTIONED_WALLET_ADDRESS","REFUND_WALLET_CREATION_FAILED","DEPOSIT_ADDRESSES_NOT_ENABLED","NOT_AUTHENTICATED"]);function k(e){return T.has(e)}function S(e){return k(e)?e:"UNKNOWN_ERROR"}function N(){let{params:e,setModalState:t}=(0,n.a)(),{privy:s}=(0,u.u)(),o=(function(){let{privy:e,refreshSessionAndUser:t}=(0,u.u)();return(0,r.useCallback)((r,n)=>n?Promise.resolve({ok:!0,address:n}):d.depositAddress.resolveRefundAddress({privy:e,caip2:r,onWalletCreated:t}),[e,t])})(),[i,a]=(0,r.useState)(!1);return{fetchQuote:(0,r.useCallback)(async(r,n,i)=>{if(e){a(!0);try{let a=await o(r.caip2,e.refundAddress);if(!a.ok)return void t({step:"error",code:S(a.error)});let l=await s.fetchPrivyRoute(c.CreateDepositAddressQuote,{body:Object.assign({source_chain:r.caip2,source_currency:r.currencyAddress,destination_chain:e.destinationChain,destination_currency:e.destinationCurrency,destination_address:e.destinationAddress,refund_address:a.address},null!=e.slippageBps?{slippage_bps:e.slippageBps}:{})});t({step:"address",selectedCurrency:n,selectedChain:r,availableChains:i,quote:l})}catch(e){let r=e instanceof Error?e:Error(String(e)),n="status"in r&&"number"==typeof r.status?r.status:void 0;t({step:"error",code:r instanceof d.PrivyApiError&&"feature_not_enabled"===r.code?"DEPOSIT_ADDRESSES_NOT_ENABLED":n&&n>=500?"UNKNOWN_ERROR":S(r.message),message:r.message})}finally{a(!1)}}},[e,s,o,t]),isFetching:i}}function U(e,r){switch(e.status){case"completed":return r({step:"complete",order:e});case"refunded":return r({step:"refunded",order:e});case"failed":return r({step:"failed",order:e});case"executing":return r({step:"processing",order:e});default:return}}const O=({sourceAmount:r,sourceSymbol:t,sourceChainName:n,sourceDecimals:i,destinationAmount:a,destSymbol:l,destChainName:d,destDecimals:c,onClose:u})=>(0,e.jsx)(o.C,{icon:s.Check,iconVariant:"success",title:"Transfer complete",subtitle:a?`Received ${E(r,i)} ${t} on ${n} and converted it to ${E(a,c)} ${l} on ${d}. Funds are available to use.`:`Your ${t} has been received and is now available in your wallet.`,showClose:!0,onClose:u,primaryCta:{label:"Done",onClick:u},watermark:!1});function A(){let{state:t,configData:s,close:o}=(0,n.c)("complete"),{order:i}=t,{sourceSymbol:a,sourceChainName:l,sourceDecimals:d,destSymbol:c,destChainName:u,destDecimals:m}=(0,r.useMemo)(()=>{let e=w({address:i.source_currency,caip2:i.source_chain,config:s}),r=w({address:i.destination_currency,caip2:i.destination_chain,config:s});return{sourceSymbol:e.symbol,sourceChainName:j(i.source_chain,s.chains),sourceDecimals:e.decimals,destSymbol:r.symbol,destChainName:j(i.destination_chain,s.chains),destDecimals:r.decimals}},[i,s]);return(0,e.jsx)(O,{sourceAmount:i.source_amount,sourceSymbol:a,sourceChainName:l,sourceDecimals:d,destinationAmount:i.destination_amount,destSymbol:c,destChainName:u,destDecimals:m,onClose:o})}function D(){let{modalState:t,setModalState:i,config:a,retryConfig:l,close:d}=(0,n.a)();if("error"!==t.step)throw Error("UNEXPECTED_STATE");let{code:c}=t,{title:u,subtitle:m,detail:p,iconVariant:h}=(e=>{switch(e){case"AMOUNT_TOO_LOW":return{title:"Amount too low",subtitle:"The deposit amount is below the minimum for this route.",detail:"Try a larger amount or a different token.",iconVariant:"warning"};case"INSUFFICIENT_LIQUIDITY":return{title:"Insufficient liquidity",subtitle:"There isn't enough liquidity for this route right now.",detail:"Try a smaller amount or a different network.",iconVariant:"warning"};case"UNSUPPORTED_CHAIN":return{title:"Unsupported chain",subtitle:"Deposits from this chain type aren't supported yet. Try a different network.",iconVariant:"warning"};case"UNSUPPORTED_CURRENCY":case"UNSUPPORTED_ROUTE":case"ROUTE_UNAVAILABLE":case"NO_SWAP_ROUTES_FOUND":case"NO_INTERNAL_SWAP_ROUTES_FOUND":case"NO_QUOTES":return{title:"Route not available",subtitle:"This deposit route isn't supported right now. Try a different token or network.",iconVariant:"warning"};case"SANCTIONED_WALLET_ADDRESS":return{title:"Address restricted",subtitle:"This address cannot be used for deposits due to compliance restrictions.",iconVariant:"warning"};case"REFUND_WALLET_CREATION_FAILED":return{title:"Unable to set up refund address",subtitle:"We couldn't create a wallet to receive refunds on this chain. Please try again or select a different network.",iconVariant:"warning"};case"DEPOSIT_ADDRESSES_NOT_ENABLED":return{title:"Not enabled",subtitle:"Deposit addresses are not enabled for this app.",iconVariant:"warning"};case"NOT_AUTHENTICATED":return{title:"Not signed in",subtitle:"Please sign in to continue with your deposit.",iconVariant:"warning"};case"TIMEOUT_WAITING_FOR_NEXT_ORDER":case"TIMEOUT_ORDER_COMPLETION":return{title:"Taking longer than expected",subtitle:"Your funds are safe. The deposit is still being processed \u2014 check back later.",iconVariant:"subtle"};default:return{title:"Something went wrong",subtitle:"We couldn't complete your request. Please try again.",iconVariant:"subtle"}}})(c),[f,y]=(0,r.useState)(!1);return(0,e.jsx)(o.C,{icon:s.AlertTriangle,iconVariant:h,title:u,subtitle:p?`${m} ${p}`:m,showClose:!0,onClose:d,primaryCta:{label:"Try again",onClick:async()=>{if("ready"!==a.status){y(!0);try{await l(),i({step:"token"})}catch{y(!1)}}else i({step:"token"})},loading:f},watermark:!0})}function I(){let{state:r,close:t}=(0,n.c)("failed"),{order:o}=r;return(0,e.jsx)(a.S,{icon:s.AlertTriangle,iconVariant:"error",title:"Transfer failed",subtitle:"Something went wrong processing your transfer.",showClose:!0,onClose:t,primaryCta:{label:"Done",onClick:t},secondaryCta:{label:"Learn about manual recovery",onClick:()=>window.open("https://docs.privy.io","_blank","noopener,noreferrer")},watermark:!0,children:(0,e.jsxs)(R,{href:o.tracking_url,target:"_blank",rel:"noopener noreferrer",children:["Reference: ",o.provider_request_id]})})}let R=i.styled.a`
  text-align: center;
  font-size: 0.75rem;
  opacity: 0.7;
  text-decoration: underline;
  cursor: pointer;
  color: var(--privy-color-foreground-3);
`;function F(){let{close:t,setModalState:i,config:a,params:l,onBack:d}=(0,n.a)(),[c,u]=(0,r.useState)(!1);return(0,r.useEffect)(()=>{if(c&&l){if("ready"===a.status){let e=_(a.data,l);i(e?{step:"error",code:"ROUTE_UNAVAILABLE",message:e}:{step:"token"})}"error"===a.status&&i({step:"error",code:"ROUTE_UNAVAILABLE"})}},[c,a,l,i]),(0,e.jsx)(o.C,{icon:s.QrCode,iconVariant:"subtle",title:"Add funds",subtitle:"Top up your account by sending crypto from any wallet. Conversion and routing handled by Relay.",showClose:!0,onClose:t,showBack:!!d,onBack:d,primaryCta:{label:"Continue",onClick:()=>{if("ready"===a.status&&l){let e=_(a.data,l);i(e?{step:"error",code:"ROUTE_UNAVAILABLE",message:e}:{step:"token"})}else"error"===a.status?i({step:"error",code:"ROUTE_UNAVAILABLE"}):u(!0)},loading:c&&"loading"===a.status,loadingText:null},watermark:!0})}function L(){let{state:t,setModalState:s,close:i}=(0,n.c)("network"),[d,c]=(0,r.useState)(-1),{availableChains:u}=t,{confirm:m,isFetching:p}=(function(){let e=(0,n.b)(),{params:t}=(0,n.a)(),{fetchQuote:s,isFetching:o}=N();return{confirm:(0,r.useCallback)(async r=>{if(!r||!t)return;let n=e?.modalState;n&&"network"===n.step&&await s(r,n.selectedCurrency,n.availableChains)},[t,e,s]),isFetching:o}})();return(0,e.jsx)(a.S,{title:"Select network",eyebrow:(0,e.jsxs)("span",{style:{display:"flex",alignItems:"center",gap:"0.375rem"},children:[(0,e.jsx)("img",{src:t.selectedCurrency.logoURI,alt:"",style:{width:"1rem",height:"1rem",borderRadius:"50%"}}),"Send ",t.selectedCurrency.symbol]}),showBack:!0,onBack:()=>s({step:"token"}),showClose:!0,onClose:i,watermark:!0,children:(0,e.jsx)(l.S,{style:{marginTop:"1rem",height:"22rem"},$colorScheme:"light",children:u.map((r,t)=>(0,e.jsxs)(o.O,{$selected:d===t,disabled:p,onClick:()=>{c(t),m(r)},children:[(0,e.jsx)(o.N,{src:r.iconUrl,alt:r.displayName}),(0,e.jsx)(o.a,{children:r.displayName}),p&&t===d&&(0,e.jsx)(o.b,{})]},r.caip2))})})}const P=({trackingUrl:r,onClose:t})=>(0,e.jsx)(a.S,{icon:s.Hourglass,iconVariant:"subtle",title:"Transfer in progress",subtitle:"Your deposit was received and the transfer is now processing.",showClose:!0,onClose:t,secondaryCta:{label:"View on block explorer \u2197",onClick:()=>window.open(r,"_blank","noopener,noreferrer")},watermark:!1,children:(0,e.jsxs)(o.T,{children:[(0,e.jsxs)(o.c,{children:[(0,e.jsx)(o.d,{$status:"done",children:(0,e.jsx)(s.Check,{size:14,color:"var(--privy-color-icon-success)",strokeWidth:2})}),(0,e.jsx)(o.e,{children:"Deposit received"})]}),(0,e.jsx)(o.f,{}),(0,e.jsxs)(o.c,{children:[(0,e.jsx)(o.d,{$status:"active",children:(0,e.jsx)($,{})}),(0,e.jsx)(o.e,{children:"Bridging"})]}),(0,e.jsx)(o.f,{}),(0,e.jsxs)(o.c,{children:[(0,e.jsx)(o.d,{$status:"pending"}),(0,e.jsx)(o.e,{children:"Funds arrived"})]})]})});let $=i.styled.span`
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid var(--privy-color-foreground-3);
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;function M(){let{state:t,close:s}=(0,n.c)("processing");return(function({orderId:e,enabled:t}){let{privy:s}=(0,u.u)(),{setModalState:o}=(0,n.a)();(0,r.useEffect)(()=>{let r=new AbortController;return d.depositAddress.waitForCompletion({privy:s,orderId:e,signal:r.signal}).then(e=>{r.signal.aborted||("success"===e.status?U(e.order,o):"timeout"===e.status&&o({step:"error",code:"TIMEOUT_ORDER_COMPLETION"}))}),()=>{r.abort()}},[t,e,s,o])})({orderId:t.order.id,enabled:!0}),(0,e.jsx)(P,{trackingUrl:t.order.tracking_url,onClose:s})}function B(){let{state:r,close:t}=(0,n.c)("refunded"),{order:i}=r;return(0,e.jsx)(o.C,{icon:s.Undo2,iconVariant:"subtle",title:"Transfer refunded",subtitle:"Your transfer was received, but the swap couldn't be completed. A refund has been started automatically.",showClose:!0,onClose:t,primaryCta:{label:"Done",onClick:t},secondaryCta:{label:"View transaction details",onClick:()=>window.open(i.tracking_url,"_blank","noopener,noreferrer")},watermark:!0})}function V(){let{close:t,setModalState:s,config:i}=(0,n.a)(),{confirm:d,currencies:c,isFetching:u}=(function(){let{config:e,setModalState:t}=(0,n.a)(),{fetchQuote:s,isFetching:o}=N(),i="ready"===e.status?e.data.currencies:[];return{confirm:(0,r.useCallback)(async r=>{if("ready"!==e.status||!r)return;let n=(function(e,r){return e.chains.map(e=>{let t=r.chains[e.caip2];return t?{caip2:e.caip2,displayName:t.displayName,iconUrl:t.iconUrl,vmType:t.vmType,currencyAddress:e.address,currencyDecimals:e.decimals}:null}).filter(e=>null!==e)})(r,e.data);if(1!==n.length)t({step:"network",selectedCurrency:r,availableChains:n});else{let e=n[0];await s(e,r,n)}},[e,s,t]),currencies:i,isFetching:o}})(),[p,h]=(0,r.useState)(-1);return(0,e.jsx)(a.S,{title:"Select token",showBack:!0,onBack:()=>s({step:"intro"}),showClose:!0,onClose:t,watermark:!0,children:"error"===i.status?(0,e.jsx)(o.L,{children:(0,e.jsx)(o.S,{children:"Failed to load tokens"})}):"loading"===i.status?(0,e.jsx)(o.L,{children:(0,e.jsx)(m.L,{})}):(0,e.jsx)(l.S,{style:{marginTop:"1rem",height:"22rem"},$colorScheme:"light",children:c.map((r,t)=>(0,e.jsxs)(o.O,{$selected:p===t,disabled:u,onClick:()=>{h(t),d(r)},children:[(0,e.jsx)(o.g,{src:r.logoURI,alt:r.symbol}),(0,e.jsx)(o.a,{children:r.name}),u&&t===p?(0,e.jsx)(o.b,{}):(0,e.jsx)(o.h,{children:r.symbol})]},r.symbol))})})}function z({address:t,onClick:n}){let[o,i]=(0,r.useState)(!1);return(0,e.jsx)(e.Fragment,{children:o?(0,e.jsx)(W,{onClick:()=>i(!1),style:{marginTop:"1.5rem"},children:(0,e.jsx)(h.Q,{url:t,size:312,hideLogo:!0})}):(0,e.jsxs)(q,{title:"Click to copy address",onClick:n,style:{marginTop:"1.5rem"},children:[(0,e.jsxs)(Q,{children:[(0,e.jsx)(Y,{children:"Deposit address"}),(0,e.jsx)(X,{children:t})]}),(0,e.jsx)(H,{children:(0,e.jsx)(K,{type:"button",onClick:e=>{e.stopPropagation(),i(!0)},children:(0,e.jsx)(s.QrCode,{size:16,color:"var(--privy-color-icon-muted)"})})})]})})}let W=i.styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
`,q=i.styled.div`
  display: flex;
  border-radius: var(--privy-border-radius-md);
  background: var(--privy-color-background-clicked, #f1f2f9);
  padding: 1rem;
  cursor: pointer;
  gap: 0.5rem;
`,Q=i.styled.div`
  flex: 1;
  min-width: 0;
  text-align: left;
`,Y=i.styled.div`
  font-size: 0.75rem;
  color: var(--privy-color-icon-muted);
  line-height: 1rem;
  margin-bottom: 0.25rem;
`,X=i.styled.div`
  word-break: break-all;
  font-size: 0.875rem;
  font-family: ui-monospace, monospace;
  font-weight: 500;
  line-height: 1.375rem;
  color: var(--privy-color-foreground);
`,H=i.styled.div`
  width: 1.5rem;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding-top: 0.25rem;
`,K=i.styled.button`
  && {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    outline: none;
    box-shadow: none;
    border-radius: var(--privy-border-radius-xs);

    &:hover {
      background: var(--privy-color-background);
    }

    &:focus,
    &:focus-visible {
      outline: none;
      box-shadow: none;
    }
  }
`;function G({quote:t,selectedCurrency:n,selectedChain:i,destinationSymbol:a}){let[l,d]=(0,r.useState)(!1),c=n.symbol.toUpperCase(),u=i.displayName,m=(0,r.useRef)(null);return(0,e.jsxs)(J,{children:[(0,e.jsxs)(Z,{onClick:(0,r.useCallback)(()=>{let e=document.getElementById("privy-modal-content");e&&(m.current&&clearTimeout(m.current),e.style.transition="none",m.current=setTimeout(()=>{e.style.transition="",m.current=null},160)),d(e=>!e)},[]),children:[(0,e.jsxs)(ee,{children:[n.logoURI&&(0,e.jsx)(o.g,{src:n.logoURI,alt:c,style:{width:"2rem",height:"2rem"}}),i.iconUrl&&(0,e.jsx)(re,{src:i.iconUrl,alt:u})]}),(0,e.jsxs)(te,{children:[(0,e.jsx)(ne,{children:"You send"}),(0,e.jsxs)(se,{children:[c," on ",u]})]}),(0,e.jsx)(oe,{children:(0,e.jsx)(l?s.ChevronUp:s.ChevronDown,{size:16})})]}),(0,e.jsx)(de,{$expanded:l,children:(0,e.jsx)(ce,{children:(0,e.jsxs)(ie,{children:[t.indicative_rate&&(0,e.jsxs)(o.i,{children:[(0,e.jsx)(o.j,{children:"Conversion rate"}),(0,e.jsxs)(o.k,{style:{display:"flex",alignItems:"center",gap:"0.25rem"},children:[C(t.indicative_rate,c,a.toUpperCase()),(0,e.jsx)(ue,{content:"Estimated rate based on current market conditions. Final execution price may vary depending on transfer size and routing."})]})]}),(0,e.jsxs)(o.i,{children:[(0,e.jsx)(o.j,{children:"Max slippage"}),(0,e.jsxs)(o.k,{children:[(t.slippage_bps/100).toFixed(1),"%"]})]}),(0,e.jsxs)(o.i,{children:[(0,e.jsx)(o.j,{children:"Refund address"}),(0,e.jsx)(o.k,{children:(0,e.jsx)(y.C,{value:t.refund_address,iconOnly:!0,iconSize:11,children:(0,b.d)(t.refund_address,4,4)})})]})]})})}),(0,e.jsxs)(ae,{children:[(0,e.jsx)(s.AlertTriangle,{size:16,color:"var(--privy-color-icon-muted)",style:{flexShrink:0}}),(0,e.jsxs)(le,{children:["Only send ",(0,e.jsx)("strong",{children:c})," on ",(0,e.jsx)("strong",{children:u}),". Other assets may be lost."]})]})]})}let J=i.styled.div`
  border-radius: var(--privy-border-radius-md);
  border: 1px solid var(--privy-color-foreground-4);
  overflow: hidden;
`,Z=i.styled.button`
  && {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--privy-color-foreground);
    outline: none;
    box-shadow: none;

    &:focus,
    &:focus-visible {
      outline: none;
      box-shadow: none;
    }
  }
`,ee=i.styled.span`
  position: relative;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
`,re=(0,i.styled)(o.N)`
  && {
    position: absolute;
    top: -0.125rem;
    right: -0.25rem;
    width: 0.75rem;
    height: 0.75rem;
    box-sizing: content-box;
    border: 1.5px solid #fff;
    background-color: #fff;
  }
`,te=i.styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`,ne=i.styled.span`
  font-size: 0.75rem;
  color: var(--privy-color-foreground-3);
  line-height: 1rem;
`,se=i.styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
`,oe=i.styled.span`
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--privy-border-radius-full);
  background-color: var(--privy-color-background-clicked, #f1f2f9);
  color: var(--privy-color-foreground-3);
`,ie=i.styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 1rem 0.75rem;

  & > * {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--privy-color-foreground-4);
  }

  & > *:last-child {
    border-bottom: none;
  }
`,ae=i.styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0.75rem 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--privy-border-radius-sm);
  background: #f8f9fc;
`,le=i.styled.span`
  font-size: 0.8125rem;
  line-height: 1.25rem;
  color: var(--privy-color-icon-muted);
  text-align: left;
`,de=i.styled.div`
  display: grid;
  grid-template-rows: ${({$expanded:e})=>e?"1fr":"0fr"};
  transition: grid-template-rows 150ms ease-out;
`,ce=i.styled.div`
  overflow: hidden;
`;function ue({content:t}){let[n,o]=(0,r.useState)(!1),{refs:i,floatingStyles:a,context:l}=(0,f.useFloating)({open:n,onOpenChange:o,placement:"top",whileElementsMounted:f.autoUpdate,middleware:[(0,f.offset)(6),(0,f.flip)(),(0,f.shift)({padding:8})]}),d=(0,f.useHover)(l,{move:!1,handleClose:(0,f.safePolygon)()}),c=(0,f.useFocus)(l),{getReferenceProps:u,getFloatingProps:m}=(0,f.useInteractions)([d,c,(0,f.useClick)(l),(0,f.useDismiss)(l),(0,f.useRole)(l,{role:"tooltip"})]),{isMounted:p,styles:h}=(0,f.useTransitionStyles)(l,{duration:150});return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("button",Object.assign({ref:i.setReference,type:"button","aria-label":"More information about conversion rate",style:{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:0,border:"none",background:"none",color:"var(--privy-color-icon-muted)",cursor:"pointer"}},u(),{children:(0,e.jsx)(s.Info,{size:14})})),p&&(0,e.jsx)(f.FloatingPortal,{root:document.getElementById("privy-modal-content")??void 0,children:(0,e.jsx)(me,Object.assign({ref:i.setFloating,style:Object.assign({},a,h)},m(),{children:t}))})]})}let me=i.styled.div`
  max-width: 13rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--privy-border-radius-sm, 0.375rem);
  background: var(--privy-color-foreground);
  color: var(--privy-color-background);
  font-size: 0.6875rem;
  line-height: 1rem;
  font-weight: 400;
  text-align: left;
  z-index: 10;
`;const pe=({quote:t,selectedCurrency:n,selectedChain:o,destinationSymbol:i,onBack:l,onClose:d})=>{let[c,u]=(0,r.useState)(!1),m=n?.symbol?.toUpperCase()??"funds",h=o?.displayName??"",f=async()=>{c||(await navigator.clipboard.writeText(t.deposit_address),u(!0),setTimeout(()=>u(!1),2e3))};return(0,e.jsxs)(a.S,{title:`Send ${m}${h?` on ${h}`:""}`,subtitle:"Send funds to the address below. Conversion and routing handled by Relay.",showBack:!0,onBack:l,showClose:!0,onClose:d,watermark:!1,children:[(0,e.jsx)(G,{quote:t,selectedCurrency:n,selectedChain:o,destinationSymbol:i}),(0,e.jsx)(z,{address:t.deposit_address,onClick:f}),(0,e.jsx)(p.P,{style:Object.assign({marginTop:"1rem",marginBottom:"0.5rem"},c?{backgroundColor:"var(--privy-color-icon-success)",borderColor:"var(--privy-color-icon-success)"}:{}),onClick:f,children:c?(0,e.jsxs)(e.Fragment,{children:["Copied ",(0,e.jsx)(s.Check,{size:16,style:{marginLeft:"0.25rem"}})]}):"Copy address"}),(0,e.jsx)(he,{children:"Routing and bridging are handled by Relay. Privy does not control execution timing, liquidity, or transaction outcomes."})]})};let he=i.styled.p`
  && {
    margin: 0.5rem 0 0;
    font-size: 0.6875rem;
    line-height: 1.125rem;
    color: var(--privy-color-icon-muted);
    text-align: center;
  }
`;function fe(){let{state:t,configData:s,setModalState:o,close:i,params:a}=(0,n.c)("address"),{quote:l,selectedCurrency:c,selectedChain:m,availableChains:p}=t;return(function({depositAddressId:e,enabled:t,quoteCreatedAt:s}){let{privy:o}=(0,u.u)(),{setModalState:i}=(0,n.a)();(0,r.useEffect)(()=>{if(!e)return;let r=new AbortController;return d.depositAddress.waitForDeposit({privy:o,depositAddressId:e,quoteCreatedAt:s,signal:r.signal}).then(e=>{r.signal.aborted||("success"===e.status?U(e.order,i):"timeout"===e.status&&i({step:"error",code:"TIMEOUT_WAITING_FOR_NEXT_ORDER"}))}),()=>{r.abort()}},[t,e,o,s,i])})({depositAddressId:l.id,enabled:!0,quoteCreatedAt:l.created_at}),(0,e.jsx)(pe,{quote:l,selectedCurrency:c,selectedChain:m,destinationSymbol:(0,r.useMemo)(()=>w({address:a.destinationCurrency,caip2:a.destinationChain,config:s}).symbol,[a,s]),onBack:()=>o({step:"network",selectedCurrency:c,availableChains:p}),onClose:i})}function ge(){let{modalState:r,setModalState:t}=(0,n.a)();return(0,e.jsx)(x,{onError:e=>t({step:"error",code:"UNEXPECTED_STATE",message:e.message}),resetKey:r.step,children:(0,e.jsx)(ye,{})})}function ye(){let{modalState:r}=(0,n.a)();switch(r.step){case"intro":return(0,e.jsx)(F,{});case"token":return(0,e.jsx)(V,{});case"network":return(0,e.jsx)(L,{});case"address":return(0,e.jsx)(fe,{});case"processing":return(0,e.jsx)(M,{});case"complete":return(0,e.jsx)(A,{});case"refunded":return(0,e.jsx)(B,{});case"failed":return(0,e.jsx)(I,{});case"error":return(0,e.jsx)(D,{});default:return null}}var be={component:()=>{let{onUserCloseViaDialogOrKeybindRef:s}=(0,t.u)(),o=(0,n.b)(),{close:i,config:a}=(0,n.a)();return(0,r.useEffect)(()=>{s.current=i},[s,i]),(0,r.useEffect)(()=>{if("ready"===a.status){for(let e of a.data.currencies)(new Image).src=e.logoURI;for(let e of Object.values(a.data.chains))(new Image).src=e.iconUrl}},[a]),o?(0,e.jsx)(ge,{}):null}}},12505,[1404,1194,8149,8384,12578,12588,8154,12579,12587,4638,4642,5052,8171,12580,12594,8327,12592,5061,5054,5055,3016,8148,12585,12586,3447,8153,5049,5050,5053,3256,5056,5057,5063,8147,12581,12582,12583,12584,10920,5062,3628,4830]);
//# sourceMappingURL=/feel-mirror/_expo/static/js/web/DepositAddressScreen-CMH-YzPI-faef5c6828b17569d14a5c2f5d963ce7.js.map
//# debugId=d346517c-0aa9-4026-9b0c-db8bed2ad340
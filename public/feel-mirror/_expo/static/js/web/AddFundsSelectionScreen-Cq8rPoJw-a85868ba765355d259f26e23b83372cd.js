var _sentryDebugIds,_sentryDebugIdIdentifier;void 0===_sentryDebugIds&&(_sentryDebugIds={});try{var stack=(new Error).stack;stack&&(_sentryDebugIds[stack]="d546434c-e27a-4e9b-96cc-b9fe966d06da",_sentryDebugIdIdentifier="sentry-dbid-d546434c-e27a-4e9b-96cc-b9fe966d06da")}catch(e){}
var SENTRY_RELEASE;SENTRY_RELEASE={name: "Feel.cash", version: "0.0.19"};
__d(function(_g,r,i,_a,m,e,d){"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"AddFundsSelectionScreen",{enumerable:!0,get:function(){return f}}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}});var t=r(d[0]),n=r(d[1]),l=r(d[2]),o=r(d[3]),a=r(d[4]),c=r(d[5]),s=r(d[6]),u=r(d[7]),h=r(d[8]);r(d[9]),r(d[10]),r(d[11]),r(d[12]),r(d[13]),r(d[14]),r(d[15]),r(d[16]),r(d[17]),r(d[18]),r(d[19]),r(d[20]),r(d[21]),r(d[22]),r(d[23]),r(d[24]),r(d[25]),r(d[26]),r(d[27]),r(d[28]),r(d[29]),r(d[30]),r(d[31]),r(d[32]),r(d[33]),r(d[34]),r(d[35]),r(d[36]),r(d[37]),r(d[38]),r(d[39]),r(d[40]),r(d[41]),r(d[42]),r(d[43]),r(d[44]),r(d[45]),r(d[46]),r(d[47]),r(d[48]),r(d[49]),r(d[50]),r(d[51]),r(d[52]),r(d[53]),r(d[54]),r(d[55]),r(d[56]),r(d[57]),r(d[58]),r(d[59]),r(d[60]);const f={component:()=>{let o=(0,h.J)(),{onUserCloseViaDialogOrKeybindRef:f}=(0,c.u)(),C=(0,a.u)(),j=(0,l.useRef)(!1);(0,l.useEffect)(()=>{o&&(j.current=!1)},[o]);let b=(0,l.useCallback)(async()=>{!j.current&&o&&(j.current=!0,(0,h.K)(),await o.onCancel())},[o]);return(0,l.useEffect)(()=>(f.current=b,()=>{f.current===b&&(f.current=null)}),[b,f]),o?o.error?(0,t.jsx)(u.C,{icon:n.Banknote,iconVariant:"warning",title:"Unable to add funds",subtitle:o.error,showClose:!0,onClose:b,primaryCta:{label:"Close",onClick:b}}):(0,t.jsx)(u.C,{icon:n.Banknote,iconVariant:"subtle",title:"Select method",subtitle:"Choose how to fund your wallet",showClose:!0,onClose:b,children:(0,t.jsxs)(s.S,{style:{marginTop:"1rem"},$colorScheme:C.appearance.palette.colorScheme,children:[o.startFiat&&(0,t.jsxs)(u.O,{onClick:async()=>{j.current||(j.current=!0,await(o.startFiat?.()))},children:[(0,t.jsx)(y,{children:(0,t.jsx)(n.CreditCard,{})}),(0,t.jsxs)(p,{children:[(0,t.jsx)(u.a,{children:"Pay with fiat"}),(0,t.jsx)(x,{children:"Apple Pay, Google Pay, or debit card"})]})]}),o.startCrypto&&(0,t.jsxs)(u.O,{onClick:async()=>{j.current||(j.current=!0,await(o.startCrypto?.()))},children:[(0,t.jsx)(y,{children:(0,t.jsx)(n.QrCode,{})}),(0,t.jsxs)(p,{children:[(0,t.jsx)(u.a,{children:"Transfer from wallet"}),(0,t.jsx)(x,{children:"Send crypto from any wallet"})]})]})]})}):null}};let y=o.styled.span`
  width: 2rem;
  height: 2rem;
  border-radius: var(--privy-border-radius-full);
  background-color: var(--privy-color-background-2);
  color: var(--color-icon-muted, #64668b);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }
`,p=o.styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`,x=o.styled.span`
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--privy-color-foreground-3);
`},12487,[1404,12578,1194,8154,5054,8149,12587,12588,4637,4638,5055,5052,8171,3447,5061,5056,5057,5062,3256,3628,4830,8153,5049,5050,5053,3016,5063,8147,8148,12579,12580,12581,12582,12583,12584,12585,12586,5048,4678,5065,5120,8125,8126,8127,4873,4832,8128,8142,3200,8145,8146,8150,8172,8381,8382,8383,4642,8384,8385,4858,9804]);
//# sourceMappingURL=/feel-mirror/_expo/static/js/web/AddFundsSelectionScreen-Cq8rPoJw-a85868ba765355d259f26e23b83372cd.js.map
//# debugId=d546434c-e27a-4e9b-96cc-b9fe966d06da
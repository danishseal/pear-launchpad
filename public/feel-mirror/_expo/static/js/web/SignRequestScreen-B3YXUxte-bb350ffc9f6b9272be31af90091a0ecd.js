var _sentryDebugIds,_sentryDebugIdIdentifier;void 0===_sentryDebugIds&&(_sentryDebugIds={});try{var stack=(new Error).stack;stack&&(_sentryDebugIds[stack]="5ad6917e-742a-4eec-8bae-aae1c56b6702",_sentryDebugIdIdentifier="sentry-dbid-5ad6917e-742a-4eec-8bae-aae1c56b6702")}catch(e){}
var SENTRY_RELEASE;SENTRY_RELEASE={name: "Feel.cash", version: "0.0.19"};
__d(function(_g,_r,_i,_a,_m,_e,_d){"use strict";const e=["types","primaryType"];Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"SignRequestScreen",{enumerable:!0,get:function(){return w}}),Object.defineProperty(_e,"SignRequestView",{enumerable:!0,get:function(){return j}}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return w}});var t,n=_r(_d[0]),r=(t=n)&&t.__esModule?t:{default:t},i=_r(_d[1]),s=_r(_d[2]),a=_r(_d[3]),o=_r(_d[4]),l=_r(_d[5]),c=_r(_d[6]),d=_r(_d[7]),u=_r(_d[8]),g=_r(_d[9]),p=_r(_d[10]),y=_r(_d[11]),x=_r(_d[12]),h=_r(_d[13]),m=_r(_d[14]),f=_r(_d[15]),b=_r(_d[16]);_r(_d[17]),_r(_d[18]),_r(_d[19]),_r(_d[20]),_r(_d[21]),_r(_d[22]),_r(_d[23]),_r(_d[24]),_r(_d[25]),_r(_d[26]),_r(_d[27]),_r(_d[28]),_r(_d[29]),_r(_d[30]),_r(_d[31]),_r(_d[32]),_r(_d[33]),_r(_d[34]),_r(_d[35]),_r(_d[36]),_r(_d[37]),_r(_d[38]);const S=l.styled.img`
  && {
    height: ${e=>"sm"===e.size?"65px":"140px"};
    width: ${e=>"sm"===e.size?"65px":"140px"};
    border-radius: 16px;
    margin-bottom: 12px;
  }
`;let E=e=>{if(!(0,c.isHex)(e))return e;try{let t=(0,c.hexToString)(e);return t.includes("\ufffd")?e:t}catch{return e}},C=e=>{try{let t=s.base64.decode(e),n=(new TextDecoder).decode(t);return n.includes("\ufffd")?e:n}catch{return e}},_=t=>{let n=t.typedData,s=(0,r.default)(n,e);return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(P,{data:s}),(0,i.jsx)(u.C,{text:(a=t.typedData,JSON.stringify(a,null,2)),itemName:"full payload to clipboard"})," "]});var a};const j=({method:e,messageData:t,copy:n,iconUrl:r,isLoading:s,success:o,walletProxyIsLoading:l,errorMessage:c,isCancellable:d,onSign:u,onCancel:p,onClose:y})=>(0,i.jsx)(b.S,{title:n.title,subtitle:n.description,showClose:!0,onClose:y,icon:a.Edit,iconVariant:"subtle",helpText:c?(0,i.jsx)(v,{children:c}):void 0,primaryCta:{label:n.buttonText,onClick:u,disabled:s||o||l,loading:s},secondaryCta:d?{label:"Not now",onClick:p,disabled:s||o||l}:void 0,watermark:!0,children:(0,i.jsxs)(g.a,{children:[r?(0,i.jsx)(S,{style:{alignSelf:"center"},size:"sm",src:r,alt:"app image"}):null,(0,i.jsxs)(T,{children:["personal_sign"===e&&(0,i.jsx)(R,{children:E(t)}),"eth_signTypedData_v4"===e&&(0,i.jsx)(_,{typedData:t}),"solana_signMessage"===e&&(0,i.jsx)(R,{children:C(t)})]})]})}),w={component:()=>{let{authenticated:e}=(0,f.u)(),{initializeWalletProxy:t,closePrivyModal:n}=(0,h.u)(),{navigate:r,data:s,onUserCloseViaDialogOrKeybindRef:a}=(0,m.u)(),[l,c]=(0,o.useState)(!0),[u,g]=(0,o.useState)(""),[p,b]=(0,o.useState)(),[S,E]=(0,o.useState)(null),[C,_]=(0,o.useState)(!1);(0,o.useEffect)(()=>{e||r("LandingScreen")},[e]),(0,o.useEffect)(()=>{t(x.W).then(e=>{c(!1),e||(g("An error has occurred, please try again."),b(new y.P(new y.z(u,d.ProviderErrors.E32603_DEFAULT_INTERNAL_ERROR.eipCode))))})},[]);let{method:w,data:T,confirmAndSign:v,onSuccess:P,onFailure:R,uiOptions:D}=s.signMessage,O={title:D?.title||"Sign message",description:D?.description||"Signing this message will not cost you any fees.",buttonText:D?.buttonText||"Sign and continue"},U=e=>{e?P(e):R(p||new y.P(new y.z("The user rejected the request.",d.ProviderErrors.E4001_USER_REJECTED_REQUEST.eipCode))),n({shouldCallAuthOnSuccess:!1}),setTimeout(()=>{E(null),g(""),b(void 0)},200)};return a.current=()=>{U(S)},(0,i.jsx)(j,{method:w,messageData:T,copy:O,iconUrl:D?.iconUrl&&"string"==typeof D.iconUrl?D.iconUrl:void 0,isLoading:C,success:null!==S,walletProxyIsLoading:l,errorMessage:u,isCancellable:D?.isCancellable,onSign:async()=>{_(!0),g("");try{let e=await v();E(e),_(!1),setTimeout(()=>{U(e)},x.r)}catch(e){console.error(e),g("An error has occurred, please try again."),b(new y.P(new y.z(u,d.ProviderErrors.E32603_DEFAULT_INTERNAL_ERROR.eipCode))),_(!1)}},onCancel:()=>U(null),onClose:()=>U(S)})}};let T=l.styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`,v=l.styled.p`
  && {
    margin: 0;
    width: 100%;
    text-align: center;
    color: var(--privy-color-error-dark);
    font-size: 14px;
    line-height: 22px;
  }
`,P=(0,l.styled)(p.D)`
  margin-top: 0;
`,R=(0,l.styled)(p.M)`
  margin-top: 0;
`},12542,[15,1404,3200,12578,1194,8154,3256,4638,12665,12600,13053,5061,5054,5052,8149,5049,12579,5056,5057,5062,3628,4830,5055,5050,12580,8171,3447,8153,5053,3016,5063,8147,8148,12581,12582,12583,12584,12585,12586]);
//# sourceMappingURL=/feel-mirror/_expo/static/js/web/SignRequestScreen-B3YXUxte-bb350ffc9f6b9272be31af90091a0ecd.js.map
//# debugId=5ad6917e-742a-4eec-8bae-aae1c56b6702
var _sentryDebugIds,_sentryDebugIdIdentifier;void 0===_sentryDebugIds&&(_sentryDebugIds={});try{var stack=(new Error).stack;stack&&(_sentryDebugIds[stack]="726855c1-fa3e-4108-8ca8-61bfbbd59035",_sentryDebugIdIdentifier="sentry-dbid-726855c1-fa3e-4108-8ca8-61bfbbd59035")}catch(e){}
var SENTRY_RELEASE;SENTRY_RELEASE={name: "Feel.cash", version: "0.0.19"};
__d(function(_g,_r,_i,_a,_m,_e,_d){"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"FundWithBankDepositScreen",{enumerable:!0,get:function(){return U}}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return U}});var e=_r(_d[0]),t=_r(_d[1]),s=_r(_d[2]),r=_r(_d[3]),o=_r(_d[4]),a=_r(_d[5]),n=_r(_d[6]),i=_r(_d[7]),l=_r(_d[8]),c=_r(_d[9]),u=_r(_d[10]),d=_r(_d[11]),p=_r(_d[12]),y=_r(_d[13]);_r(_d[14]),_r(_d[15]),_r(_d[16]),_r(_d[17]),_r(_d[18]),_r(_d[19]),_r(_d[20]),_r(_d[21]),_r(_d[22]),_r(_d[23]),_r(_d[24]),_r(_d[25]),_r(_d[26]),_r(_d[27]),_r(_d[28]),_r(_d[29]),_r(_d[30]),_r(_d[31]),_r(_d[32]),_r(_d[33]),_r(_d[34]),_r(_d[35]),_r(_d[36]),_r(_d[37]),_r(_d[38]),_r(_d[39]),_r(_d[40]),_r(_d[41]),_r(_d[42]),_r(_d[43]),_r(_d[44]),_r(_d[45]),_r(_d[46]),_r(_d[47]),_r(_d[48]),_r(_d[49]),_r(_d[50]),_r(_d[51]),_r(_d[52]),_r(_d[53]),_r(_d[54]),_r(_d[55]),_r(_d[56]),_r(_d[57]),_r(_d[58]),_r(_d[59]),_r(_d[60]),_r(_d[61]),_r(_d[62]);const m=e=>{try{return e.location.origin}catch{return}},f=({data:t,onClose:s})=>(0,e.jsx)(u.S,{showClose:!0,onClose:s,title:"Initiate bank transfer",subtitle:"Use the details below to complete a bank transfer from your bank.",primaryCta:{label:"Done",onClick:s},watermark:!1,footerText:"Exchange rates and fees are set when you authorize and determine the amount you receive. You'll see the applicable rates and fees for your transaction separately",children:(0,e.jsx)(g,{children:(c.D[t.deposit_instructions.asset]||[]).map(([s,r],o)=>{let a=t.deposit_instructions[s];if(!a||Array.isArray(a))return null;let i="asset"===s?a.toUpperCase():a,c=i.length>100?`${i.slice(0,9)}...${i.slice(-9)}`:i;return(0,e.jsxs)(h,{children:[(0,e.jsx)(C,{children:r}),(0,e.jsx)(l.a,{value:i,includeChildren:n.isMobile,children:(0,e.jsx)(b,{children:c})})]},o)})})});let g=i.styled.ol`
  border-color: var(--privy-color-border-default);
  border-width: 1px;
  border-radius: var(--privy-border-radius-mdlg);
  border-style: solid;
  display: flex;
  flex-direction: column;

  && {
    padding: 0 1rem;
  }
`,h=i.styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;

  &:not(:first-of-type) {
    border-top: 1px solid var(--privy-color-border-default);
  }

  & > {
    :nth-child(1) {
      flex-basis: 30%;
    }

    :nth-child(2) {
      flex-basis: 60%;
    }
  }
`,C=i.styled.span`
  color: var(--privy-color-foreground);
  font-kerning: none;
  font-variant-numeric: lining-nums proportional-nums;
  font-feature-settings: 'calt' off;

  /* text-xs/font-regular */
  font-size: 0.75rem;
  font-style: normal;
  font-weight: 400;
  line-height: 1.125rem; /* 150% */

  text-align: left;
  flex-shrink: 0;
`,b=i.styled.span`
  color: var(--privy-color-foreground);
  font-kerning: none;
  font-feature-settings: 'calt' off;

  /* text-sm/font-medium */
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 500;
  line-height: 1.375rem; /* 157.143% */

  text-align: right;
  word-break: break-all;
`;const k=({onClose:t})=>(0,e.jsx)(u.S,{showClose:!0,onClose:t,icon:d.XCircle,iconVariant:"error",title:"Something went wrong",subtitle:"We couldn't complete account setup. This isn't caused by anything you did.",primaryCta:{label:"Close",onClick:t},watermark:!0}),v=({onClose:t,reason:s})=>{let r=s?s.charAt(0).toLowerCase()+s.slice(1):void 0;return(0,e.jsx)(u.S,{showClose:!0,onClose:t,icon:d.XCircle,iconVariant:"error",title:"Identity verification failed",subtitle:r?`We can't complete identity verification because ${r}. Please try again or contact support for assistance.`:"We couldn't verify your identity. Please try again or contact support for assistance.",primaryCta:{label:"Close",onClick:t},watermark:!0})},w=({onClose:t,email:s})=>(0,e.jsx)(u.S,{showClose:!0,onClose:t,icon:d.Hourglass,title:"Identity verification in progress",subtitle:"We're waiting for Persona to approve your identity verification. This usually takes a few minutes, but may take up to 24 hours.",primaryCta:{label:"Done",onClick:t},watermark:!0,children:(0,e.jsxs)(p.I,{theme:"light",children:["You'll receive an email at ",s," once approved with instructions for completing your deposit."]})}),x=({onClose:t,onAcceptTerms:s,isLoading:r})=>(0,e.jsx)(u.S,{showClose:!0,onClose:t,icon:d.UserCheck,title:"Verify your identity to continue",subtitle:"Finish verification with Persona \u2014 it takes just a few minutes and requires a government ID.",helpText:(0,e.jsxs)(e.Fragment,{children:['This app uses Bridge to securely connect accounts and move funds. By clicking "Accept," you agree to Bridge\'s'," ",(0,e.jsx)("a",{href:"https://www.bridge.xyz/legal",target:"_blank",rel:"noopener noreferrer",children:"Terms of Service"})," ","and"," ",(0,e.jsx)("a",{href:"https://www.bridge.xyz/legal/row-privacy-policy/bridge-building-limited",target:"_blank",rel:"noopener noreferrer",children:"Privacy Policy"}),"."]}),primaryCta:{label:"Accept and continue",onClick:s,loading:r},watermark:!0}),j=({onClose:t})=>(0,e.jsx)(u.S,{showClose:!0,onClose:t,icon:d.Check,iconVariant:"success",title:"Identity verified successfully",subtitle:"We've successfully verified your identity. Now initiate a bank transfer to view instructions.",primaryCta:{label:"Initiate bank transfer",onClick:()=>{},loading:!0},watermark:!0}),S=({opts:t,onClose:s,onEditSourceAsset:r,onSelectAmount:o,isLoading:a})=>(0,e.jsxs)(u.S,{showClose:!0,onClose:s,headerTitle:`Buy ${t.destination.asset.toLocaleUpperCase()}`,primaryCta:{label:"Continue",onClick:o,loading:a},watermark:!0,children:[(0,e.jsx)(y.A,{currency:t.source.selectedAsset,inputMode:"decimal",autoFocus:!0}),(0,e.jsx)(y.C,{selectedAsset:t.source.selectedAsset,onEditSourceAsset:r})]}),A=({onClose:t,onAcceptTerms:s,onSelectAmount:r,onSelectSource:o,onEditSourceAsset:a,opts:n,state:i,email:l,isLoading:c})=>"select-amount"===i.status?(0,e.jsx)(S,{onClose:t,onSelectAmount:r,onEditSourceAsset:a,opts:n,isLoading:c}):"select-source-asset"===i.status?(0,e.jsx)(y.S,{onSelectSource:o,opts:n,isLoading:c}):"kyc-prompt"===i.status?(0,e.jsx)(x,{onClose:t,onAcceptTerms:s,opts:n,isLoading:c}):"kyc-incomplete"===i.status?(0,e.jsx)(w,{onClose:t,email:l}):"kyc-success"===i.status?(0,e.jsx)(j,{onClose:t}):"kyc-error"===i.status?(0,e.jsx)(v,{onClose:t,reason:i.reason}):"account-details"===i.status?(0,e.jsx)(f,{onClose:t,data:i.data}):"create-customer-error"===i.status||"get-customer-error"===i.status?(0,e.jsx)(k,{onClose:t}):null,U={component:()=>{let{user:n}=(0,a.u)(),i=(0,o.u)().data;if(!i?.FundWithBankDepositScreen)throw Error("Missing data");let{onSuccess:l,onFailure:c,opts:u,createOrUpdateCustomer:d,getCustomer:p,getOrCreateVirtualAccount:y}=i.FundWithBankDepositScreen,[f,g]=(0,t.useState)(u),[h,C]=(0,t.useState)({status:"select-amount"}),[b,k]=(0,t.useState)(null),[v,w]=(0,t.useState)(!1),x=(0,t.useRef)(null),j=(0,t.useCallback)(async()=>{let e;w(!0),k(null);try{e=await p({kycRedirectUrl:window.location.origin})}catch(e){if(!e||"object"!=typeof e||!("status"in e)||404!==e.status)return C({status:"get-customer-error"}),k(e),void w(!1)}if(!e)try{e=await d({hasAcceptedTerms:!1,kycRedirectUrl:window.location.origin})}catch(e){return C({status:"create-customer-error"}),k(e),void w(!1)}if(!e)return C({status:"create-customer-error"}),k(Error("Unable to create customer")),void w(!1);if("not_started"===e.status&&e.kyc_url)return C({status:"kyc-prompt",kycUrl:e.kyc_url}),void w(!1);if("not_started"===e.status)return C({status:"get-customer-error"}),k(Error("Unexpected user state")),void w(!1);if("rejected"===e.status)return C({status:"kyc-error",reason:e.rejection_reasons?.[0]?.reason}),k(Error("User KYC rejected.")),void w(!1);if("incomplete"===e.status)return C({status:"kyc-incomplete"}),void w(!1);if("active"!==e.status)return C({status:"get-customer-error"}),k(Error("Unexpected user state")),void w(!1);e.status;try{let e=await y({destination:f.destination,provider:f.provider,source:{asset:f.source.selectedAsset}});C({status:"account-details",data:e})}catch(e){return C({status:"create-customer-error"}),k(e),void w(!1)}},[f]),S=(0,t.useCallback)(async()=>{if(k(null),w(!0),"kyc-prompt"!==h.status)return k(Error("Unexpected state")),void w(!1);let e=(0,r.trigger)({location:h.kycUrl});if(await d({hasAcceptedTerms:!0}),!e)return k(Error("Unable to begin kyc flow.")),w(!1),void C({status:"create-customer-error"});x.current=new AbortController;let t=await(async(e,t)=>{let r=await(0,s.poll)({operation:async()=>({done:m(e)===window.location.origin,closed:e.closed}),until:({done:e,closed:t})=>e||t,delay:0,interval:500,attempts:360,signal:t});return"aborted"===r.status?(e.close(),{status:"aborted"}):"max_attempts"===r.status?{status:"timeout"}:r.result.done?(e.close(),{status:"redirected"}):{status:"closed"}})(e,x.current.signal);if("aborted"===t.status)return;if("closed"===t.status)return void w(!1);t.status;let o=await(0,s.poll)({operation:()=>p({}),until:e=>"active"===e.status||"rejected"===e.status,delay:0,interval:2e3,attempts:60,signal:x.current.signal});if("aborted"!==o.status){if("max_attempts"===o.status)return C({status:"kyc-incomplete"}),void w(!1);if(o.status,"rejected"===o.result.status)return C({status:"kyc-error",reason:o.result.rejection_reasons?.[0]?.reason}),k(Error("User KYC rejected.")),void w(!1);if("active"!==o.result.status)return C({status:"kyc-incomplete"}),void w(!1);e.closed||e.close(),o.result.status;try{C({status:"kyc-success"});let e=await y({destination:f.destination,provider:f.provider,source:{asset:f.source.selectedAsset}});C({status:"account-details",data:e})}catch(e){C({status:"create-customer-error"}),k(e)}finally{w(!1)}}},[C,k,w,d,y,h,f,x]),U=(0,t.useCallback)(e=>{C({status:"select-amount"}),g(Object.assign({},f,{source:Object.assign({},f.source,{selectedAsset:e})}))},[C,g]),_=(0,t.useCallback)(()=>{C({status:"select-source-asset"})},[C]);return(0,e.jsx)(A,{onClose:(0,t.useCallback)(async()=>{x.current?.abort(),b?c(b):await l()},[b,x]),opts:f,state:h,isLoading:v,email:n.email.address,onAcceptTerms:S,onSelectAmount:j,onSelectSource:U,onEditSourceAsset:_})}}},12518,[1404,1194,4638,8150,8149,5049,5063,8154,12592,4637,12579,12578,13022,12858,5054,5055,5052,5050,5048,4678,4830,5053,3016,3256,3447,5056,5057,5061,5062,3628,5065,5120,8125,8126,8127,4873,4832,8128,8142,3200,8145,8146,8147,8148,8153,8171,8172,8381,8382,8383,4642,8384,8385,4858,9804,12580,12581,12582,12583,12584,12585,12586,13023]);
//# sourceMappingURL=/feel-mirror/_expo/static/js/web/FundWithBankDepositScreen-s-Y_8aQs-2cfdf025f4062c44ff0a8e0e17e5b368.js.map
//# debugId=726855c1-fa3e-4108-8ca8-61bfbbd59035
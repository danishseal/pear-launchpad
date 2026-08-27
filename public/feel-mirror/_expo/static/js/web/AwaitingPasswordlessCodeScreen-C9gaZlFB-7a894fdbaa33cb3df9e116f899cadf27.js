var _sentryDebugIds,_sentryDebugIdIdentifier;void 0===_sentryDebugIds&&(_sentryDebugIds={});try{var stack=(new Error).stack;stack&&(_sentryDebugIds[stack]="8f76b342-ee83-49d5-964b-dd5d218483a7",_sentryDebugIdIdentifier="sentry-dbid-8f76b342-ee83-49d5-964b-dd5d218483a7")}catch(e){}
var SENTRY_RELEASE;SENTRY_RELEASE={name: "Feel.cash", version: "0.0.19"};
__d(function(_g,_r,_i,a,_m,_e,_d){"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"AwaitingPasswordlessCodeScreen",{enumerable:!0,get:function(){return _}}),Object.defineProperty(_e,"AwaitingPasswordlessCodeScreenView",{enumerable:!0,get:function(){return g}}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return _}});var r=_r(_d[0]),t=e(_r(_d[1])),o=e(_r(_d[2])),n=e(_r(_d[3])),i=_r(_d[4]),s=_r(_d[5]),c=_r(_d[6]),l=_r(_d[7]),d=_r(_d[8]),u=_r(_d[9]),p=_r(_d[10]),f=_r(_d[11]),m=_r(_d[12]),v=_r(_d[13]),y=_r(_d[14]),h=_r(_d[15]);_r(_d[16]),_r(_d[17]),_r(_d[18]),_r(_d[19]),_r(_d[20]),_r(_d[21]),_r(_d[22]),_r(_d[23]),_r(_d[24]),_r(_d[25]),_r(_d[26]),_r(_d[27]),_r(_d[28]),_r(_d[29]),_r(_d[30]),_r(_d[31]),_r(_d[32]),_r(_d[33]),_r(_d[34]),_r(_d[35]),_r(_d[36]),_r(_d[37]),_r(_d[38]),_r(_d[39]),_r(_d[40]),_r(_d[41]),_r(_d[42]),_r(_d[43]),_r(_d[44]),_r(_d[45]),_r(_d[46]),_r(_d[47]),_r(_d[48]),_r(_d[49]),_r(_d[50]),_r(_d[51]),_r(_d[52]),_r(_d[53]),_r(_d[54]),_r(_d[55]),_r(_d[56]),_r(_d[57]),_r(_d[58]),_r(_d[59]),_r(_d[60]),_r(_d[61]),_r(_d[62]),_r(_d[63]);const g=({contactMethod:e,authFlow:c,emailDomain:u,appName:p="Privy",whatsAppEnabled:f=!1,onBack:m,onCodeSubmit:v,onResend:y,errorMessage:g,success:b=!1,resendCountdown:S=0,onInvalidInput:A,onClearError:C})=>{let[_,M]=(0,i.useState)(E);(0,i.useEffect)(()=>{g||M(E)},[g]);let R=async e=>{e.preventDefault();let r=e.currentTarget.value.replace(" ","");if(""===r)return;if(isNaN(Number(r)))return void A?.("Code should be numeric");C?.();let t=Number(e.currentTarget.name?.charAt(5)),o=[...r||[""]].slice(0,x-t),n=[..._.slice(0,t),...o,..._.slice(t+o.length)];M(n);let i=Math.min(Math.max(t+o.length,0),x-1);if(!isNaN(Number(e.currentTarget.value))){let e=document.querySelector(`input[name=code-${i}]`);e?.focus()}if(n.every(e=>e&&!isNaN(+e))){let e=document.querySelector(`input[name=code-${i}]`);e?.blur(),await(v?.(n.join("")))}};return(0,r.jsx)(h.S,{title:"Enter confirmation code",subtitle:(0,r.jsxs)("span","email"===c?{children:["Please check ",(0,r.jsx)(I,{children:e})," for an email from"," ",u??"privy.io"," and enter your code below."]}:{children:["Please check ",(0,r.jsx)(I,{children:e})," for a",f?" WhatsApp":""," message from ",p," and enter your code below."]}),icon:"email"===c?o.default:n.default,onBack:m,showBack:!0,helpText:(0,r.jsxs)(j,{children:[(0,r.jsxs)("span",{children:["Didn't get ","email"===c?"an email":"a message","?"]}),S?(0,r.jsxs)(k,{children:[(0,r.jsx)(t.default,{color:"var(--privy-color-foreground)",strokeWidth:1.33,height:"12px",width:"12px"}),(0,r.jsx)("span",{children:"Code sent"})]}):(0,r.jsx)(d.L,{as:"button",size:"sm",onClick:y,children:"Resend code"})]}),children:(0,r.jsx)(w,{children:(0,r.jsx)(l.H,{children:(0,r.jsxs)(T,{children:[(0,r.jsx)("div",{children:_.map((e,t)=>(0,r.jsx)("input",{name:`code-${t}`,type:"text",value:_[t],onChange:R,onKeyUp:e=>{"Backspace"===e.key&&(e=>{if(C?.(),M([..._.slice(0,e),"",..._.slice(e+1)]),e>0){let r=document.querySelector(`input[name=code-${e-1}]`);r?.focus()}})(t)},inputMode:"numeric",autoFocus:0===t,pattern:"[0-9]",className:`${b?"success":""} ${g?"fail":""}`,autoComplete:s.isMobile?"one-time-code":"off"},t))}),(0,r.jsx)(N,{$fail:!!g,$success:b,children:(0,r.jsx)("span",{children:"Invalid or expired verification code"===g?"Incorrect code":g||(b?"Success!":"")})})]})})})})};let x=6,E=Array(6).fill("");var b,S,A=((b=A||{})[b.RESET_AFTER_DELAY=0]="RESET_AFTER_DELAY",b[b.CLEAR_ON_NEXT_VALID_INPUT=1]="CLEAR_ON_NEXT_VALID_INPUT",b),C=((S=C||{})[S.EMAIL=0]="EMAIL",S[S.SMS=1]="SMS",S);const _={component:()=>{let{navigate:e,lastScreen:t,navigateBack:o,setModalData:n,onUserCloseViaDialogOrKeybindRef:s}=(0,m.u)(),c=(0,u.u)(),{closePrivyModal:l,resendEmailCode:d,resendSmsCode:h,getAuthMeta:x,loginWithCode:E,updateWallets:b,createAnalyticsEvent:S}=(0,f.u)(),{authenticated:A,logout:C,user:_}=(0,v.u)(),{whatsAppEnabled:w}=(0,u.u)(),[T,N]=(0,i.useState)(!1),[j,k]=(0,i.useState)(null),[I,M]=(0,i.useState)(null),[R,O]=(0,i.useState)(0);s.current=()=>null;let D=x()?.email?0:1,L=0===D?x()?.email||"":x()?.phoneNumber||"",P=u.r-500;return(0,i.useEffect)(()=>{if(R){let e=setTimeout(()=>{O(R-1)},1e3);return()=>clearTimeout(e)}},[R]),(0,i.useEffect)(()=>{if(A&&T&&_){if(c?.legal.requireUsersAcceptTerms&&!_.hasAcceptedTerms){let r=setTimeout(()=>{e("AffirmativeConsentScreen")},P);return()=>clearTimeout(r)}if((0,y.s)(_,c.embeddedWallets)){let r=setTimeout(()=>{n({createWallet:{onSuccess:()=>{},onFailure:e=>{console.error(e),S({eventName:"embedded_wallet_creation_failure_logout",payload:{error:e,screen:"AwaitingPasswordlessCodeScreen"}}),C()},callAuthOnSuccessOnClose:!0}}),e("EmbeddedWalletOnAccountCreateScreen")},P);return()=>clearTimeout(r)}{b();let e=setTimeout(()=>l({shouldCallAuthOnSuccess:!0,isSuccess:!0}),u.r);return()=>clearTimeout(e)}}},[A,T,_]),(0,i.useEffect)(()=>{if(j&&0===I){let e=setTimeout(()=>{k(null),M(null);let e=document.querySelector("input[name=code-0]");e?.focus()},1400);return()=>clearTimeout(e)}},[j,I]),(0,r.jsx)(g,{contactMethod:L,authFlow:0===D?"email":"sms",emailDomain:c?.appearance.emailDomain,appName:c?.name,whatsAppEnabled:w,onBack:()=>o(),onCodeSubmit:async r=>{try{await E(r),N(!0)}catch(r){if(r instanceof p.c&&r.privyErrorCode===p.a.INVALID_CREDENTIALS)k("Invalid or expired verification code"),M(0);else if(r instanceof p.c&&r.privyErrorCode===p.a.CANNOT_LINK_MORE_OF_TYPE)k(r.message);else{if(r instanceof p.c&&r.privyErrorCode===p.a.USER_LIMIT_REACHED)return console.error(new p.j(r).toString()),void e("UserLimitReachedScreen");if(r instanceof p.c&&r.privyErrorCode===p.a.USER_DOES_NOT_EXIST)return void e("AccountNotFoundScreen");if(r instanceof p.c&&r.privyErrorCode===p.a.LINKED_TO_ANOTHER_USER)return n({errorModalData:{error:r,previousScreen:t??"AwaitingPasswordlessCodeScreen"}}),void e("ErrorScreen",!1);if(r instanceof p.c&&r.privyErrorCode===p.a.DISALLOWED_PLUS_EMAIL)return n({inlineError:{error:r}}),void e("ConnectOrCreateScreen",!1);if(r instanceof p.c&&r.privyErrorCode===p.a.ACCOUNT_TRANSFER_REQUIRED&&r.data?.data?.nonce)return n({accountTransfer:{nonce:r.data?.data?.nonce,account:L,displayName:r.data?.data?.account?.displayName,linkMethod:0===D?"email":"sms",embeddedWalletAddress:r.data?.data?.otherUser?.embeddedWalletAddress}}),void e("LinkConflictScreen");k("Issue verifying code"),M(0)}}},onResend:async()=>{O(30),0===D?await d():await h()},errorMessage:j||void 0,success:T,resendCountdown:R,onInvalidInput:e=>{k(e),M(1)},onClearError:()=>{1===I&&(k(null),M(null))}})}};let w=c.styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto;
  gap: 16px;
  flex-grow: 1;
  width: 100%;
`,T=c.styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;

  > div:first-child {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    border-radius: var(--privy-border-radius-sm);

    > input {
      border: 1px solid var(--privy-color-foreground-4);
      background: var(--privy-color-background);
      border-radius: var(--privy-border-radius-sm);
      padding: 8px 10px;
      height: 48px;
      width: 40px;
      text-align: center;
      font-size: 18px;
      font-weight: 600;
      color: var(--privy-color-foreground);
      transition: all 0.2s ease;
    }

    > input:focus {
      border: 1px solid var(--privy-color-foreground);
      box-shadow: 0 0 0 1px var(--privy-color-foreground);
    }

    > input:invalid {
      border: 1px solid var(--privy-color-error);
    }

    > input.success {
      border: 1px solid var(--privy-color-border-success);
      background: var(--privy-color-success-bg);
    }

    > input.fail {
      border: 1px solid var(--privy-color-border-error);
      background: var(--privy-color-error-bg);
      animation: shake 180ms;
      animation-iteration-count: 2;
    }
  }

  @keyframes shake {
    0% {
      transform: translate(1px, 0px);
    }
    33% {
      transform: translate(-1px, 0px);
    }
    67% {
      transform: translate(-1px, 0px);
    }
    100% {
      transform: translate(1px, 0px);
    }
  }
`,N=c.styled.div`
  line-height: 20px;
  min-height: 20px;
  font-size: 14px;
  font-weight: 400;
  color: ${e=>e.$success?"var(--privy-color-success-dark)":e.$fail?"var(--privy-color-error-dark)":"transparent"};
  display: flex;
  justify-content: center;
  width: 100%;
  text-align: center;
`,j=c.styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: var(--privy-color-foreground-2);
`,k=c.styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--privy-border-radius-sm);
  padding: 2px 8px;
  gap: 4px;
  background: var(--privy-color-background-2);
  color: var(--privy-color-foreground-2);
`,I=c.styled.span`
  font-weight: 500;
  word-break: break-all;
  color: var(--privy-color-foreground);
`},12493,[1404,12631,12632,12633,1194,5063,8154,12600,12593,5054,5056,5052,8149,5049,12589,12579,4638,5055,5057,5050,4637,5048,4678,4830,5053,3016,3256,3447,5061,5062,3628,5065,5120,8125,8126,8127,4873,4832,8128,8142,3200,8145,8146,8147,8148,8150,8153,8171,8172,8381,8382,8383,4642,8384,8385,4858,9804,12580,12581,12582,12583,12584,12585,12586]);
__d(function(g,r,i,a,m,e,d){var t=r(d[0]).default;const l=["title","titleId"],n=r(d[1]);function o(o,c){let{title:s,titleId:u}=o,f=t(o,l);return n.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":"true","data-slot":"icon",ref:c,"aria-labelledby":u},f),s?n.createElement("title",{id:u},s):null,n.createElement("path",{fillRule:"evenodd",d:"M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z",clipRule:"evenodd"}))}const c=n.forwardRef(o);m.exports=c},12631,[15,1194]);
//# sourceMappingURL=/feel-mirror/_expo/static/js/web/AwaitingPasswordlessCodeScreen-C9gaZlFB-7a894fdbaa33cb3df9e116f899cadf27.js.map
//# debugId=8f76b342-ee83-49d5-964b-dd5d218483a7
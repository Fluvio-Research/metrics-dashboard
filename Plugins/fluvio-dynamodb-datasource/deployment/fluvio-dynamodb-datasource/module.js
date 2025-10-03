/* [create-plugin] version: 5.25.7 */
define(["@grafana/ui","@emotion/css","rxjs","module","@grafana/runtime","@grafana/data","react"],(e,t,a,r,n,l,i)=>(()=>{"use strict";var o={7:t=>{t.exports=e},89:e=>{e.exports=t},269:e=>{e.exports=a},308:e=>{e.exports=r},531:e=>{e.exports=n},781:e=>{e.exports=l},959:e=>{e.exports=i}},s={};function c(e){var t=s[e];if(void 0!==t)return t.exports;var a=s[e]={exports:{}};return o[e](a,a.exports,c),a.exports}c.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return c.d(t,{a:t}),t},c.d=(e,t)=>{for(var a in t)c.o(t,a)&&!c.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},c.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),c.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},c.p="public/plugins/fluvio-dynamodb-datasource/";var m={};c.r(m),c.d(m,{plugin:()=>A});var d=c(308),p=c.n(d);c.p=p()&&p().uri?p().uri.slice(0,p().uri.lastIndexOf("/")+1):"public/plugins/fluvio-dynamodb-datasource/";var u=c(781),f=c(531);const g={limit:100,outputFormat:"auto",fieldMappings:[],discoverSchema:!1,timeFilterEnabled:!1,timestampField:"timestamp"};class b extends f.DataSourceWithBackend{getDefaultQuery(e){return g}filterQuery(e){return!!e.partiql||!!e.table}constructor(e){var t,a,r;super(e),r=void 0,(a="instanceSettings")in(t=this)?Object.defineProperty(t,a,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[a]=r,this.instanceSettings=e}}var y=c(959),h=c.n(y),v=c(7),E=c(89);function x(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function w(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{},r=Object.keys(a);"function"==typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(a).filter(function(e){return Object.getOwnPropertyDescriptor(a,e).enumerable}))),r.forEach(function(t){x(e,t,a[t])})}return e}function S(e,t){return t=null!=t?t:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):function(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),a.push.apply(a,r)}return a}(Object(t)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(t,a))}),e}const $=[{label:"US East (N. Virginia) - us-east-1",value:"us-east-1"},{label:"US East (Ohio) - us-east-2",value:"us-east-2"},{label:"US West (N. California) - us-west-1",value:"us-west-1"},{label:"US West (Oregon) - us-west-2",value:"us-west-2"},{label:"Asia Pacific (Sydney) - ap-southeast-2",value:"ap-southeast-2"},{label:"Asia Pacific (Singapore) - ap-southeast-1",value:"ap-southeast-1"},{label:"Asia Pacific (Tokyo) - ap-northeast-1",value:"ap-northeast-1"},{label:"Asia Pacific (Seoul) - ap-northeast-2",value:"ap-northeast-2"},{label:"Asia Pacific (Mumbai) - ap-south-1",value:"ap-south-1"},{label:"Europe (Ireland) - eu-west-1",value:"eu-west-1"},{label:"Europe (London) - eu-west-2",value:"eu-west-2"},{label:"Europe (Frankfurt) - eu-central-1",value:"eu-central-1"},{label:"Europe (Stockholm) - eu-north-1",value:"eu-north-1"},{label:"Canada (Central) - ca-central-1",value:"ca-central-1"},{label:"South America (São Paulo) - sa-east-1",value:"sa-east-1"}];var N=c(269);function C(e,t,a,r,n,l,i){try{var o=e[l](i),s=o.value}catch(e){return void a(e)}o.done?t(s):Promise.resolve(s).then(r,n)}function k(e){return function(){var t=this,a=arguments;return new Promise(function(r,n){var l=e.apply(t,a);function i(e){C(l,r,n,i,o,"next",e)}function o(e){C(l,r,n,i,o,"throw",e)}i(void 0)})}}function T(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function O(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{},r=Object.keys(a);"function"==typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(a).filter(function(e){return Object.getOwnPropertyDescriptor(a,e).enumerable}))),r.forEach(function(t){T(e,t,a[t])})}return e}function P(e,t){return t=null!=t?t:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):function(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),a.push.apply(a,r)}return a}(Object(t)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(t,a))}),e}const F=(e,t)=>{const a=[],r=(e,t)=>{if(null!=e)if("object"!=typeof e||Array.isArray(e)){if(Array.isArray(e)&&e.length>0){const a=`${t}[0]`;r(e[0],a)}}else Object.keys(e).forEach(n=>{const l=t?`${t}.${n}`:n;a.push({path:l,type:j(e[n])}),"object"!=typeof e[n]||null===e[n]||Array.isArray(e[n])||r(e[n],l)})};return r(e,t),a},D=(e,t)=>{const a=t.split(".");let r=e;for(const e of a){if(e.includes("[")){var n;const[t,a]=e.split("["),l=parseInt(a.replace("]",""));r=null==r||null===(n=r[t])||void 0===n?void 0:n[l]}else r=null==r?void 0:r[e];if(null==r)return}return r},j=e=>null==e?"string":"boolean"==typeof e?"boolean":"number"==typeof e?"number":"string"==typeof e?/^\d{10}$/.test(e)||/^\d{13}$/.test(e)||/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(e)?"time":"string":"object"==typeof e&&null!==e?"json":"string";const A=new u.DataSourcePlugin(b).setConfigEditor(function({options:e,onOptionsChange:t}){const a=(e=>({container:E.css`
    max-width: 100%;
    overflow: hidden;
  `,configSection:E.css`
    background: ${e.colors.background.secondary};
    border: 1px solid ${e.colors.border.weak};
    border-radius: ${e.shape.borderRadius()};
    padding: ${e.spacing(2)};
    margin: ${e.spacing(1)} 0;
  `,formRow:E.css`
    display: flex;
    flex-wrap: wrap;
    gap: ${e.spacing(2)};
    align-items: flex-start;
    width: 100%;
    margin-bottom: ${e.spacing(2)};
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      gap: ${e.spacing(1)};
    }
  `,fieldContainer:E.css`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 250px;
    
    @media (max-width: 768px) {
      min-width: 100%;
      margin-bottom: ${e.spacing(1)};
    }
  `,fieldLabel:E.css`
    font-size: ${e.typography.bodySmall.fontSize};
    font-weight: ${e.typography.fontWeightMedium};
    color: ${e.colors.text.primary};
    margin-bottom: ${e.spacing(.5)};
  `,alertSection:E.css`
    margin-bottom: ${e.spacing(2)};
  `,sectionHeader:E.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    margin-bottom: ${e.spacing(2)};
    font-size: ${e.typography.h5.fontSize};
    font-weight: ${e.typography.h5.fontWeight};
    color: ${e.colors.text.primary};
  `,credentialsInfo:E.css`
    font-size: ${e.typography.bodySmall.fontSize};
    color: ${e.colors.text.secondary};
    margin-bottom: ${e.spacing(2)};
  `,permissionsInfo:E.css`
    background: ${e.colors.info.transparent};
    border: 1px solid ${e.colors.info.border};
    border-radius: ${e.shape.borderRadius()};
    padding: ${e.spacing(2)};
    font-size: ${e.typography.bodySmall.fontSize};
    color: ${e.colors.text.primary};
    
    code {
      background: ${e.colors.background.canvas};
      padding: 2px 4px;
      border-radius: 2px;
      font-family: ${e.typography.fontFamilyMonospace};
    }
  `}))((0,v.useTheme2)()),{jsonData:r,secureJsonFields:n,secureJsonData:l}=e,i=a=>r=>{t(S(w({},e),{secureJsonData:S(w({},l),{[a]:r.target.value})}))},o=a=>()=>{t(S(w({},e),{secureJsonFields:S(w({},n),{[a]:!1}),secureJsonData:S(w({},l),{[a]:""})}))},s=(null==r?void 0:r.region)&&(null==n?void 0:n.accessKey)&&(null==n?void 0:n.secretKey);return h().createElement("div",{className:a.container},!s&&h().createElement("div",{className:a.alertSection},h().createElement(v.Alert,{severity:"info",title:"Configuration Required"},"Configure your AWS region and permanent IAM credentials to connect to DynamoDB. Use long-term access keys for reliable access.",h().createElement("div",{style:{marginTop:"8px"}},h().createElement(v.Button,{variant:"secondary",size:"sm",onClick:()=>{t(S(w({},e),{jsonData:S(w({},r),{region:"ap-southeast-2"})}))}},"Use Example Region (ap-southeast-2)")))),h().createElement("div",{className:a.configSection},h().createElement("div",{className:a.sectionHeader},"🌍 AWS Configuration"),h().createElement("div",{className:a.formRow},h().createElement("div",{className:a.fieldContainer},h().createElement("label",{className:a.fieldLabel,title:"Select the AWS region where your DynamoDB tables are located"},"AWS Region"),h().createElement(v.Select,{placeholder:"Select AWS region",value:$.find(e=>e.value===(null==r?void 0:r.region)),options:$,onChange:a=>{t(S(w({},e),{jsonData:S(w({},r),{region:a.value||""})}))}}))),h().createElement("div",{className:a.formRow},h().createElement("div",{className:a.fieldContainer},h().createElement("label",{className:a.fieldLabel,title:"Optional: Custom DynamoDB endpoint URL for local development or VPC endpoints"},"Custom Endpoint"),h().createElement(v.Input,{placeholder:"https://dynamodb.ap-southeast-2.amazonaws.com (leave empty for default)",value:(null==r?void 0:r.endpoint)||"",onChange:(c="endpoint",a=>{t(S(w({},e),{jsonData:S(w({},r),{[c]:a.target.value})}))})})))),h().createElement("div",{className:a.configSection},h().createElement("div",{className:a.sectionHeader},"🔐 AWS Credentials"),h().createElement("div",{className:a.credentialsInfo},"Use permanent IAM user credentials (Access Key ID starting with AKIA*). This plugin is optimized for long-term credentials that don't expire. All credentials are stored securely and never visible in plain text."),h().createElement("div",{className:a.formRow},h().createElement("div",{className:a.fieldContainer},h().createElement("label",{className:a.fieldLabel},"Access Key ID"),h().createElement(v.SecretInput,{isConfigured:null==n?void 0:n.accessKey,value:(null==l?void 0:l.accessKey)||"",placeholder:"AKIA**************** (permanent access key)",onChange:i("accessKey"),onReset:o("accessKey")}))),h().createElement("div",{className:a.formRow},h().createElement("div",{className:a.fieldContainer},h().createElement("label",{className:a.fieldLabel},"Secret Access Key"),h().createElement(v.SecretInput,{isConfigured:null==n?void 0:n.secretKey,value:(null==l?void 0:l.secretKey)||"",placeholder:"Your AWS secret access key",onChange:i("secretKey"),onReset:o("secretKey")})))),h().createElement("div",{className:a.permissionsInfo},"💡 ",h().createElement("strong",null,"IAM Permissions Required:"),h().createElement("br",null),"Your AWS user/role needs these DynamoDB permissions:",h().createElement("br",null),"• ",h().createElement("code",null,"dynamodb:Query")," - for key-based queries",h().createElement("br",null),"• ",h().createElement("code",null,"dynamodb:Scan")," - for table scans",h().createElement("br",null),"• ",h().createElement("code",null,"dynamodb:ExecuteStatement")," - for PartiQL queries",h().createElement("br",null),"• ",h().createElement("code",null,"dynamodb:DescribeTable")," - for table metadata",h().createElement("br",null),"• ",h().createElement("code",null,"dynamodb:ListTables")," - for connection testing"));var c}).setQueryEditor(function({query:e,onChange:t,onRunQuery:a,datasource:r}){const n=(e=>({container:E.css`
    max-width: 100% !important;
    overflow: hidden !important;
    width: 100% !important;
    box-sizing: border-box !important;
  `,responsiveGrid:E.css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: ${e.spacing(2)};
    width: 100%;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  `,formRow:E.css`
    display: flex !important;
    flex-wrap: wrap !important;
    gap: ${e.spacing(2)} !important;
    align-items: flex-start !important;
    width: 100% !important;
    margin-bottom: ${e.spacing(2)} !important;
    box-sizing: border-box !important;
    
    /* Force wrapping on smaller screens */
    @media (max-width: 1200px) {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: ${e.spacing(1)} !important;
    }
    
    /* Additional breakpoint for tablet */
    @media (max-width: 768px) {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: ${e.spacing(1)} !important;
    }
  `,fieldContainer:E.css`
    display: flex !important;
    flex-direction: column !important;
    flex: 1 !important;
    min-width: 200px !important;
    box-sizing: border-box !important;
    
    @media (max-width: 1200px) {
      min-width: 100% !important;
      margin-bottom: ${e.spacing(1)} !important;
      flex: none !important;
    }
    
    @media (max-width: 768px) {
      min-width: 100% !important;
      margin-bottom: ${e.spacing(1)} !important;
      flex: none !important;
    }
  `,smallFieldContainer:E.css`
    display: flex;
    flex-direction: column;
    min-width: 150px;
    
    @media (max-width: 1024px) {
      min-width: 100%;
      margin-bottom: ${e.spacing(1)};
    }
  `,fieldLabel:E.css`
    font-size: ${e.typography.bodySmall.fontSize};
    font-weight: ${e.typography.fontWeightMedium};
    color: ${e.colors.text.primary};
    margin-bottom: ${e.spacing(.5)};
  `,keyValueRow:E.css`
    display: flex;
    flex-wrap: wrap;
    gap: ${e.spacing(1)};
    align-items: flex-end;
    width: 100%;
    margin-bottom: ${e.spacing(2)};
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
  `,equalSign:E.css`
    align-self: flex-end;
    padding: 0 ${e.spacing(1)};
    margin-bottom: 8px;
    font-weight: bold;
    color: ${e.colors.text.secondary};
    
    @media (max-width: 768px) {
      align-self: center;
      margin: ${e.spacing(.5)} 0;
    }
  `,querySection:E.css`
    background: ${e.colors.background.secondary} !important;
    border: 1px solid ${e.colors.border.weak} !important;
    border-radius: ${e.shape.borderRadius()} !important;
    padding: ${e.spacing(2)} !important;
    margin: ${e.spacing(1)} 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  `,mobileStack:E.css`
    @media (max-width: 1200px) {
      display: block !important;
      width: 100% !important;
      
      & > * {
        display: block !important;
        width: 100% !important;
        margin-bottom: ${e.spacing(2)} !important;
        box-sizing: border-box !important;
        float: none !important;
        clear: both !important;
      }
      
      /* Force all nested elements to be full width */
      & input,
      & button,
      & [role="combobox"],
      & [class*="input"],
      & [class*="select"] {
        width: 100% !important;
        max-width: none !important;
        min-width: auto !important;
        box-sizing: border-box !important;
      }
    }
    
    /* Even more aggressive - force on smaller screens */
    @media (max-width: 768px) {
      display: block !important;
      width: 100% !important;
      
      & > * {
        display: block !important;
        width: 100% !important;
        margin-bottom: ${e.spacing(1)} !important;
        box-sizing: border-box !important;
        float: none !important;
        clear: both !important;
      }
    }
  `,testQueryButton:E.css`
    background: ${e.colors.primary.main};
    color: ${e.colors.primary.contrastText};
    border: none;
    font-weight: 500;
    
    &:hover {
      background: ${e.colors.primary.shade};
    }
    
    &:disabled {
      background: ${e.colors.action.disabledBackground};
      color: ${e.colors.action.disabledText};
    }
  `,buttonGroup:E.css`
    display: flex;
    gap: ${e.spacing(1)};
    align-items: center;
    margin-top: ${e.spacing(2)};
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      
      & > button {
        width: 100%;
      }
    }
  `,successMessage:E.css`
    background: ${e.colors.success.transparent};
    border: 1px solid ${e.colors.success.border};
    border-radius: ${e.shape.borderRadius()};
    padding: ${e.spacing(1)};
    color: ${e.colors.success.text};
    font-size: ${e.typography.bodySmall.fontSize};
    margin-top: ${e.spacing(1)};
  `,advancedSection:E.css`
    background: ${e.colors.background.secondary};
    border: 1px solid ${e.colors.border.weak};
    border-radius: ${e.shape.borderRadius()};
    padding: ${e.spacing(2)};
    margin-top: ${e.spacing(2)};
  `,fieldMappingCard:E.css`
    background: ${e.colors.background.primary};
    border: 1px solid ${e.colors.border.medium};
    border-radius: ${e.shape.borderRadius()};
    padding: ${e.spacing(2)};
    margin: ${e.spacing(1)} 0;
  `,infoText:E.css`
    font-size: ${e.typography.bodySmall.fontSize};
    color: ${e.colors.text.secondary};
    margin-top: ${e.spacing(1)};
  `}))((0,v.useTheme2)()),[l,i]=(0,y.useState)(!1),[o,s]=(0,y.useState)(!1),[c,m]=(0,y.useState)(!1),[d,p]=(0,y.useState)(!1),f=a=>r=>{t(P(O({},e),{[a]:r.target.value}))},g=()=>k(function*(){if(e.partiql){if(!e.partiql.trim())return void alert("Please enter a PartiQL query first")}else if(!e.table)return void alert("Please enter a table name first");m(!0);try{const r=P(O({},e),{limit:Math.min(e.limit||1,1e6),discoverSchema:!1});t(r),setTimeout(a,100)}catch(e){console.error("Test query failed:",e)}finally{setTimeout(()=>m(!1),2e3)}})(),b=(a,r,n)=>{const l=[...e.fieldMappings||[]];l[a]=P(O({},l[a]),{[r]:n}),t(P(O({},e),{fieldMappings:l}))},{partiql:x,table:w,partitionKeyName:S,partitionKeyValue:$,sortKeyName:C,sortKeyValue:T,limit:A,outputFormat:I,fieldMappings:M}=e,z=[{label:"Auto-detect",value:"auto"},{label:"Table View",value:"table"},{label:"Geomap",value:"geomap"},{label:"Time Series",value:"timeseries"}],L=[{label:"String",value:"string"},{label:"Number",value:"number"},{label:"Boolean",value:"boolean"},{label:"Time",value:"time"},{label:"JSON",value:"json"}];return h().createElement("div",{className:n.container},h().createElement("div",{className:n.querySection},h().createElement(v.RadioButtonGroup,{options:[{label:"PartiQL Query",value:"partiql"},{label:"Key Query",value:"key"}],value:x?"partiql":"key",onChange:a=>{t(P(O({},e),"partiql"===a?{partiql:e.partiql||'SELECT * FROM "YourTableName" LIMIT 10'}:{partiql:void 0}))}})),h().createElement("div",{className:n.querySection},x?h().createElement("div",null,h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"PartiQL Query"),h().createElement(v.Input,{placeholder:'SELECT * FROM "YourTableName" LIMIT 10',value:x||"",onChange:f("partiql"),onBlur:a})),h().createElement("div",{className:n.buttonGroup},h().createElement(v.Button,{className:n.testQueryButton,variant:"primary",size:"sm",icon:"play",disabled:c,onClick:g},c?"Testing...":"Test Query"))):h().createElement("div",null,h().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"Table Name"),h().createElement(v.Input,{placeholder:"YourTableName",value:w||"",onChange:f("table")})),h().createElement("div",{style:{alignSelf:"flex-end"}},h().createElement(v.Button,{variant:"secondary",size:"sm",icon:"search",disabled:o,onClick:()=>k(function*(){if(e.table){s(!0);try{const r=P(O({},e),{discoverSchema:!0,fieldMappings:void 0,outputFormat:"auto",limit:e.limit||100});t(r),a(),alert("🔍 Discovering schema... The system is analyzing your table structure to understand the data format.")}catch(e){console.error("Schema discovery failed:",e),alert("Schema discovery failed. Please check your table name and connection settings.")}finally{setTimeout(()=>s(!1),500)}}else alert("Please enter a table name first")})()},o?"Discovering...":"Discover Schema"))),h().createElement("div",{className:`${n.keyValueRow} ${n.mobileStack}`},h().createElement("div",{className:n.smallFieldContainer},h().createElement("label",{className:n.fieldLabel},"Partition Key"),h().createElement(v.Input,{placeholder:"id",value:S||"",onChange:f("partitionKeyName")})),h().createElement("span",{className:n.equalSign},"="),h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"Partition Key Value"),h().createElement(v.Input,{placeholder:"0009 (or empty for all)",value:$||"",onChange:f("partitionKeyValue")}))),h().createElement("div",{className:`${n.keyValueRow} ${n.mobileStack}`},h().createElement("div",{className:n.smallFieldContainer},h().createElement("label",{className:n.fieldLabel},"Sort Key"),h().createElement(v.Input,{placeholder:"Timestamp (optional)",value:C||"",onChange:f("sortKeyName")})),h().createElement("span",{className:n.equalSign},"="),h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"Sort Key Value"),h().createElement(v.Input,{placeholder:"1753765220 (optional)",value:T||"",onChange:f("sortKeyValue")}))),h().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},h().createElement(v.InlineField,{label:"Enable Time Filtering",labelWidth:20},h().createElement(v.InlineSwitch,{value:e.timeFilterEnabled||!1,onChange:a=>{const r=a.currentTarget.checked;t(P(O({},e),{timeFilterEnabled:r,timeFrom:r?e.timeFrom:void 0,timeTo:r?e.timeTo:void 0}))}}))),e.timeFilterEnabled&&h().createElement(h().Fragment,null,h().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"Timestamp Field Name"),h().createElement(v.Input,{placeholder:"timestamp",value:e.timestampField||"timestamp",onChange:a=>{t(P(O({},e),{timestampField:a.target.value}))}}))),h().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"From Date/Time"),h().createElement(v.DateTimePicker,{date:e.timeFrom?(0,u.dateTime)(e.timeFrom):(0,u.dateTime)().subtract(24,"hours"),onChange:a=>{a&&t(P(O({},e),{timeFrom:a.toISOString()}))}})),h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"To Date/Time"),h().createElement(v.DateTimePicker,{date:e.timeTo?(0,u.dateTime)(e.timeTo):(0,u.dateTime)(),onChange:a=>{a&&t(P(O({},e),{timeTo:a.toISOString()}))}})))),h().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},h().createElement("div",{className:n.smallFieldContainer},h().createElement("label",{className:n.fieldLabel},"Limit"),h().createElement(v.Input,{type:"number",placeholder:"100",value:A||100,onChange:a=>{t(P(O({},e),{limit:parseInt(a.target.value,10)||100}))}})),h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"Output Format"),h().createElement(v.Select,{value:z.find(e=>e.value===I),options:z,onChange:a=>{const r=a.value;t(P(O({},e),{outputFormat:r||"auto"}))}}))),h().createElement("div",{className:n.buttonGroup},h().createElement(v.Button,{className:n.testQueryButton,variant:"primary",size:"md",icon:"play",disabled:c,onClick:g},c?"Executing Query...":"Run Query"),h().createElement(v.Button,{variant:"secondary",size:"md",icon:"search",onClick:()=>k(function*(){if(e.table){s(!0);try{var a;const n=P(O({},e),{discoverSchema:!0,limit:e.limit||100,fieldMappings:void 0,refId:"schema_discovery"}),l=O({},e),o={targets:[n],range:{from:(0,u.dateTime)().subtract(1,"hour"),to:(0,u.dateTime)(),raw:{from:"now-1h",to:"now"}},interval:"1s",intervalMs:1e3,maxDataPoints:500,scopedVars:{},timezone:"UTC",app:u.CoreApp.Explore,requestId:"schema_discovery",startTime:Date.now()},s=r.query(o),c=yield(0,N.firstValueFrom)(s);if(null===(a=c.data)||void 0===a||a.length,c.data&&c.data.length>0){const a=c.data[0],n=[];if(a.fields&&a.fields.length>0){const e=a.fields.find(e=>"field_path"===e.name),t=a.fields.find(e=>"data_type"===e.name),r=a.fields.find(e=>"sample_value"===e.name);if(e&&t&&e.values)for(let a=0;a<e.values.length;a++){const l=e.values.get(a),i=t.values.get(a);null==r||r.values.get(a);if(l&&i){const e=l.replace(/\[.*?\]/g,"").replace(/\./g,"_");n.push({fieldName:e||l,sourcePath:l,dataType:i})}}}if(n.length>0){const a=P(O({},l),{fieldMappings:n,outputFormat:"table",discoverSchema:!1});t(a),i(!0),alert(`✅ Successfully discovered ${n.length} fields from ${e.limit||100} records! Check the Advanced Field Mapping section below to customize as needed.`)}else{try{const e=yield((e,t)=>k(function*(){const a={targets:[P(O({},e),{discoverSchema:!1,outputFormat:"auto",limit:e.limit||100})],range:{from:(0,u.dateTime)().subtract(1,"hour"),to:(0,u.dateTime)(),raw:{from:"now-1h",to:"now"}},interval:"1s",intervalMs:1e3,maxDataPoints:500,scopedVars:{},timezone:"UTC",app:u.CoreApp.Explore,requestId:"fallback_analysis",startTime:Date.now()},r=yield(0,N.firstValueFrom)(t.query(a)),n=[];if(r.data&&r.data.length>0){const e=r.data[0].fields.find(e=>"raw_json"===e.name);if(e&&e.values&&e.values.length>0){const t=Math.min(3,e.values.length),a=new Set;for(let r=0;r<t;r++){const t=e.values.get(r);try{const e=JSON.parse(t);F(e,"").forEach(e=>a.add(e.path))}catch(e){console.error("Failed to parse raw JSON:",e)}}const r=Array.from(a).sort(),l=40;r.slice(0,l).forEach(t=>{const a=t.replace(/\[.*?\]/g,"").replace(/\./g,"_");let r="string";try{const a=JSON.parse(e.values.get(0)),n=D(a,t);r=j(n)}catch(e){r="string"}n.push({fieldName:a||t.split(".").pop()||"field",sourcePath:t,dataType:r})}),r.length}}return n})())(l,r);if(e.length>0){const a=P(O({},l),{fieldMappings:e,outputFormat:"table",discoverSchema:!1});return t(a),i(!0),void alert(`✅ Used fallback analysis and discovered ${e.length} fields! The backend schema discovery had issues, but we successfully analyzed your raw data directly. Check the Advanced Field Mapping section below.`)}}catch(e){console.error("Fallback analysis also failed:",e)}alert("⚠️ No fields could be discovered from the schema response. The data structure might be too complex or there was an issue with field analysis. Try running a normal query first to verify your table access.")}}else c.error?(console.error("Response error:",c.error),alert(`❌ Schema discovery failed with error: ${c.error.message||"Unknown error"}`)):alert("⚠️ Schema discovery returned no data frames. This could indicate:\n• Table name is incorrect\n• Table has no data\n• Connection/permission issues\n• Backend processing error\n\nTry running a normal query first to verify your table works.")}catch(e){console.error("Schema discovery failed:",e),alert("❌ Schema discovery failed. Please check your table name, connection settings, and ensure the table contains data.")}finally{s(!1)}}else alert("Please enter a table name first to get sample data for field mapping")})(),disabled:o},o?"Discovering Fields...":"Discover Schema")))),h().createElement("div",null,h().createElement(v.Button,{variant:"secondary",size:"sm",icon:l?"angle-down":"angle-right",fill:"outline",onClick:()=>i(!l)},"Advanced Field Mapping (",(M||[]).length," fields)")),l&&h().createElement("div",{className:n.advancedSection},h().createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}},h().createElement("h4",{style:{margin:0}},"Field Mappings"),h().createElement("div",{style:{display:"flex",gap:"8px"}},h().createElement(v.Button,{variant:"secondary",size:"sm",icon:"plus",onClick:()=>{const a=[...e.fieldMappings||[],{fieldName:"",sourcePath:"",dataType:"string"}];t(P(O({},e),{fieldMappings:a}))}},"Add Field"),h().createElement(v.Button,{variant:"primary",size:"sm",icon:"check",onClick:()=>k(function*(){if((e.fieldMappings||[]).filter(e=>!e.fieldName.trim()||!e.sourcePath.trim()).length>0)alert("Please fill in all field names and source paths before applying mappings.");else try{m(!0);const r=P(O({},e),{limit:Math.min(e.limit||25,100),discoverSchema:!1});t(r),setTimeout(()=>{a(),p(!0),setTimeout(()=>{p(!1)},3e3)},100)}catch(e){console.error("Failed to apply field mappings:",e),alert("Failed to apply field mappings. Please check your configuration.")}finally{setTimeout(()=>m(!1),2e3)}})(),disabled:0===(M||[]).length},"Apply Mappings"))),d&&h().createElement("div",{className:n.successMessage},"✅ Field mappings applied successfully! Check the results below."),(M||[]).map((a,r)=>h().createElement("div",{key:r,className:n.fieldMappingCard},h().createElement("div",{className:n.responsiveGrid},h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"Field Name"),h().createElement(v.Input,{value:a.fieldName,onChange:e=>b(r,"fieldName",e.target.value),placeholder:"Display name (e.g., 'User ID')"})),h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"Source Path"),h().createElement(v.Input,{value:a.sourcePath,onChange:e=>b(r,"sourcePath",e.target.value),placeholder:"Data path (e.g., 'user.id', 'items[0].name')"})),h().createElement("div",{className:n.smallFieldContainer},h().createElement("label",{className:n.fieldLabel},"Data Type"),h().createElement(v.Select,{value:L.find(e=>e.value===a.dataType),options:L,onChange:e=>b(r,"dataType",e.value||"string")})),h().createElement("div",{className:n.fieldContainer},h().createElement("label",{className:n.fieldLabel},"Transform"),h().createElement(v.Input,{value:a.transformation||"",onChange:e=>b(r,"transformation",e.target.value),placeholder:"parseFloat, timestamp"})),h().createElement("div",{style:{display:"flex",alignItems:"flex-end",marginTop:"20px"}},h().createElement(v.Button,{variant:"destructive",size:"sm",icon:"trash-alt",onClick:()=>(a=>{const r=(e.fieldMappings||[]).filter((e,t)=>t!==a);t(P(O({},e),{fieldMappings:r}))})(r)}))))),0===(M||[]).length&&h().createElement(v.Alert,{severity:"info",title:"No field mappings configured"},h().createElement("strong",null,"Quick Start:"),h().createElement("br",null),"1. Click ",h().createElement("strong",null,'"Discover Schema"')," above to automatically analyze your table",h().createElement("br",null),"2. Or manually add field mappings using the ",h().createElement("strong",null,'"Add Field"')," button",h().createElement("br",null),"3. Click ",h().createElement("strong",null,'"Apply Mappings"')," to test your configuration",h().createElement("br",null),h().createElement("br",null),h().createElement("strong",null,"Field Mapping Examples:"),h().createElement("br",null),'• Field Name: "User ID" → Source Path: "userId" → Type: "string"',h().createElement("br",null),'• Field Name: "Location" → Source Path: "geo.coordinates" → Type: "json"',h().createElement("br",null),'• Field Name: "Score" → Source Path: "metrics.score" → Type: "number"')))});return m})());
//# sourceMappingURL=module.js.map
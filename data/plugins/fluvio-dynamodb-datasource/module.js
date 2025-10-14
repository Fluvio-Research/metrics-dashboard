/* [create-plugin] version: 5.25.7 */
define(["@grafana/ui","@emotion/css","rxjs","module","@grafana/runtime","@grafana/data","react"],(e,t,a,l,r,n,i)=>(()=>{"use strict";var o={7:t=>{t.exports=e},89:e=>{e.exports=t},269:e=>{e.exports=a},308:e=>{e.exports=l},531:e=>{e.exports=r},781:e=>{e.exports=n},959:e=>{e.exports=i}},s={};function c(e){var t=s[e];if(void 0!==t)return t.exports;var a=s[e]={exports:{}};return o[e](a,a.exports,c),a.exports}c.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return c.d(t,{a:t}),t},c.d=(e,t)=>{for(var a in t)c.o(t,a)&&!c.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},c.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),c.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},c.p="public/plugins/fluvio-dynamodb-datasource/";var m={};c.r(m),c.d(m,{plugin:()=>R});var d=c(308),u=c.n(d);c.p=u()&&u().uri?u().uri.slice(0,u().uri.lastIndexOf("/")+1):"public/plugins/fluvio-dynamodb-datasource/";var p=c(781),g=c(531);const b={limit:100,outputFormat:"auto",fieldMappings:[],discoverSchema:!1,timeFilterEnabled:!1,timestampField:"timestamp",queryMode:"key",partitionKeyMode:"single",sortKeyOperator:"eq",sortDirection:"asc"};function f(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function y(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{},l=Object.keys(a);"function"==typeof Object.getOwnPropertySymbols&&(l=l.concat(Object.getOwnPropertySymbols(a).filter(function(e){return Object.getOwnPropertyDescriptor(a,e).enumerable}))),l.forEach(function(t){f(e,t,a[t])})}return e}function v(e,t){return t=null!=t?t:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):function(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);t&&(l=l.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),a.push.apply(a,l)}return a}(Object(t)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(t,a))}),e}class h extends g.DataSourceWithBackend{getDefaultQuery(e){return b}filterQuery(e){return!!e.partiql||!!e.table}applyTemplateVariables(e,t,a){var l;e.timeFilterEnabled&&t.__from&&t.__to&&(e.timeFrom=new Date(t.__from.value).toISOString(),e.timeTo=new Date(t.__to.value).toISOString());const r=y({},t),{fromUnix:n,toUnix:i,fromIso:o,toIso:s}=this.resolveTimeRange(t,e);r.__from={value:n.toString()},r.__to={value:i.toString()},r.__fromIso={value:o},r.__toIso={value:s},r.__interval={value:"$__interval"},r.__interval_ms={value:"$__interval_ms"};const c=e.timestampField?this.templateSrv.replace(e.timestampField,r):e.timestampField,m=c||"timestamp",d=this.formatPartiqlIdentifier(m);if(e.timeFilterEnabled){const e=`${d} BETWEEN ${n} AND ${i}`;r.__timeFilter={value:e}}else r.__timeFilter={value:"1=1"};return v(y({},e),{timeFrom:o,timeTo:s,partiql:e.partiql?(()=>{e.partiql;return this.templateSrv.replace(e.partiql,r)})():e.partiql,table:e.table?this.templateSrv.replace(e.table,r):e.table,partitionKeyName:e.partitionKeyName?this.templateSrv.replace(e.partitionKeyName,r):e.partitionKeyName,partitionKeyMode:e.partitionKeyMode,partitionKeyValues:e.partitionKeyValues?e.partitionKeyValues.map(e=>this.templateSrv.replace(e,r)).filter(e=>""!==e):e.partitionKeyValues,partitionKeyValue:e.partitionKeyValue?this.templateSrv.replace(e.partitionKeyValue,r):e.partitionKeyValue,sortKeyName:e.sortKeyName?this.templateSrv.replace(e.sortKeyName,r):e.sortKeyName,sortKeyValue:e.sortKeyValue?this.templateSrv.replace(e.sortKeyValue,r):e.sortKeyValue,sortKeyOperator:e.sortKeyOperator,sortKeyRangeStart:e.sortKeyRangeStart?this.templateSrv.replace(e.sortKeyRangeStart,r):e.sortKeyRangeStart,sortKeyRangeEnd:e.sortKeyRangeEnd?this.templateSrv.replace(e.sortKeyRangeEnd,r):e.sortKeyRangeEnd,sortKeyValues:e.sortKeyValues?e.sortKeyValues.map(e=>this.templateSrv.replace(e,r)).filter(e=>""!==e):e.sortKeyValues,sortDirection:e.sortDirection,timestampField:c,fieldMappings:(null===(l=e.fieldMappings)||void 0===l?void 0:l.map(e=>v(y({},e),{sourcePath:this.templateSrv.replace(e.sourcePath,r),fieldName:this.templateSrv.replace(e.fieldName,r)})))||e.fieldMappings})}resolveTimeRange(e,t){var a,l;const r=Date.now(),n=r-864e5,i=r;let o,s;void 0!==(null===(a=e.__from)||void 0===a?void 0:a.value)&&(o=this.coerceToMillis(e.__from.value)),void 0!==(null===(l=e.__to)||void 0===l?void 0:l.value)&&(s=this.coerceToMillis(e.__to.value)),!o&&t.timeFrom&&(o=this.coerceToMillis(t.timeFrom)),!s&&t.timeTo&&(s=this.coerceToMillis(t.timeTo)),o=null!=o?o:n,s=null!=s?s:i;const c=Math.min(o,s),m=Math.max(o,s);return{fromUnix:Math.floor(c/1e3),toUnix:Math.floor(m/1e3),fromIso:new Date(c).toISOString(),toIso:new Date(m).toISOString()}}coerceToMillis(e){if(null!=e){if("number"==typeof e){if(!Number.isFinite(e))return;return this.normalizeEpoch(e)}if("string"==typeof e){const t=e.trim();if(""===t)return;const a=Number(t);if(!Number.isNaN(a))return this.normalizeEpoch(a);const l=Date.parse(t);return Number.isNaN(l)?void 0:l}if(e instanceof Date){const t=e.getTime();return Number.isFinite(t)?t:void 0}if("function"==typeof e.toMillis){const t=e.toMillis();if(Number.isFinite(t))return t}if("function"==typeof e.valueOf){const t=e.valueOf();if("number"==typeof t&&Number.isFinite(t))return this.normalizeEpoch(t)}if("function"==typeof e.toISOString){const t=e.toISOString(),a=Date.parse(t);if(!Number.isNaN(a))return a}}}normalizeEpoch(e){return e>=0&&e<=41e8?1e3*e:e}formatPartiqlIdentifier(e){if(!e)return'"timestamp"';const t=e.trim();return""===t?'"timestamp"':/["'\s()\[\]]/.test(t)?t:t.split(".").map(e=>`"${e.replace(/"/g,'""')}"`).join(".")}getVariables(){return this.templateSrv.getVariables().map(e=>`$${e.name}`)}constructor(e){super(e),f(this,"instanceSettings",void 0),f(this,"templateSrv",void 0),this.instanceSettings=e,this.templateSrv=(0,g.getTemplateSrv)(),console.error("🚀 FLUVIO DYNAMODB PLUGIN LOADED!",Date.now()),console.warn("🚀 Instance Settings:",e)}}var E=c(959),S=c.n(E),w=c(7),N=c(89);function x(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function $(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{},l=Object.keys(a);"function"==typeof Object.getOwnPropertySymbols&&(l=l.concat(Object.getOwnPropertySymbols(a).filter(function(e){return Object.getOwnPropertyDescriptor(a,e).enumerable}))),l.forEach(function(t){x(e,t,a[t])})}return e}function T(e,t){return t=null!=t?t:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):function(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);t&&(l=l.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),a.push.apply(a,l)}return a}(Object(t)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(t,a))}),e}const O=[{label:"US East (N. Virginia) - us-east-1",value:"us-east-1"},{label:"US East (Ohio) - us-east-2",value:"us-east-2"},{label:"US West (N. California) - us-west-1",value:"us-west-1"},{label:"US West (Oregon) - us-west-2",value:"us-west-2"},{label:"Asia Pacific (Sydney) - ap-southeast-2",value:"ap-southeast-2"},{label:"Asia Pacific (Singapore) - ap-southeast-1",value:"ap-southeast-1"},{label:"Asia Pacific (Tokyo) - ap-northeast-1",value:"ap-northeast-1"},{label:"Asia Pacific (Seoul) - ap-northeast-2",value:"ap-northeast-2"},{label:"Asia Pacific (Mumbai) - ap-south-1",value:"ap-south-1"},{label:"Europe (Ireland) - eu-west-1",value:"eu-west-1"},{label:"Europe (London) - eu-west-2",value:"eu-west-2"},{label:"Europe (Frankfurt) - eu-central-1",value:"eu-central-1"},{label:"Europe (Stockholm) - eu-north-1",value:"eu-north-1"},{label:"Canada (Central) - ca-central-1",value:"ca-central-1"},{label:"South America (São Paulo) - sa-east-1",value:"sa-east-1"}];var F=c(269);function C(e,t,a,l,r,n,i){try{var o=e[n](i),s=o.value}catch(e){return void a(e)}o.done?t(s):Promise.resolve(s).then(l,r)}function K(e){return function(){var t=this,a=arguments;return new Promise(function(l,r){var n=e.apply(t,a);function i(e){C(n,l,r,i,o,"next",e)}function o(e){C(n,l,r,i,o,"throw",e)}i(void 0)})}}function k(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function P(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{},l=Object.keys(a);"function"==typeof Object.getOwnPropertySymbols&&(l=l.concat(Object.getOwnPropertySymbols(a).filter(function(e){return Object.getOwnPropertyDescriptor(a,e).enumerable}))),l.forEach(function(t){k(e,t,a[t])})}return e}function _(e,t){return t=null!=t?t:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):function(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);t&&(l=l.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),a.push.apply(a,l)}return a}(Object(t)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(t,a))}),e}const D=(e,t)=>{const a=[],l=(e,t)=>{if(null!=e)if("object"!=typeof e||Array.isArray(e)){if(Array.isArray(e)&&e.length>0){const a=`${t}[0]`;l(e[0],a)}}else Object.keys(e).forEach(r=>{const n=t?`${t}.${r}`:r;a.push({path:n,type:I(e[r])}),"object"!=typeof e[r]||null===e[r]||Array.isArray(e[r])||l(e[r],n)})};return l(e,t),a},M=(e,t)=>{const a=t.split(".");let l=e;for(const e of a){if(e.includes("[")){var r;const[t,a]=e.split("["),n=parseInt(a.replace("]",""),10);l=null==l||null===(r=l[t])||void 0===r?void 0:r[n]}else l=null==l?void 0:l[e];if(null==l)return}return l},I=e=>null==e?"string":"boolean"==typeof e?"boolean":"number"==typeof e?"number":"string"==typeof e?/^\d{10}$/.test(e)||/^\d{13}$/.test(e)||/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(e)?"time":"string":"object"==typeof e&&null!==e?"json":"string";const R=new p.DataSourcePlugin(h).setConfigEditor(function({options:e,onOptionsChange:t}){const a=(e=>({container:N.css`
    max-width: 100%;
    overflow: hidden;
  `,configSection:N.css`
    background: ${e.colors.background.secondary};
    border: 1px solid ${e.colors.border.weak};
    border-radius: ${e.shape.borderRadius()};
    padding: ${e.spacing(2)};
    margin: ${e.spacing(1)} 0;
  `,formRow:N.css`
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
  `,fieldContainer:N.css`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 250px;
    
    @media (max-width: 768px) {
      min-width: 100%;
      margin-bottom: ${e.spacing(1)};
    }
  `,fieldLabel:N.css`
    font-size: ${e.typography.bodySmall.fontSize};
    font-weight: ${e.typography.fontWeightMedium};
    color: ${e.colors.text.primary};
    margin-bottom: ${e.spacing(.5)};
  `,alertSection:N.css`
    margin-bottom: ${e.spacing(2)};
  `,sectionHeader:N.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    margin-bottom: ${e.spacing(2)};
    font-size: ${e.typography.h5.fontSize};
    font-weight: ${e.typography.h5.fontWeight};
    color: ${e.colors.text.primary};
  `,credentialsInfo:N.css`
    font-size: ${e.typography.bodySmall.fontSize};
    color: ${e.colors.text.secondary};
    margin-bottom: ${e.spacing(2)};
  `,permissionsInfo:N.css`
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
  `}))((0,w.useTheme2)()),{jsonData:l,secureJsonFields:r,secureJsonData:n}=e,i=a=>l=>{t(T($({},e),{secureJsonData:T($({},n),{[a]:l.target.value})}))},o=a=>()=>{t(T($({},e),{secureJsonFields:T($({},r),{[a]:!1}),secureJsonData:T($({},n),{[a]:""})}))},s=(null==l?void 0:l.region)&&(null==r?void 0:r.accessKey)&&(null==r?void 0:r.secretKey);return S().createElement("div",{className:a.container},!s&&S().createElement("div",{className:a.alertSection},S().createElement(w.Alert,{severity:"info",title:"Configuration Required"},"Configure your AWS region and permanent IAM credentials to connect to DynamoDB. Use long-term access keys for reliable access.",S().createElement("div",{style:{marginTop:"8px"}},S().createElement(w.Button,{variant:"secondary",size:"sm",onClick:()=>{t(T($({},e),{jsonData:T($({},l),{region:"ap-southeast-2"})}))}},"Use Example Region (ap-southeast-2)")))),S().createElement("div",{className:a.configSection},S().createElement("div",{className:a.sectionHeader},"🌍 AWS Configuration"),S().createElement("div",{className:a.formRow},S().createElement("div",{className:a.fieldContainer},S().createElement("label",{className:a.fieldLabel,title:"Select the AWS region where your DynamoDB tables are located"},"AWS Region"),S().createElement(w.Select,{placeholder:"Select AWS region",value:O.find(e=>e.value===(null==l?void 0:l.region)),options:O,onChange:a=>{t(T($({},e),{jsonData:T($({},l),{region:a.value||""})}))}}))),S().createElement("div",{className:a.formRow},S().createElement("div",{className:a.fieldContainer},S().createElement("label",{className:a.fieldLabel,title:"Optional: Custom DynamoDB endpoint URL for local development or VPC endpoints"},"Custom Endpoint"),S().createElement(w.Input,{placeholder:"https://dynamodb.ap-southeast-2.amazonaws.com (leave empty for default)",value:(null==l?void 0:l.endpoint)||"",onChange:(c="endpoint",a=>{t(T($({},e),{jsonData:T($({},l),{[c]:a.target.value})}))})})))),S().createElement("div",{className:a.configSection},S().createElement("div",{className:a.sectionHeader},"🔐 AWS Credentials"),S().createElement("div",{className:a.credentialsInfo},"Use permanent IAM user credentials (Access Key ID starting with AKIA*). This plugin is optimized for long-term credentials that don't expire. All credentials are stored securely and never visible in plain text."),S().createElement("div",{className:a.formRow},S().createElement("div",{className:a.fieldContainer},S().createElement("label",{className:a.fieldLabel},"Access Key ID"),S().createElement(w.SecretInput,{isConfigured:null==r?void 0:r.accessKey,value:(null==n?void 0:n.accessKey)||"",placeholder:"AKIA**************** (permanent access key)",onChange:i("accessKey"),onReset:o("accessKey")}))),S().createElement("div",{className:a.formRow},S().createElement("div",{className:a.fieldContainer},S().createElement("label",{className:a.fieldLabel},"Secret Access Key"),S().createElement(w.SecretInput,{isConfigured:null==r?void 0:r.secretKey,value:(null==n?void 0:n.secretKey)||"",placeholder:"Your AWS secret access key",onChange:i("secretKey"),onReset:o("secretKey")})))),S().createElement("div",{className:a.permissionsInfo},"💡 ",S().createElement("strong",null,"IAM Permissions Required:"),S().createElement("br",null),"Your AWS user/role needs these DynamoDB permissions:",S().createElement("br",null),"• ",S().createElement("code",null,"dynamodb:Query")," - for key-based queries",S().createElement("br",null),"• ",S().createElement("code",null,"dynamodb:Scan")," - for table scans",S().createElement("br",null),"• ",S().createElement("code",null,"dynamodb:ExecuteStatement")," - for PartiQL queries",S().createElement("br",null),"• ",S().createElement("code",null,"dynamodb:DescribeTable")," - for table metadata",S().createElement("br",null),"• ",S().createElement("code",null,"dynamodb:ListTables")," - for connection testing"));var c}).setQueryEditor(function({query:e,onChange:t,onRunQuery:a,datasource:l}){const r=(0,w.useTheme2)(),n=(e=>({container:N.css`
    max-width: 100% !important;
    overflow: hidden !important;
    width: 100% !important;
    box-sizing: border-box !important;
  `,responsiveGrid:N.css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: ${e.spacing(2)};
    width: 100%;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  `,formRow:N.css`
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
  `,fieldContainer:N.css`
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
  `,smallFieldContainer:N.css`
    display: flex;
    flex-direction: column;
    min-width: 150px;
    
    @media (max-width: 1024px) {
      min-width: 100%;
      margin-bottom: ${e.spacing(1)};
    }
  `,fieldLabel:N.css`
    font-size: ${e.typography.bodySmall.fontSize};
    font-weight: ${e.typography.fontWeightMedium};
    color: ${e.colors.text.primary};
    margin-bottom: ${e.spacing(.5)};
  `,keyValueRow:N.css`
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
  `,equalSign:N.css`
    align-self: flex-end;
    padding: 0 ${e.spacing(1)};
    margin-bottom: 8px;
    font-weight: bold;
    color: ${e.colors.text.secondary};
    
    @media (max-width: 768px) {
      align-self: center;
      margin: ${e.spacing(.5)} 0;
    }
  `,querySection:N.css`
    background: ${e.colors.background.secondary} !important;
    border: 1px solid ${e.colors.border.weak} !important;
    border-radius: ${e.shape.borderRadius()} !important;
    padding: ${e.spacing(2)} !important;
    margin: ${e.spacing(1)} 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  `,mobileStack:N.css`
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
  `,testQueryButton:N.css`
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
  `,buttonGroup:N.css`
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
  `,successMessage:N.css`
    background: ${e.colors.success.transparent};
    border: 1px solid ${e.colors.success.border};
    border-radius: ${e.shape.borderRadius()};
    padding: ${e.spacing(1)};
    color: ${e.colors.success.text};
    font-size: ${e.typography.bodySmall.fontSize};
    margin-top: ${e.spacing(1)};
  `,advancedSection:N.css`
    background: ${e.colors.background.secondary};
    border: 1px solid ${e.colors.border.weak};
    border-radius: ${e.shape.borderRadius()};
    padding: ${e.spacing(2)};
    margin-top: ${e.spacing(2)};
  `,fieldMappingCard:N.css`
    background: ${e.colors.background.primary};
    border: 1px solid ${e.colors.border.medium};
    border-radius: ${e.shape.borderRadius()};
    padding: ${e.spacing(2)};
    margin: ${e.spacing(1)} 0;
  `,infoText:N.css`
    font-size: ${e.typography.bodySmall.fontSize};
    color: ${e.colors.text.secondary};
    margin-top: ${e.spacing(1)};
  `}))(r),[i,o]=(0,E.useState)(!1),[s,c]=(0,E.useState)(!1),[m,d]=(0,E.useState)(!1),[u,g]=(0,E.useState)(!1),[b,f]=(0,E.useState)(!1),y=S().useMemo(()=>{try{return l.getVariables?l.getVariables():[]}catch(e){return[]}},[l]);var v;const h=null!==(v=e.queryMode)&&void 0!==v?v:void 0!==e.partiql?"partiql":"key";S().useEffect(()=>{e.queryMode||t(_(P({},e),{queryMode:h}))},[e.queryMode,h]);const x=a=>l=>{t(_(P({},e),{[a]:l.target.value}))},$=a=>{t(_(P({},e),{limit:parseInt(a.target.value,10)||100}))},T=a=>{const l=a.value;t(_(P({},e),{outputFormat:l||"auto"}))},O=()=>K(function*(){const a=Boolean(e.partiql&&e.partiql.trim().length>0),r=Boolean(e.table&&e.table.trim().length>0);if(a||r){c(!0);try{var n;const a=_(P({},e),{discoverSchema:!0,limit:e.limit||100,fieldMappings:void 0,refId:"schema_discovery"}),r=P({},e),i={targets:[a],range:{from:(0,p.dateTime)().subtract(1,"hour"),to:(0,p.dateTime)(),raw:{from:"now-1h",to:"now"}},interval:"1s",intervalMs:1e3,maxDataPoints:500,scopedVars:{},timezone:"UTC",app:p.CoreApp.Explore,requestId:"schema_discovery",startTime:Date.now()},s=l.query(i),c=yield(0,F.firstValueFrom)(s);if(null===(n=c.data)||void 0===n||n.length,c.data&&c.data.length>0){const a=c.data[0],n=[];if(a.fields&&a.fields.length>0){const e=a.fields.find(e=>"field_path"===e.name),t=a.fields.find(e=>"data_type"===e.name),l=a.fields.find(e=>"sample_value"===e.name);if(e&&t&&e.values)for(let a=0;a<e.values.length;a++){const r=e.values.get(a),i=t.values.get(a);null==l||l.values.get(a);if(r&&i){const e=r.replace(/\[.*?\]/g,"").replace(/\./g,"_");n.push({fieldName:e||r,sourcePath:r,dataType:i})}}}if(n.length>0){const a=_(P({},r),{fieldMappings:n,outputFormat:"table",discoverSchema:!1});t(a),o(!0),alert(`✅ Successfully discovered ${n.length} fields from ${e.limit||100} records! Check the Advanced Field Mapping section below to customize as needed.`)}else{try{const e=yield((e,t)=>K(function*(){const a={targets:[_(P({},e),{discoverSchema:!1,outputFormat:"auto",limit:e.limit||100})],range:{from:(0,p.dateTime)().subtract(1,"hour"),to:(0,p.dateTime)(),raw:{from:"now-1h",to:"now"}},interval:"1s",intervalMs:1e3,maxDataPoints:500,scopedVars:{},timezone:"UTC",app:p.CoreApp.Explore,requestId:"fallback_analysis",startTime:Date.now()},l=yield(0,F.firstValueFrom)(t.query(a)),r=[];if(l.data&&l.data.length>0){const e=l.data[0].fields.find(e=>"raw_json"===e.name);if(e&&e.values&&e.values.length>0){const t=Math.min(3,e.values.length),a=new Set;for(let l=0;l<t;l++){const t=e.values.get(l);try{const e=JSON.parse(t);D(e,"").forEach(e=>a.add(e.path))}catch(e){console.error("Failed to parse raw JSON:",e)}}const l=Array.from(a).sort(),n=40;l.slice(0,n).forEach(t=>{const a=t.replace(/\[.*?\]/g,"").replace(/\./g,"_");let l="string";try{const a=JSON.parse(e.values.get(0)),r=M(a,t);l=I(r)}catch(e){l="string"}r.push({fieldName:a||t.split(".").pop()||"field",sourcePath:t,dataType:l})}),l.length}}return r})())(r,l);if(e.length>0){const a=_(P({},r),{fieldMappings:e,outputFormat:"table",discoverSchema:!1});return t(a),o(!0),void alert(`✅ Used fallback analysis and discovered ${e.length} fields! The backend schema discovery had issues, but we successfully analyzed your raw data directly. Check the Advanced Field Mapping section below.`)}}catch(e){console.error("Fallback analysis also failed:",e)}alert("⚠️ No fields could be discovered from the schema response. The data structure might be too complex or there was an issue with field analysis. Try running a normal query first to verify your table access.")}}else c.error?(console.error("Response error:",c.error),alert(`❌ Schema discovery failed with error: ${c.error.message||"Unknown error"}`)):alert("⚠️ Schema discovery returned no data frames. This could indicate:\n• Table name is incorrect\n• Table has no data\n• Connection/permission issues\n• Backend processing error\n\nTry running a normal query first to verify your table works.")}catch(e){console.error("Schema discovery failed:",e),alert("❌ Schema discovery failed. Please check your table name, connection settings, and ensure the table contains data.")}finally{c(!1)}}else alert("Please provide either a PartiQL statement or a table name before discovering the schema.")})(),C=()=>K(function*(){if("partiql"===h){if(!e.partiql||!e.partiql.trim())return void alert("Please enter a PartiQL query first")}else if(!e.table)return void alert("Please enter a table name first");d(!0);try{const l=_(P({},e),{limit:Math.min(e.limit||1,1e6),discoverSchema:!1});t(l),setTimeout(a,100)}catch(e){console.error("Test query failed:",e)}finally{setTimeout(()=>d(!1),2e3)}})(),k=(a,l,r)=>{const n=[...e.fieldMappings||[]];n[a]=_(P({},n[a]),{[l]:r}),t(_(P({},e),{fieldMappings:n}))},{partiql:R,table:j,partitionKeyName:V,partitionKeyValue:q,partitionKeyMode:L,partitionKeyValues:A,sortKeyName:z,sortKeyValue:B,sortKeyOperator:W,sortKeyRangeStart:Q,sortKeyRangeEnd:U,sortKeyValues:G,sortDirection:H,limit:J,outputFormat:Y,fieldMappings:X}=e,Z=null!=L?L:"single",ee=null!=W?W:"eq",te=null!=H?H:"asc",ae=[{label:"Auto-detect",value:"auto"},{label:"Table View",value:"table"},{label:"Geomap",value:"geomap"},{label:"Time Series",value:"timeseries"}],le=[{label:"Equals (=)",value:"eq"},{label:"IN (multiple values)",value:"in"},{label:"Begins with",value:"begins_with"},{label:"Between",value:"between"},{label:">=",value:"gte"},{label:">",value:"gt"},{label:"<=",value:"lte"},{label:"<",value:"lt"}],re=[{label:"String",value:"string"},{label:"Number",value:"number"},{label:"Boolean",value:"boolean"},{label:"Time",value:"time"},{label:"JSON",value:"json"}];var ne;return S().createElement("div",{className:n.container},S().createElement("div",{className:n.querySection},S().createElement(w.RadioButtonGroup,{options:[{label:"PartiQL Query",value:"partiql"},{label:"Key Query",value:"key"}],value:h,onChange:a=>{var l;"partiql"===a?t(_(P({},e),{queryMode:"partiql",partiql:null!==(l=e.partiql)&&void 0!==l?l:'SELECT * FROM "YourTableName"'})):t(_(P({},e),{queryMode:"key",partiql:void 0}))}})),S().createElement("div",{className:n.querySection},"partiql"===h?S().createElement("div",null,S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"PartiQL Query"),S().createElement(w.Input,{placeholder:'SELECT * FROM "YourTableName"',value:null!=R?R:"",onChange:x("partiql"),onBlur:a}),(()=>{const t=(t=>{const a=[];if(!t)return{isValid:!0,warnings:[]};if("partiql"===h){const e=l.validatePartiQLQuery?l.validatePartiQLQuery(t):{isValid:!0};e.isValid||a.push(`❌ PartiQL Syntax Error: ${e.error}`)}t.includes("$__timeFilter")&&!e.timeFilterEnabled&&a.push('⚠️ $__timeFilter requires "Enable Time Filtering" to be turned ON. Please enable it below.');const r=(t.match(/\$[\w_]+|\$\{[\w_]+\}/g)||[]).map(e=>e.startsWith("${")?e.slice(2,-1):e.slice(1)),n=["__from","__to","__timeFilter","__interval","__interval_ms","__rate_interval","__range"],i=y.map(e=>e.replace("$",""));for(const e of r)n.includes(e)||i.includes(e)||a.push(`Variable '$${e}' is not defined in dashboard variables`);return{isValid:0===a.length,warnings:a}})(R||"");return t.warnings.length>0?S().createElement("div",{style:{marginTop:r.spacing(1)}},t.warnings.map((e,t)=>S().createElement(w.Alert,{key:t,severity:"warning",title:"Template Variable Warning"},e))):null})()),S().createElement("div",{style:{marginTop:r.spacing(1)}},S().createElement(w.Button,{variant:"secondary",size:"sm",icon:b?"angle-down":"angle-right",fill:"text",onClick:()=>f(!b)},"Template Variables (",y.length," available)")),b&&S().createElement("div",{className:n.advancedSection},S().createElement("h4",{style:{margin:0,marginBottom:r.spacing(1)}},"Template Variable Usage"),y.length>0&&S().createElement("div",{style:{marginBottom:r.spacing(2)}},S().createElement("label",{className:n.fieldLabel},"Available Variables:"),S().createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:r.spacing(.5),marginTop:r.spacing(.5)}},y.map(e=>S().createElement("code",{key:e,style:{background:r.colors.background.secondary,padding:"2px 6px",borderRadius:r.shape.borderRadius(),fontSize:r.typography.bodySmall.fontSize,border:`1px solid ${r.colors.border.weak}`}},e)))),S().createElement("div",{className:n.infoText},S().createElement("strong",null,"PartiQL Template Variable Examples:"),S().createElement("br",null),"• ",S().createElement("code",null,'SELECT * FROM "$table_name" WHERE status = "$status"'),S().createElement("br",null),"• ",S().createElement("code",null,'SELECT * FROM "users" WHERE region IN ($regions)'),S().createElement("br",null),"• ",S().createElement("code",null,'SELECT * FROM "logs" WHERE $__timeFilter'),S().createElement("br",null),"• ",S().createElement("code",null,'SELECT * FROM "events" WHERE userId = "',"${user_id}",'" AND $__timeFilter'),S().createElement("br",null),"• ",S().createElement("code",null,'SELECT * FROM "logs" WHERE timestamp BETWEEN $__from AND $__to'),S().createElement("br",null),S().createElement("br",null),S().createElement("strong",null,"Variable Syntax:"),S().createElement("br",null),"• ",S().createElement("code",null,"$variable")," - Simple variable substitution",S().createElement("br",null),"• ",S().createElement("code",null,"${variable}")," - Variable in middle of expression",S().createElement("br",null),"• ",S().createElement("code",null,"$__timeFilter")," - Automatic time range filtering (when enabled)",S().createElement("br",null),"• ",S().createElement("code",null,"$__from"),", ",S().createElement("code",null,"$__to")," - Built-in time range variables",S().createElement("br",null),"• Multi-value variables automatically format as comma-separated quoted values",S().createElement("br",null),S().createElement("br",null),S().createElement("strong",null,"⚠️ Important:")," Don't use ",S().createElement("code",null,"LIMIT"),' in PartiQL queries. Use the "Limit" field below instead.')),S().createElement("div",{className:`${n.formRow} ${n.mobileStack}`,style:{marginTop:r.spacing(2)}},S().createElement("div",{className:n.smallFieldContainer},S().createElement("label",{className:n.fieldLabel},"Limit"),S().createElement(w.Input,{type:"number",placeholder:"100",value:J||100,onChange:$})),S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Output Format"),S().createElement(w.Select,{value:ae.find(e=>e.value===Y),options:ae,onChange:T}))),S().createElement("div",{className:`${n.formRow} ${n.mobileStack}`,style:{marginTop:r.spacing(2)}},S().createElement(w.InlineField,{label:"Enable Time Filtering",labelWidth:20},S().createElement(w.InlineSwitch,{value:e.timeFilterEnabled||!1,onChange:a=>{const l=a.currentTarget.checked;t(_(P({},e),{timeFilterEnabled:l,timestampField:l?e.timestampField||"timestamp":void 0,timeFrom:l?e.timeFrom:void 0,timeTo:l?e.timeTo:void 0}))}}))),e.timeFilterEnabled&&S().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Timestamp Field Name"),S().createElement(w.Input,{placeholder:"timestamp",value:e.timestampField||"timestamp",onChange:a=>{t(_(P({},e),{timestampField:a.target.value}))}}))),S().createElement("div",{className:n.buttonGroup},S().createElement(w.Button,{className:n.testQueryButton,variant:"primary",size:"sm",icon:"play",disabled:m,onClick:C},m?"Testing...":"Test Query"),S().createElement(w.Button,{variant:"secondary",size:"sm",icon:"search",onClick:O,disabled:s},s?"Discovering Fields...":"Discover Schema"))):S().createElement("div",null,S().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Table Name"),S().createElement(w.Input,{placeholder:"YourTableName or $table_name",value:j||"",onChange:x("table")}),y.length>0&&S().createElement("div",{className:n.infoText,style:{marginTop:r.spacing(.5)}},"💡 Use template variables: ",y.slice(0,3).join(", "),y.length>3&&` and ${y.length-3} more`)),S().createElement("div",{style:{alignSelf:"flex-end"}},S().createElement(w.Button,{variant:"secondary",size:"sm",icon:"search",disabled:s,onClick:()=>K(function*(){if(e.table){c(!0);try{const l=_(P({},e),{discoverSchema:!0,fieldMappings:void 0,outputFormat:"auto",limit:e.limit||100});t(l),a(),alert("🔍 Discovering schema... The system is analyzing your table structure to understand the data format.")}catch(e){console.error("Schema discovery failed:",e),alert("Schema discovery failed. Please check your table name and connection settings.")}finally{setTimeout(()=>c(!1),500)}}else alert("Please enter a table name first")})()},s?"Discovering...":"Discover Schema"))),S().createElement("div",{className:`${n.keyValueRow} ${n.mobileStack}`},S().createElement("div",{className:n.smallFieldContainer},S().createElement("label",{className:n.fieldLabel},"Partition Key"),S().createElement(w.Input,{placeholder:"id",value:V||"",onChange:x("partitionKeyName")})),S().createElement("span",{className:n.equalSign},"="),S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Partition Key Value"),S().createElement(w.Input,{placeholder:"0009 or $user_id (or empty for all)",value:q||"",onChange:x("partitionKeyValue"),disabled:"in"===Z}))),S().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},S().createElement(w.InlineField,{label:"Partition Key Mode",labelWidth:20},S().createElement(w.RadioButtonGroup,{value:Z,onChange:a=>(a=>{if("in"===a){var l;const r=null!==(l=A&&A.length>0?A:q?[q]:[])&&void 0!==l?l:[];t(_(P({},e),{partitionKeyMode:a,partitionKeyValues:r}))}else{var r;t(_(P({},e),{partitionKeyMode:a,partitionKeyValue:null!==(r=null!=q?q:null==A?void 0:A[0])&&void 0!==r?r:""}))}})(a),options:[{label:"Single value",value:"single"},{label:"Multiple values (IN)",value:"in"}]}))),"in"===Z&&S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Partition Key Values (IN)"),S().createElement(w.TextArea,{rows:3,placeholder:"value1 value2 ${variable}",value:(A&&A.length>0?A:q?[q]:[]).join("\n"),onChange:a=>{var l;const r=(null!==(l=a.target.value)&&void 0!==l?l:"").split(/[\n,]/).map(e=>e.trim()).filter(e=>e.length>0);t(_(P({},e),{partitionKeyValues:r}))}}),S().createElement("div",{className:n.infoText},"Provide one value per line. Template variables are supported and will be expanded before querying DynamoDB.")),S().createElement("div",{className:`${n.keyValueRow} ${n.mobileStack}`},S().createElement("div",{className:n.smallFieldContainer},S().createElement("label",{className:n.fieldLabel},"Sort Key"),S().createElement(w.Input,{placeholder:"Timestamp (optional)",value:z||"",onChange:x("sortKeyName")})),S().createElement("div",{className:n.smallFieldContainer},S().createElement("label",{className:n.fieldLabel},"Operator"),S().createElement(w.Select,{options:le,value:null!==(ne=le.find(e=>e.value===ee))&&void 0!==ne?ne:le[0],onChange:a=>{var l;const r=null!==(l=a.value)&&void 0!==l?l:"eq",n=_(P({},e),{sortKeyOperator:r});var i;if("between"===r)n.sortKeyRangeStart=null!==(i=null!=Q?Q:B)&&void 0!==i?i:"",n.sortKeyRangeEnd=null!=U?U:"",n.sortKeyValues=void 0;else if("in"===r){const t=e.sortKeyValues&&e.sortKeyValues.length>0?e.sortKeyValues:e.sortKeyValue?[e.sortKeyValue]:[];n.sortKeyValues=t,n.sortKeyRangeStart=void 0,n.sortKeyRangeEnd=void 0}else n.sortKeyRangeStart=void 0,n.sortKeyRangeEnd=void 0,n.sortKeyValues=void 0;t(n)},placeholder:"Select operator",menuShouldPortal:!0})),"between"===ee?S().createElement(S().Fragment,null,S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Range start"),S().createElement(w.Input,{placeholder:"From value",value:null!=Q?Q:"",onChange:x("sortKeyRangeStart")})),S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Range end"),S().createElement(w.Input,{placeholder:"To value",value:null!=U?U:"",onChange:x("sortKeyRangeEnd")}))):"in"===ee?S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Sort Key Values (IN)"),S().createElement(w.TextArea,{rows:3,placeholder:"value1 value2 value3",value:(G&&G.length>0?G:B?[B]:[]).join("\n"),onChange:a=>{var l;const r=(null!==(l=a.target.value)&&void 0!==l?l:"").split(/[\n,]/).map(e=>e.trim()).filter(e=>e.length>0);t(_(P({},e),{sortKeyValues:r}))}}),S().createElement("div",{className:n.infoText},"Provide one value per line. Template variables are supported.")):S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Sort Key Value"),S().createElement(w.Input,{placeholder:"1753765220, $timestamp, or use time filtering below",value:B||"",onChange:x("sortKeyValue"),disabled:"in"===ee}))),S().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},S().createElement(w.InlineField,{label:"Sort Direction",labelWidth:20},S().createElement(w.RadioButtonGroup,{value:te,onChange:a=>(a=>{t(_(P({},e),{sortDirection:a}))})(a),options:[{label:"Ascending",value:"asc"},{label:"Descending",value:"desc"}]}))),S().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},S().createElement("div",{style:{marginBottom:r.spacing(1),fontSize:r.typography.bodySmall.fontSize,color:r.colors.text.secondary}},"💡 Time filtering automatically applies a WHERE condition to filter results by timestamp field"),S().createElement(w.InlineField,{label:"Enable Time Filtering",labelWidth:20},S().createElement(w.InlineSwitch,{value:e.timeFilterEnabled||!1,onChange:a=>{const l=a.currentTarget.checked;t(_(P({},e),{timeFilterEnabled:l,timestampField:l?e.timestampField||"timestamp":void 0,timeFrom:l?e.timeFrom:void 0,timeTo:l?e.timeTo:void 0}))}}))),e.timeFilterEnabled&&S().createElement(S().Fragment,null,S().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Timestamp Field Name"),S().createElement(w.Input,{placeholder:"timestamp",value:e.timestampField||"timestamp",onChange:a=>{t(_(P({},e),{timestampField:a.target.value||"timestamp"}))}}))),S().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"From Date/Time"),S().createElement(w.DateTimePicker,{date:e.timeFrom?(0,p.dateTime)(e.timeFrom):(0,p.dateTime)().subtract(24,"hours"),onChange:a=>{a&&t(_(P({},e),{timeFrom:a.toISOString()}))}})),S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"To Date/Time"),S().createElement(w.DateTimePicker,{date:e.timeTo?(0,p.dateTime)(e.timeTo):(0,p.dateTime)(),onChange:a=>{a&&t(_(P({},e),{timeTo:a.toISOString()}))}})))),S().createElement("div",{className:`${n.formRow} ${n.mobileStack}`},S().createElement("div",{className:n.smallFieldContainer},S().createElement("label",{className:n.fieldLabel},"Limit"),S().createElement(w.Input,{type:"number",placeholder:"100",value:J||100,onChange:$})),S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Output Format"),S().createElement(w.Select,{value:ae.find(e=>e.value===Y),options:ae,onChange:T}))),S().createElement("div",{className:n.buttonGroup},S().createElement(w.Button,{className:n.testQueryButton,variant:"primary",size:"md",icon:"play",disabled:m,onClick:C},m?"Executing Query...":"Run Query"),S().createElement(w.Button,{variant:"secondary",size:"md",icon:"search",onClick:O,disabled:s},s?"Discovering Fields...":"Discover Schema")))),S().createElement("div",null,S().createElement(w.Button,{variant:"secondary",size:"sm",icon:i?"angle-down":"angle-right",fill:"outline",onClick:()=>o(!i)},"Advanced Field Mapping (",(X||[]).length," fields)")),i&&S().createElement("div",{className:n.advancedSection},S().createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}},S().createElement("h4",{style:{margin:0}},"Field Mappings"),S().createElement("div",{style:{display:"flex",gap:"8px"}},S().createElement(w.Button,{variant:"secondary",size:"sm",icon:"plus",onClick:()=>{const a=[...e.fieldMappings||[],{fieldName:"",sourcePath:"",dataType:"string"}];t(_(P({},e),{fieldMappings:a}))}},"Add Field"),S().createElement(w.Button,{variant:"primary",size:"sm",icon:"check",onClick:()=>K(function*(){if((e.fieldMappings||[]).filter(e=>!e.fieldName.trim()||!e.sourcePath.trim()).length>0)alert("Please fill in all field names and source paths before applying mappings.");else try{d(!0);const l=_(P({},e),{limit:Math.min(e.limit||25,100),discoverSchema:!1});t(l),setTimeout(()=>{a(),g(!0),setTimeout(()=>{g(!1)},3e3)},100)}catch(e){console.error("Failed to apply field mappings:",e),alert("Failed to apply field mappings. Please check your configuration.")}finally{setTimeout(()=>d(!1),2e3)}})(),disabled:0===(X||[]).length},"Apply Mappings"))),u&&S().createElement("div",{className:n.successMessage},"✅ Field mappings applied successfully! Check the results below."),(X||[]).map((a,l)=>S().createElement("div",{key:l,className:n.fieldMappingCard},S().createElement("div",{className:n.responsiveGrid},S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Field Name"),S().createElement(w.Input,{value:a.fieldName,onChange:e=>k(l,"fieldName",e.target.value),placeholder:"Display name (e.g., 'User ID')"})),S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Source Path"),S().createElement(w.Input,{value:a.sourcePath,onChange:e=>k(l,"sourcePath",e.target.value),placeholder:"Data path (e.g., 'user.id', 'items[0].name')"})),S().createElement("div",{className:n.smallFieldContainer},S().createElement("label",{className:n.fieldLabel},"Data Type"),S().createElement(w.Select,{value:re.find(e=>e.value===a.dataType),options:re,onChange:e=>k(l,"dataType",e.value||"string")})),S().createElement("div",{className:n.fieldContainer},S().createElement("label",{className:n.fieldLabel},"Transform"),S().createElement(w.Input,{value:a.transformation||"",onChange:e=>k(l,"transformation",e.target.value),placeholder:"parseFloat, timestamp"})),S().createElement("div",{style:{display:"flex",alignItems:"flex-end",marginTop:"20px"}},S().createElement(w.Button,{variant:"destructive",size:"sm",icon:"trash-alt",onClick:()=>(a=>{const l=(e.fieldMappings||[]).filter((e,t)=>t!==a);t(_(P({},e),{fieldMappings:l}))})(l)}))))),0===(X||[]).length&&S().createElement(w.Alert,{severity:"info",title:"No field mappings configured"},S().createElement("strong",null,"Quick Start:"),S().createElement("br",null),"1. Click ",S().createElement("strong",null,'"Discover Schema"')," above to automatically analyze your table",S().createElement("br",null),"2. Or manually add field mappings using the ",S().createElement("strong",null,'"Add Field"')," button",S().createElement("br",null),"3. Click ",S().createElement("strong",null,'"Apply Mappings"')," to test your configuration",S().createElement("br",null),S().createElement("br",null),S().createElement("strong",null,"Field Mapping Examples:"),S().createElement("br",null),'• Field Name: "User ID" → Source Path: "userId" → Type: "string"',S().createElement("br",null),'• Field Name: "Location" → Source Path: "geo.coordinates" → Type: "json"',S().createElement("br",null),'• Field Name: "Score" → Source Path: "metrics.score" → Type: "number"')))});return m})());
//# sourceMappingURL=module.js.map
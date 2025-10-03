/* [create-plugin] version: 5.25.7 */
define(["@grafana/ui","@emotion/css","rxjs","module","@grafana/runtime","@grafana/data","react"],(e,t,a,r,i,l,n)=>(()=>{"use strict";var o={7:t=>{t.exports=e},89:e=>{e.exports=t},269:e=>{e.exports=a},308:e=>{e.exports=r},531:e=>{e.exports=i},781:e=>{e.exports=l},959:e=>{e.exports=n}},s={};function c(e){var t=s[e];if(void 0!==t)return t.exports;var a=s[e]={exports:{}};return o[e](a,a.exports,c),a.exports}c.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return c.d(t,{a:t}),t},c.d=(e,t)=>{for(var a in t)c.o(t,a)&&!c.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},c.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),c.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},c.p="public/plugins/fluvio-dynamodb-datasource/";var m={};c.r(m),c.d(m,{plugin:()=>V});var d=c(308),u=c.n(d);c.p=u()&&u().uri?u().uri.slice(0,u().uri.lastIndexOf("/")+1):"public/plugins/fluvio-dynamodb-datasource/";var p=c(781),g=c(531);const b={limit:100,outputFormat:"auto",fieldMappings:[],discoverSchema:!1,timeFilterEnabled:!1,timestampField:"timestamp",queryMode:"key"};function f(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function y(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{},r=Object.keys(a);"function"==typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(a).filter(function(e){return Object.getOwnPropertyDescriptor(a,e).enumerable}))),r.forEach(function(t){f(e,t,a[t])})}return e}function h(e,t){return t=null!=t?t:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):function(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),a.push.apply(a,r)}return a}(Object(t)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(t,a))}),e}const v=()=>"localhost"===window.location.hostname||"127.0.0.1"===window.location.hostname||"3000"===window.location.port,E=(e,...t)=>{v()},$=(e,...t)=>{v()&&console.warn(`⚠️ [FLUVIO-DEV] ${e}`,...t)};class S extends g.DataSourceWithBackend{getDefaultQuery(e){return b}filterQuery(e){return!!e.partiql||!!e.table}applyTemplateVariables(e,t,a){E(0,Date.now()),E(0),E(0),E(0);const r=this.buildVariablesContext(t,e,a);E(0);const i=this.interpolateQueryFields(e,r);return E(0),i}buildVariablesContext(e,t,a){const{fromUnix:r,toUnix:i,fromIso:l,toIso:n}=this.resolveTimeRange(e,t),o=y({},e);o.__from={value:r.toString(),text:r.toString()},o.__to={value:i.toString(),text:i.toString()},o.__fromIso={value:l,text:l},o.__toIso={value:n,text:n};const s=i-r,c=Math.max(1,Math.floor(s/1e3));o.__interval={value:`${c}s`,text:`${c}s`},o.__interval_ms={value:(1e3*c).toString(),text:(1e3*c).toString()};const m=this.interpolateString(t.timestampField||"timestamp",o),d=this.formatPartiqlIdentifier(m);if(t.timeFilterEnabled){const e=[`${d} BETWEEN ${r} AND ${i}`,`${d} BETWEEN '${l}' AND '${n}'`,`CAST(${d} AS NUMBER) BETWEEN ${r} AND ${i}`][0];o.__timeFilter={value:e,text:e},o.__timeFilterIso={value:`${d} BETWEEN '${l}' AND '${n}'`,text:`${d} BETWEEN '${l}' AND '${n}'`},o.__timeFilterMs={value:`${d} BETWEEN ${1e3*r} AND ${1e3*i}`,text:`${d} BETWEEN ${1e3*r} AND ${1e3*i}`},E(0)}else o.__timeFilter={value:"1=1",text:"1=1"},o.__timeFilterIso={value:"1=1",text:"1=1"},o.__timeFilterMs={value:"1=1",text:"1=1"},E();if(a&&a.length>0){const e=a.map(e=>`${this.formatPartiqlIdentifier(e.key)} ${this.mapFilterOperator(e.operator)} ${this.formatFilterValue(e.value,e.operator)}`).join(" AND ");o.__adhocFilters={value:e,text:e},E(0)}else o.__adhocFilters={value:"1=1",text:"1=1"};return o}interpolateQueryFields(e,t){var a,r,i;return h(y({},e),{timeFrom:(null===(a=t.__fromIso)||void 0===a?void 0:a.value)||e.timeFrom,timeTo:(null===(r=t.__toIso)||void 0===r?void 0:r.value)||e.timeTo,partiql:e.partiql?this.interpolatePartiQLQuery(e.partiql,t):e.partiql,table:this.interpolateString(e.table,t),partitionKeyName:this.interpolateString(e.partitionKeyName,t),partitionKeyValue:this.interpolateString(e.partitionKeyValue,t),sortKeyName:this.interpolateString(e.sortKeyName,t),sortKeyValue:this.interpolateString(e.sortKeyValue,t),timestampField:this.interpolateString(e.timestampField,t),fieldMappings:(null===(i=e.fieldMappings)||void 0===i?void 0:i.map(e=>h(y({},e),{sourcePath:this.interpolateString(e.sourcePath,t)||e.sourcePath,fieldName:this.interpolateString(e.fieldName,t)||e.fieldName})))||e.fieldMappings})}interpolatePartiQLQuery(e,t){let a=this.templateSrv.replace(e,t,(e,t)=>{if(Array.isArray(e)&&t&&"object"==typeof t&&t.multi){return`(${e.map(e=>"number"==typeof e||/^\d+$/.test(e)?e.toString():`'${e.toString().replace(/'/g,"''")}'`).join(", ")})`}return"string"!=typeof e||e.includes("'")||/^\d+$/.test(e)?e:`'${e}'`});return E(0,Object.keys(t)),a}interpolateString(e,t){if(!e)return e;try{return this.templateSrv.replace(e,t)}catch(a){return((e,...t)=>{v()&&console.error(`❌ [FLUVIO-DEV] ${e}`,...t)})("Error interpolating string:",a,{value:e,variables:Object.keys(t)}),e}}resolveTimeRange(e,t){var a,r;const i=Date.now(),l=i-864e5,n=i;let o,s;void 0!==(null===(a=e.__from)||void 0===a?void 0:a.value)&&(o=this.coerceToMillis(e.__from.value)),void 0!==(null===(r=e.__to)||void 0===r?void 0:r.value)&&(s=this.coerceToMillis(e.__to.value)),!o&&t.timeFrom&&(o=this.coerceToMillis(t.timeFrom)),!s&&t.timeTo&&(s=this.coerceToMillis(t.timeTo)),o=null!=o?o:l,s=null!=s?s:n;const c=Math.min(o,s),m=Math.max(o,s);return{fromUnix:Math.floor(c/1e3),toUnix:Math.floor(m/1e3),fromIso:new Date(c).toISOString(),toIso:new Date(m).toISOString()}}coerceToMillis(e){if(null!=e){if("number"==typeof e){if(!Number.isFinite(e))return;return this.normalizeEpoch(e)}if("string"==typeof e){const t=e.trim();if(""===t)return;const a=Number(t);if(!Number.isNaN(a))return this.normalizeEpoch(a);const r=Date.parse(t);return Number.isNaN(r)?void 0:r}if(e instanceof Date){const t=e.getTime();return Number.isFinite(t)?t:void 0}if("function"==typeof e.toMillis){const t=e.toMillis();if(Number.isFinite(t))return t}if("function"==typeof e.valueOf){const t=e.valueOf();if("number"==typeof t&&Number.isFinite(t))return this.normalizeEpoch(t)}if("function"==typeof e.toISOString){const t=e.toISOString(),a=Date.parse(t);if(!Number.isNaN(a))return a}}}normalizeEpoch(e){return e<1e11?1e3*e:e}formatPartiqlIdentifier(e){if(!e)return'"timestamp"';const t=e.trim();return""===t?'"timestamp"':/["'\s()\[\]]/.test(t)?t:t.split(".").map(e=>`"${e.replace(/"/g,'""')}"`).join(".")}mapFilterOperator(e){return{"=":"=","!=":"<>",">":">","<":"<",">=":">=","<=":"<=","=~":"LIKE","!~":"NOT LIKE",in:"IN","not in":"NOT IN"}[e]||"="}formatFilterValue(e,t){if("in"===t||"not in"===t){if(e.startsWith("(")&&e.endsWith(")"))return e;return`(${e.split(",").map(e=>`'${e.trim().replace(/'/g,"''")}'`).join(", ")})`}if("=~"===t||"!~"===t){return`'${(e.includes("%")?e:`%${e}%`).replace(/'/g,"''")}'`}return/^\d+(\.\d+)?$/.test(e)?e:`'${e.replace(/'/g,"''")}'`}getVariables(){return["$__timeFilter","$__timeFilterIso","$__timeFilterMs","$__from","$__to","$__fromIso","$__toIso","$__interval","$__interval_ms","$__adhocFilters","$__dashboard","$__user","$__org",...this.templateSrv.getVariables().map(e=>`$${e.name}`)]}getVariablesSuggestions(){return[{label:"$__timeFilter",detail:"Automatic time range filter for timestamp field",insertText:"$__timeFilter"},{label:"$__timeFilterIso",detail:"Time range filter using ISO date strings",insertText:"$__timeFilterIso"},{label:"$__from",detail:"Start time as Unix timestamp",insertText:"$__from"},{label:"$__to",detail:"End time as Unix timestamp",insertText:"$__to"},{label:"$__fromIso",detail:"Start time as ISO string",insertText:"$__fromIso"},{label:"$__toIso",detail:"End time as ISO string",insertText:"$__toIso"},{label:"$__interval",detail:'Auto-calculated time interval (e.g., "5m")',insertText:"$__interval"},{label:"$__adhocFilters",detail:"Additional filter conditions from dashboard",insertText:"$__adhocFilters"},...this.templateSrv.getVariables().map(e=>({label:`$${e.name}`,detail:`Custom variable: ${e.type} (${e.multi?"multi-value":"single-value"})`,insertText:`$${e.name}`}))]}validateTemplateVariables(e){const t=[],a=/\$(\w+)|\$\{([^}]+)\}/g,r=new Set(this.getVariables().map(e=>e.substring(1)));let i;for(;null!==(i=a.exec(e));){const e=i[1]||i[2];r.has(e)||t.push({variable:`$${e}`,error:`Variable not found. Available variables: ${Array.from(r).join(", ")}`})}return t}constructor(e){var t;(super(e),f(this,"instanceSettings",void 0),f(this,"templateSrv",void 0),this.instanceSettings=e,this.templateSrv=(0,g.getTemplateSrv)(),v())&&(E(0),E(0,e.url),E(0,e.id),e.url||$("Plugin URL not configured in instance settings"),(null===(t=e.jsonData)||void 0===t?void 0:t.region)||$("AWS region not configured in plugin settings"))}}var x=c(959),w=c.n(x),_=c(7),N=c(89);function T(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function F(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{},r=Object.keys(a);"function"==typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(a).filter(function(e){return Object.getOwnPropertyDescriptor(a,e).enumerable}))),r.forEach(function(t){T(e,t,a[t])})}return e}function O(e,t){return t=null!=t?t:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):function(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),a.push.apply(a,r)}return a}(Object(t)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(t,a))}),e}const k=[{label:"US East (N. Virginia) - us-east-1",value:"us-east-1"},{label:"US East (Ohio) - us-east-2",value:"us-east-2"},{label:"US West (N. California) - us-west-1",value:"us-west-1"},{label:"US West (Oregon) - us-west-2",value:"us-west-2"},{label:"Asia Pacific (Sydney) - ap-southeast-2",value:"ap-southeast-2"},{label:"Asia Pacific (Singapore) - ap-southeast-1",value:"ap-southeast-1"},{label:"Asia Pacific (Tokyo) - ap-northeast-1",value:"ap-northeast-1"},{label:"Asia Pacific (Seoul) - ap-northeast-2",value:"ap-northeast-2"},{label:"Asia Pacific (Mumbai) - ap-south-1",value:"ap-south-1"},{label:"Europe (Ireland) - eu-west-1",value:"eu-west-1"},{label:"Europe (London) - eu-west-2",value:"eu-west-2"},{label:"Europe (Frankfurt) - eu-central-1",value:"eu-central-1"},{label:"Europe (Stockholm) - eu-north-1",value:"eu-north-1"},{label:"Canada (Central) - ca-central-1",value:"ca-central-1"},{label:"South America (São Paulo) - sa-east-1",value:"sa-east-1"}];var C=c(269);function P(e,t,a,r,i,l,n){try{var o=e[l](n),s=o.value}catch(e){return void a(e)}o.done?t(s):Promise.resolve(s).then(r,i)}function I(e){return function(){var t=this,a=arguments;return new Promise(function(r,i){var l=e.apply(t,a);function n(e){P(l,r,i,n,o,"next",e)}function o(e){P(l,r,i,n,o,"throw",e)}n(void 0)})}}function D(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function M(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{},r=Object.keys(a);"function"==typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(a).filter(function(e){return Object.getOwnPropertyDescriptor(a,e).enumerable}))),r.forEach(function(t){D(e,t,a[t])})}return e}function j(e,t){return t=null!=t?t:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):function(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),a.push.apply(a,r)}return a}(Object(t)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(t,a))}),e}const A=(e,t)=>{const a=[],r=(e,t)=>{if(null!=e)if("object"!=typeof e||Array.isArray(e)){if(Array.isArray(e)&&e.length>0){const a=`${t}[0]`;r(e[0],a)}}else Object.keys(e).forEach(i=>{const l=t?`${t}.${i}`:i;a.push({path:l,type:R(e[i])}),"object"!=typeof e[i]||null===e[i]||Array.isArray(e[i])||r(e[i],l)})};return r(e,t),a},L=(e,t)=>{const a=t.split(".");let r=e;for(const e of a){if(e.includes("[")){var i;const[t,a]=e.split("["),l=parseInt(a.replace("]",""),10);r=null==r||null===(i=r[t])||void 0===i?void 0:i[l]}else r=null==r?void 0:r[e];if(null==r)return}return r},R=e=>null==e?"string":"boolean"==typeof e?"boolean":"number"==typeof e?"number":"string"==typeof e?/^\d{10}$/.test(e)||/^\d{13}$/.test(e)||/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(e)?"time":"string":"object"==typeof e&&null!==e?"json":"string";const V=new p.DataSourcePlugin(S).setConfigEditor(function({options:e,onOptionsChange:t}){const a=(e=>({container:N.css`
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
  `}))((0,_.useTheme2)()),{jsonData:r,secureJsonFields:i,secureJsonData:l}=e,n=a=>r=>{t(O(F({},e),{secureJsonData:O(F({},l),{[a]:r.target.value})}))},o=a=>()=>{t(O(F({},e),{secureJsonFields:O(F({},i),{[a]:!1}),secureJsonData:O(F({},l),{[a]:""})}))},s=(null==r?void 0:r.region)&&(null==i?void 0:i.accessKey)&&(null==i?void 0:i.secretKey);return w().createElement("div",{className:a.container},!s&&w().createElement("div",{className:a.alertSection},w().createElement(_.Alert,{severity:"info",title:"Configuration Required"},"Configure your AWS region and permanent IAM credentials to connect to DynamoDB. Use long-term access keys for reliable access.",w().createElement("div",{style:{marginTop:"8px"}},w().createElement(_.Button,{variant:"secondary",size:"sm",onClick:()=>{t(O(F({},e),{jsonData:O(F({},r),{region:"ap-southeast-2"})}))}},"Use Example Region (ap-southeast-2)")))),w().createElement("div",{className:a.configSection},w().createElement("div",{className:a.sectionHeader},"🌍 AWS Configuration"),w().createElement("div",{className:a.formRow},w().createElement("div",{className:a.fieldContainer},w().createElement("label",{className:a.fieldLabel,title:"Select the AWS region where your DynamoDB tables are located"},"AWS Region"),w().createElement(_.Select,{placeholder:"Select AWS region",value:k.find(e=>e.value===(null==r?void 0:r.region)),options:k,onChange:a=>{t(O(F({},e),{jsonData:O(F({},r),{region:a.value||""})}))}}))),w().createElement("div",{className:a.formRow},w().createElement("div",{className:a.fieldContainer},w().createElement("label",{className:a.fieldLabel,title:"Optional: Custom DynamoDB endpoint URL for local development or VPC endpoints"},"Custom Endpoint"),w().createElement(_.Input,{placeholder:"https://dynamodb.ap-southeast-2.amazonaws.com (leave empty for default)",value:(null==r?void 0:r.endpoint)||"",onChange:(c="endpoint",a=>{t(O(F({},e),{jsonData:O(F({},r),{[c]:a.target.value})}))})})))),w().createElement("div",{className:a.configSection},w().createElement("div",{className:a.sectionHeader},"🔐 AWS Credentials"),w().createElement("div",{className:a.credentialsInfo},"Use permanent IAM user credentials (Access Key ID starting with AKIA*). This plugin is optimized for long-term credentials that don't expire. All credentials are stored securely and never visible in plain text."),w().createElement("div",{className:a.formRow},w().createElement("div",{className:a.fieldContainer},w().createElement("label",{className:a.fieldLabel},"Access Key ID"),w().createElement(_.SecretInput,{isConfigured:null==i?void 0:i.accessKey,value:(null==l?void 0:l.accessKey)||"",placeholder:"AKIA**************** (permanent access key)",onChange:n("accessKey"),onReset:o("accessKey")}))),w().createElement("div",{className:a.formRow},w().createElement("div",{className:a.fieldContainer},w().createElement("label",{className:a.fieldLabel},"Secret Access Key"),w().createElement(_.SecretInput,{isConfigured:null==i?void 0:i.secretKey,value:(null==l?void 0:l.secretKey)||"",placeholder:"Your AWS secret access key",onChange:n("secretKey"),onReset:o("secretKey")})))),w().createElement("div",{className:a.permissionsInfo},"💡 ",w().createElement("strong",null,"IAM Permissions Required:"),w().createElement("br",null),"Your AWS user/role needs these DynamoDB permissions:",w().createElement("br",null),"• ",w().createElement("code",null,"dynamodb:Query")," - for key-based queries",w().createElement("br",null),"• ",w().createElement("code",null,"dynamodb:Scan")," - for table scans",w().createElement("br",null),"• ",w().createElement("code",null,"dynamodb:ExecuteStatement")," - for PartiQL queries",w().createElement("br",null),"• ",w().createElement("code",null,"dynamodb:DescribeTable")," - for table metadata",w().createElement("br",null),"• ",w().createElement("code",null,"dynamodb:ListTables")," - for connection testing"));var c}).setQueryEditor(function({query:e,onChange:t,onRunQuery:a,datasource:r}){const i=(0,_.useTheme2)(),l=(e=>({container:N.css`
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
  `}))(i),[n,o]=(0,x.useState)(!1),[s,c]=(0,x.useState)(!1),[m,d]=(0,x.useState)(!1),[u,g]=(0,x.useState)(!1),[b,f]=(0,x.useState)(!1),y=w().useMemo(()=>{try{return r.getVariables?r.getVariables():[]}catch(e){return[]}},[r]),h=w().useMemo(()=>{try{return r.getVariablesSuggestions?r.getVariablesSuggestions():[]}catch(e){return[]}},[r]);var v;const E=null!==(v=e.queryMode)&&void 0!==v?v:void 0!==e.partiql?"partiql":"key";w().useEffect(()=>{e.queryMode||t(j(M({},e),{queryMode:E}))},[e.queryMode,E]);const $=a=>r=>{t(j(M({},e),{[a]:r.target.value}))},S=a=>{t(j(M({},e),{limit:parseInt(a.target.value,10)||100}))},T=a=>{const r=a.value;t(j(M({},e),{outputFormat:r||"auto"}))},F=()=>I(function*(){const a=Boolean(e.partiql&&e.partiql.trim().length>0),i=Boolean(e.table&&e.table.trim().length>0);if(a||i){c(!0);try{var l;const a=j(M({},e),{discoverSchema:!0,limit:e.limit||100,fieldMappings:void 0,refId:"schema_discovery"}),i=M({},e),n={targets:[a],range:{from:(0,p.dateTime)().subtract(1,"hour"),to:(0,p.dateTime)(),raw:{from:"now-1h",to:"now"}},interval:"1s",intervalMs:1e3,maxDataPoints:500,scopedVars:{},timezone:"UTC",app:p.CoreApp.Explore,requestId:"schema_discovery",startTime:Date.now()},s=r.query(n),c=yield(0,C.firstValueFrom)(s);if(null===(l=c.data)||void 0===l||l.length,c.data&&c.data.length>0){const a=c.data[0],l=[];if(a.fields&&a.fields.length>0){const e=a.fields.find(e=>"field_path"===e.name),t=a.fields.find(e=>"data_type"===e.name),r=a.fields.find(e=>"sample_value"===e.name);if(e&&t&&e.values)for(let a=0;a<e.values.length;a++){const i=e.values[a],n=t.values[a];null==r||r.values[a];if(i&&n){const e=i.replace(/\[.*?\]/g,"").replace(/\./g,"_");l.push({fieldName:e||i,sourcePath:i,dataType:n})}}}if(l.length>0){const a=j(M({},i),{fieldMappings:l,outputFormat:"table",discoverSchema:!1});t(a),o(!0),alert(`✅ Successfully discovered ${l.length} fields from ${e.limit||100} records! Check the Advanced Field Mapping section below to customize as needed.`)}else{try{const e=yield((e,t)=>I(function*(){const a={targets:[j(M({},e),{discoverSchema:!1,outputFormat:"auto",limit:e.limit||100})],range:{from:(0,p.dateTime)().subtract(1,"hour"),to:(0,p.dateTime)(),raw:{from:"now-1h",to:"now"}},interval:"1s",intervalMs:1e3,maxDataPoints:500,scopedVars:{},timezone:"UTC",app:p.CoreApp.Explore,requestId:"fallback_analysis",startTime:Date.now()},r=yield(0,C.firstValueFrom)(t.query(a)),i=[];if(r.data&&r.data.length>0){const e=r.data[0].fields.find(e=>"raw_json"===e.name);if(e&&e.values&&e.values.length>0){const t=Math.min(3,e.values.length),a=new Set;for(let r=0;r<t;r++){const t=e.values[r];try{const e=JSON.parse(t);A(e,"").forEach(e=>a.add(e.path))}catch(e){console.error("Failed to parse raw JSON:",e)}}const r=Array.from(a).sort(),l=40;r.slice(0,l).forEach(t=>{const a=t.replace(/\[.*?\]/g,"").replace(/\./g,"_");let r="string";try{const a=JSON.parse(e.values[0]),i=L(a,t);r=R(i)}catch(e){r="string"}i.push({fieldName:a||t.split(".").pop()||"field",sourcePath:t,dataType:r})}),r.length}}return i})())(i,r);if(e.length>0){const a=j(M({},i),{fieldMappings:e,outputFormat:"table",discoverSchema:!1});return t(a),o(!0),void alert(`✅ Used fallback analysis and discovered ${e.length} fields! The backend schema discovery had issues, but we successfully analyzed your raw data directly. Check the Advanced Field Mapping section below.`)}}catch(e){console.error("Fallback analysis also failed:",e)}alert("⚠️ No fields could be discovered from the schema response. The data structure might be too complex or there was an issue with field analysis. Try running a normal query first to verify your table access.")}}else c.errors&&c.errors.length>0?(console.error("Response errors:",c.errors),alert(`❌ Schema discovery failed with error: ${c.errors[0].message||"Unknown error"}`)):alert("⚠️ Schema discovery returned no data frames. This could indicate:\n• Table name is incorrect\n• Table has no data\n• Connection/permission issues\n• Backend processing error\n\nTry running a normal query first to verify your table works.")}catch(e){console.error("Schema discovery failed:",e),alert("❌ Schema discovery failed. Please check your table name, connection settings, and ensure the table contains data.")}finally{c(!1)}}else alert("Please provide either a PartiQL statement or a table name before discovering the schema.")})(),O=()=>I(function*(){if("partiql"===E){if(!e.partiql||!e.partiql.trim())return void alert("Please enter a PartiQL query first")}else if(!e.table)return void alert("Please enter a table name first");d(!0);try{const r=j(M({},e),{limit:Math.min(e.limit||1,1e6),discoverSchema:!1});t(r),setTimeout(a,100)}catch(e){console.error("Test query failed:",e)}finally{setTimeout(()=>d(!1),2e3)}})(),k=(a,r,i)=>{const l=[...e.fieldMappings||[]];l[a]=j(M({},l[a]),{[r]:i}),t(j(M({},e),{fieldMappings:l}))},{partiql:P,table:D,partitionKeyName:V,partitionKeyValue:q,sortKeyName:z,sortKeyValue:B,limit:W,outputFormat:K,fieldMappings:Q}=e,U=[{label:"Auto-detect",value:"auto"},{label:"Table View",value:"table"},{label:"Geomap",value:"geomap"},{label:"Time Series",value:"timeseries"}],H=[{label:"String",value:"string"},{label:"Number",value:"number"},{label:"Boolean",value:"boolean"},{label:"Time",value:"time"},{label:"JSON",value:"json"}];return w().createElement("div",{className:l.container},w().createElement("div",{className:l.querySection},w().createElement(_.RadioButtonGroup,{options:[{label:"PartiQL Query",value:"partiql"},{label:"Key Query",value:"key"}],value:E,onChange:a=>{var r;"partiql"===a?t(j(M({},e),{queryMode:"partiql",partiql:null!==(r=e.partiql)&&void 0!==r?r:'SELECT * FROM "YourTableName"'})):t(j(M({},e),{queryMode:"key",partiql:void 0}))}})),w().createElement("div",{className:l.querySection},"partiql"===E?w().createElement("div",null,w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"PartiQL Query"),w().createElement(_.Input,{placeholder:'SELECT * FROM "YourTableName"',value:null!=P?P:"",onChange:$("partiql"),onBlur:a}),(()=>{const t=(t=>{const a=[],i=[];if(!t)return{isValid:!0,warnings:[],errors:[]};try{(r.validateTemplateVariables?r.validateTemplateVariables(t):[]).forEach(e=>{i.push(`❌ ${e.variable}: ${e.error}`)})}catch(e){console.warn("Template variable validation failed:",e)}if("partiql"===E){const e=r.validatePartiQLQuery?r.validatePartiQLQuery(t):{isValid:!0};e.isValid||i.push(`❌ PartiQL Syntax Error: ${e.error}`)}t.includes("$__timeFilter")&&!e.timeFilterEnabled&&a.push('⚠️ $__timeFilter requires "Enable Time Filtering" to be turned ON. Please enable it below.'),t.includes("$__timeFilter")&&!e.timestampField&&a.push("⚠️ $__timeFilter requires a timestamp field to be specified.");const l=(t.match(/\$[\w_]+|\$\{[\w_]+\}/g)||[]).map(e=>e.startsWith("${")?e.slice(2,-1):e.slice(1)),n=["__from","__to","__timeFilter","__timeFilterIso","__timeFilterMs","__interval","__interval_ms","__rate_interval","__range","__fromIso","__toIso","__adhocFilters"],o=y.map(e=>e.replace("$",""));for(const e of l)n.includes(e)||o.includes(e)||a.push(`⚠️ Variable '$${e}' is not defined in dashboard variables`);return{isValid:0===i.length,warnings:a,errors:i}})(P||"");return t.warnings.length>0||t.errors.length>0?w().createElement("div",{style:{marginTop:i.spacing(1)}},t.errors.map((e,t)=>w().createElement(_.Alert,{key:`error-${t}`,severity:"error",title:"Template Variable Error"},e)),t.warnings.map((e,t)=>w().createElement(_.Alert,{key:`warning-${t}`,severity:"warning",title:"Template Variable Warning"},e))):null})()),w().createElement("div",{style:{marginTop:i.spacing(1)}},w().createElement(_.Button,{variant:"secondary",size:"sm",icon:b?"angle-down":"angle-right",fill:"text",onClick:()=>f(!b)},"Template Variables (",y.length," available)")),b&&w().createElement("div",{className:l.advancedSection},w().createElement("h4",{style:{margin:0,marginBottom:i.spacing(1)}},"Template Variable Usage"),h.length>0&&w().createElement("div",{style:{marginBottom:i.spacing(2)}},w().createElement("label",{className:l.fieldLabel},"Available Variables with Descriptions:"),w().createElement("div",{style:{marginTop:i.spacing(1)}},h.map((e,t)=>w().createElement("div",{key:t,style:{display:"flex",alignItems:"center",gap:i.spacing(1),marginBottom:i.spacing(.5),padding:i.spacing(.5),background:i.colors.background.secondary,borderRadius:i.shape.borderRadius(),border:`1px solid ${i.colors.border.weak}`}},w().createElement("code",{style:{background:i.colors.primary.main,color:i.colors.primary.contrastText,padding:"2px 6px",borderRadius:i.shape.borderRadius(),fontSize:i.typography.bodySmall.fontSize,fontWeight:i.typography.fontWeightMedium,minWidth:"120px",textAlign:"center"}},e.label),w().createElement("span",{style:{fontSize:i.typography.bodySmall.fontSize,color:i.colors.text.secondary}},e.detail))))),0===h.length&&y.length>0&&w().createElement("div",{style:{marginBottom:i.spacing(2)}},w().createElement("label",{className:l.fieldLabel},"Available Variables:"),w().createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:i.spacing(.5),marginTop:i.spacing(.5)}},y.map(e=>w().createElement("code",{key:e,style:{background:i.colors.background.secondary,padding:"2px 6px",borderRadius:i.shape.borderRadius(),fontSize:i.typography.bodySmall.fontSize,border:`1px solid ${i.colors.border.weak}`}},e)))),w().createElement("div",{className:l.infoText},w().createElement("strong",null,"PartiQL Template Variable Examples:"),w().createElement("br",null),"• ",w().createElement("code",null,'SELECT * FROM "$table_name" WHERE status = "$status"'),w().createElement("br",null),"• ",w().createElement("code",null,'SELECT * FROM "users" WHERE region IN ($regions)'),w().createElement("br",null),"• ",w().createElement("code",null,'SELECT * FROM "logs" WHERE $__timeFilter'),w().createElement("br",null),"• ",w().createElement("code",null,'SELECT * FROM "events" WHERE userId = "',"${user_id}",'" AND $__timeFilter'),w().createElement("br",null),"• ",w().createElement("code",null,'SELECT * FROM "logs" WHERE timestamp BETWEEN $__from AND $__to'),w().createElement("br",null),w().createElement("br",null),w().createElement("strong",null,"Variable Syntax:"),w().createElement("br",null),"• ",w().createElement("code",null,"$variable")," - Simple variable substitution",w().createElement("br",null),"• ",w().createElement("code",null,"${variable}")," - Variable in middle of expression",w().createElement("br",null),"• ",w().createElement("code",null,"$__timeFilter")," - Automatic time range filtering (when enabled)",w().createElement("br",null),"• ",w().createElement("code",null,"$__from"),", ",w().createElement("code",null,"$__to")," - Built-in time range variables",w().createElement("br",null),"• Multi-value variables automatically format as comma-separated quoted values",w().createElement("br",null),w().createElement("br",null),w().createElement("strong",null,"⚠️ Important:")," Don't use ",w().createElement("code",null,"LIMIT"),' in PartiQL queries. Use the "Limit" field below instead.')),w().createElement("div",{className:`${l.formRow} ${l.mobileStack}`,style:{marginTop:i.spacing(2)}},w().createElement("div",{className:l.smallFieldContainer},w().createElement("label",{className:l.fieldLabel},"Limit"),w().createElement(_.Input,{type:"number",placeholder:"100",value:W||100,onChange:S})),w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"Output Format"),w().createElement(_.Select,{value:U.find(e=>e.value===K),options:U,onChange:T}))),w().createElement("div",{className:`${l.formRow} ${l.mobileStack}`,style:{marginTop:i.spacing(2)}},w().createElement(_.InlineField,{label:"Enable Time Filtering",labelWidth:20},w().createElement(_.InlineSwitch,{value:e.timeFilterEnabled||!1,onChange:a=>{const r=a.currentTarget.checked;t(j(M({},e),{timeFilterEnabled:r,timeFrom:r?e.timeFrom:void 0,timeTo:r?e.timeTo:void 0}))}}))),e.timeFilterEnabled&&w().createElement("div",{className:`${l.formRow} ${l.mobileStack}`},w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"Timestamp Field Name"),w().createElement(_.Input,{placeholder:"timestamp",value:e.timestampField||"timestamp",onChange:a=>{t(j(M({},e),{timestampField:a.target.value}))}}))),w().createElement("div",{className:l.buttonGroup},w().createElement(_.Button,{className:l.testQueryButton,variant:"primary",size:"sm",icon:"play",disabled:m,onClick:O},m?"Testing...":"Test Query"),w().createElement(_.Button,{variant:"secondary",size:"sm",icon:"search",onClick:F,disabled:s},s?"Discovering Fields...":"Discover Schema"))):w().createElement("div",null,w().createElement("div",{className:`${l.formRow} ${l.mobileStack}`},w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"Table Name"),w().createElement(_.Input,{placeholder:"YourTableName or $table_name",value:D||"",onChange:$("table")}),y.length>0&&w().createElement("div",{className:l.infoText,style:{marginTop:i.spacing(.5)}},"💡 Use template variables: ",y.slice(0,3).join(", "),y.length>3&&` and ${y.length-3} more`)),w().createElement("div",{style:{alignSelf:"flex-end"}},w().createElement(_.Button,{variant:"secondary",size:"sm",icon:"search",disabled:s,onClick:()=>I(function*(){if(e.table){c(!0);try{const r=j(M({},e),{discoverSchema:!0,fieldMappings:void 0,outputFormat:"auto",limit:e.limit||100});t(r),a(),alert("🔍 Discovering schema... The system is analyzing your table structure to understand the data format.")}catch(e){console.error("Schema discovery failed:",e),alert("Schema discovery failed. Please check your table name and connection settings.")}finally{setTimeout(()=>c(!1),500)}}else alert("Please enter a table name first")})()},s?"Discovering...":"Discover Schema"))),w().createElement("div",{className:`${l.keyValueRow} ${l.mobileStack}`},w().createElement("div",{className:l.smallFieldContainer},w().createElement("label",{className:l.fieldLabel},"Partition Key"),w().createElement(_.Input,{placeholder:"id",value:V||"",onChange:$("partitionKeyName")})),w().createElement("span",{className:l.equalSign},"="),w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"Partition Key Value"),w().createElement(_.Input,{placeholder:"0009 or $user_id (or empty for all)",value:q||"",onChange:$("partitionKeyValue")}))),w().createElement("div",{className:`${l.keyValueRow} ${l.mobileStack}`},w().createElement("div",{className:l.smallFieldContainer},w().createElement("label",{className:l.fieldLabel},"Sort Key"),w().createElement(_.Input,{placeholder:"Timestamp (optional)",value:z||"",onChange:$("sortKeyName")})),w().createElement("span",{className:l.equalSign},"="),w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"Sort Key Value"),w().createElement(_.Input,{placeholder:"1753765220, $timestamp, or use time filtering below",value:B||"",onChange:$("sortKeyValue")}))),w().createElement("div",{className:`${l.formRow} ${l.mobileStack}`},w().createElement("div",{style:{marginBottom:i.spacing(1),fontSize:i.typography.bodySmall.fontSize,color:i.colors.text.secondary}},"💡 Time filtering automatically applies a WHERE condition to filter results by timestamp field"),w().createElement(_.InlineField,{label:"Enable Time Filtering",labelWidth:20},w().createElement(_.InlineSwitch,{value:e.timeFilterEnabled||!1,onChange:a=>{const r=a.currentTarget.checked;t(j(M({},e),{timeFilterEnabled:r,timeFrom:r?e.timeFrom:void 0,timeTo:r?e.timeTo:void 0}))}}))),e.timeFilterEnabled&&w().createElement(w().Fragment,null,w().createElement("div",{className:`${l.formRow} ${l.mobileStack}`},w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"Timestamp Field Name"),w().createElement(_.Input,{placeholder:"timestamp",value:e.timestampField||"timestamp",onChange:a=>{t(j(M({},e),{timestampField:a.target.value}))}}))),w().createElement("div",{className:`${l.formRow} ${l.mobileStack}`},w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"From Date/Time"),w().createElement(_.DateTimePicker,{date:e.timeFrom?(0,p.dateTime)(e.timeFrom):(0,p.dateTime)().subtract(24,"hours"),onChange:a=>{a&&t(j(M({},e),{timeFrom:a.toISOString()}))}})),w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"To Date/Time"),w().createElement(_.DateTimePicker,{date:e.timeTo?(0,p.dateTime)(e.timeTo):(0,p.dateTime)(),onChange:a=>{a&&t(j(M({},e),{timeTo:a.toISOString()}))}})))),w().createElement("div",{className:`${l.formRow} ${l.mobileStack}`},w().createElement("div",{className:l.smallFieldContainer},w().createElement("label",{className:l.fieldLabel},"Limit"),w().createElement(_.Input,{type:"number",placeholder:"100",value:W||100,onChange:S})),w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"Output Format"),w().createElement(_.Select,{value:U.find(e=>e.value===K),options:U,onChange:T}))),w().createElement("div",{className:l.buttonGroup},w().createElement(_.Button,{className:l.testQueryButton,variant:"primary",size:"md",icon:"play",disabled:m,onClick:O},m?"Executing Query...":"Run Query"),w().createElement(_.Button,{variant:"secondary",size:"md",icon:"search",onClick:F,disabled:s},s?"Discovering Fields...":"Discover Schema")))),w().createElement("div",null,w().createElement(_.Button,{variant:"secondary",size:"sm",icon:n?"angle-down":"angle-right",fill:"outline",onClick:()=>o(!n)},"Advanced Field Mapping (",(Q||[]).length," fields)")),n&&w().createElement("div",{className:l.advancedSection},w().createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}},w().createElement("h4",{style:{margin:0}},"Field Mappings"),w().createElement("div",{style:{display:"flex",gap:"8px"}},w().createElement(_.Button,{variant:"secondary",size:"sm",icon:"plus",onClick:()=>{const a=[...e.fieldMappings||[],{fieldName:"",sourcePath:"",dataType:"string"}];t(j(M({},e),{fieldMappings:a}))}},"Add Field"),w().createElement(_.Button,{variant:"primary",size:"sm",icon:"check",onClick:()=>I(function*(){if((e.fieldMappings||[]).filter(e=>!e.fieldName.trim()||!e.sourcePath.trim()).length>0)alert("Please fill in all field names and source paths before applying mappings.");else try{d(!0);const r=j(M({},e),{limit:Math.min(e.limit||25,100),discoverSchema:!1});t(r),setTimeout(()=>{a(),g(!0),setTimeout(()=>{g(!1)},3e3)},100)}catch(e){console.error("Failed to apply field mappings:",e),alert("Failed to apply field mappings. Please check your configuration.")}finally{setTimeout(()=>d(!1),2e3)}})(),disabled:0===(Q||[]).length},"Apply Mappings"))),u&&w().createElement("div",{className:l.successMessage},"✅ Field mappings applied successfully! Check the results below."),(Q||[]).map((a,r)=>w().createElement("div",{key:r,className:l.fieldMappingCard},w().createElement("div",{className:l.responsiveGrid},w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"Field Name"),w().createElement(_.Input,{value:a.fieldName,onChange:e=>k(r,"fieldName",e.target.value),placeholder:"Display name (e.g., 'User ID')"})),w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"Source Path"),w().createElement(_.Input,{value:a.sourcePath,onChange:e=>k(r,"sourcePath",e.target.value),placeholder:"Data path (e.g., 'user.id', 'items[0].name')"})),w().createElement("div",{className:l.smallFieldContainer},w().createElement("label",{className:l.fieldLabel},"Data Type"),w().createElement(_.Select,{value:H.find(e=>e.value===a.dataType),options:H,onChange:e=>k(r,"dataType",e.value||"string")})),w().createElement("div",{className:l.fieldContainer},w().createElement("label",{className:l.fieldLabel},"Transform"),w().createElement(_.Input,{value:a.transformation||"",onChange:e=>k(r,"transformation",e.target.value),placeholder:"parseFloat, timestamp"})),w().createElement("div",{style:{display:"flex",alignItems:"flex-end",marginTop:"20px"}},w().createElement(_.Button,{variant:"destructive",size:"sm",icon:"trash-alt",onClick:()=>(a=>{const r=(e.fieldMappings||[]).filter((e,t)=>t!==a);t(j(M({},e),{fieldMappings:r}))})(r)}))))),0===(Q||[]).length&&w().createElement(_.Alert,{severity:"info",title:"No field mappings configured"},w().createElement("strong",null,"Quick Start:"),w().createElement("br",null),"1. Click ",w().createElement("strong",null,'"Discover Schema"')," above to automatically analyze your table",w().createElement("br",null),"2. Or manually add field mappings using the ",w().createElement("strong",null,'"Add Field"')," button",w().createElement("br",null),"3. Click ",w().createElement("strong",null,'"Apply Mappings"')," to test your configuration",w().createElement("br",null),w().createElement("br",null),w().createElement("strong",null,"Field Mapping Examples:"),w().createElement("br",null),'• Field Name: "User ID" → Source Path: "userId" → Type: "string"',w().createElement("br",null),'• Field Name: "Location" → Source Path: "geo.coordinates" → Type: "json"',w().createElement("br",null),'• Field Name: "Score" → Source Path: "metrics.score" → Type: "number"')))});return m})());
//# sourceMappingURL=module.js.map
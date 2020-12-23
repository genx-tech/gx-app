"use strict";const{_}=require("rk-utils");const Feature=require("../enum/Feature");const{tryRequire}=require("../utils/Helpers");const{RestClient}=require("./restClient");const URL=require("url");class RestTestClient extends RestClient{constructor(endpoint,onSend,onError,onSent){super(endpoint,onSend,onError,onSent);this.agent=tryRequire("supertest")}initReq(httpMethod,url){const urlObj=URL.parse(url);const testUrl=urlObj.path;if(urlObj.hash){testUrl+="#"+urlObj.hash}if(!this.server){throw new Error("\"server\" is required before sending test request.")}return this.agent(this.server)[httpMethod](testUrl)}}module.exports={type:Feature.SERVICE,load_:async function(app,settings){_.map(settings,(endpoint,name)=>{let client=new RestTestClient(endpoint);app.registerService(`superTest.${name}`,client)})}};
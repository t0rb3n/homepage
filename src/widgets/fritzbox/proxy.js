import cache from "memory-cache";

import { httpProxy } from "utils/proxy/http";
import { formatApiCall } from "utils/proxy/api-helpers";
import getServiceWidget from "utils/config/service-helpers";
import createLogger from "utils/logger";
import widgets from "widgets/widgets";

const logger = createLogger("fritzboxproxyhandler");

// eslint-disable-next-line no-unused-vars
async function login(widget, service) {
  const endpoint = "accounts/ClientLogin";
  const api = widgets?.[widget.type]?.api
  const loginUrl = new URL(formatApiCall(api, { endpoint, ...widget }));
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };

  const [, , data,] = await httpProxy(loginUrl, {
    method: "POST",
    body: new URLSearchParams({
      Email: widget.username,
      Passwd: widget.password
    }).toString(),
    headers,
  });

  try {
    const [, token] = data.toString().split("\n").find(line => line.startsWith("Auth=")).split("=")
    // cache.put(`${sessionTokenCacheKey}.${service}`, token);
    return { token };
  } catch (e) {
    logger.error("Unable to login to FreshRSS API: %s", e);
  }

  return { token: false };
}

async function apiCall(widget, service, soapService, soapAction, soapUri) {
  // const key = `${sessionTokenCacheKey}.${service}`;
  const fritzUser = "";
  const fritzUserPassword= "";
  const fritzHost = "10.0.0.1"
  const head = ` <s:Header>` +
  `<h:InitChallenge xmlns:h="http://soap-authentication.org/digest/2001/10/"` +
  `s:mustUnderstand="1">` +
  `<UserID>${  fritzUser  }</UserID>` +
  `<Realm> F!Box SOAP-Auth </Realm>` +
  `</h:InitChallenge>` +
  `</s:Header>`;


  let body = `<?xml version="1.0" encoding="utf-8"?>` +
  `<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s=" http://schemas.xmlsoap.org/soap/envelope/">${ 
  head 
  }<s:Body>` +
  `<u:${  soapAction  } xmlns:u="urn:dslforum-org:service:${  soapService  }:1">`;
  body = `${body  }</u:${  soapAction  }>` +
  `</s:Body>` +
  `</s:Envelope>`;

  let 

  console.log(head, body);

  // const url = new URL(formatApiCall(widgets[widget.type].api, { endpoint, ...widget }));
  // const method = "GET";

  // let [status, contentType, data, responseHeaders] = await httpProxy(url, {
  //   method,
  //   headers,
  // });

  // if (status === 401) {
  //   logger.debug("FreshRSS API rejected the request, attempting to obtain new session token");
  //   const { token } = await login(widget, service);
  //   headers.Authorization = `GoogleLogin auth=${token}`;

  //   // retry the request, now with the new session token
  //   [status, contentType, data, responseHeaders] = await httpProxy(url, {
  //     method,
  //     headers,
  //   });
  // }

  // if (status !== 200) {
  //   logger.error("Error getting data from FreshRSS: %s status %d. Data: %s", url, status, data);
  //   return { status, contentType, data: null, responseHeaders };
  // }

  // return { status, contentType, data: JSON.parse(data.toString()), responseHeaders };
}

export default async function fritzboxProxyHandler(req, res) {
  const { group, service } = req.query;

  if (!group || !service) {
    logger.debug("Invalid or missing service '%s' or group '%s'", service, group);
    return res.status(400).json({ error: "Invalid proxy service type" });
  }

  const widget = await getServiceWidget(group, service);
  if (!widget) {
    logger.debug("Invalid or missing widget for service '%s' in group '%s'", service, group);
    return res.status(400).json({ error: "Invalid proxy service type" });
  }


  const isDSL = true;
  const soapService = isDSL ? "WANPPPConnection" : "WANCommonInterfaceConfig";
  const soapUri = isDSL ? "wanpppconn1" : "wancommonifconfig1";
  const soapAction = isDSL? "GetInfo" : "GetCommonLinkProperties";
  const { data: subscriptionData } = await apiCall(widget,service, soapService, soapUri, soapAction);
  const { data: unreadCountData } = await apiCall(widget, service, soapService, soapUri, soapAction);

  return res.status(200).send({
    subscriptions: subscriptionData?.subscriptions.length,
    unread: unreadCountData?.max
  });
}

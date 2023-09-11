/* eslint-disable  */
const request = require("request");
const { parseString } = require("xml2js");
const crypto = require("crypto");

const FRITZ_USER = 'xxx';
const FRITZ_USER_PASSWORD = 'xxx';
const FRITZ_HOST = '10.0.0.1' // just plain ip address

const SOAP_SERVICE = "WANCommonInterfaceConfig"
const SOAP_SERVICE_URI = "https://" + FRITZ_HOST + ":49443/upnp/control/wancommonifconfig1"
const SOAP_ACTION = "GetCommonLinkProperties"
const SOAP_SERVICE_DSL = "WANPPPConnection"
const SOAP_SERVICE_URI_DSL = "https://" + FRITZ_HOST + ":49443/upnp/control/wanpppconn1"
const SOAP_ACTION_DSL = "GetInfo"

function makeCall(soapService, soapServiceUri, soapAction,) {
    var head = " <s:Header>" +
        "<h:InitChallenge xmlns:h=\"http://soap-authentication.org/digest/2001/10/\"" +
        "s:mustUnderstand=\"1\">" +
        "<UserID>" + FRITZ_USER + "</UserID>" +
        "<Realm>" + 'F!Box SOAP-Auth' + "</Realm>" +
        "</h:InitChallenge>" +
        "</s:Header>";

    var body = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
        "<s:Envelope s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\" xmlns:s=\" http://schemas.xmlsoap.org/soap/envelope/\">" +
        head +
        "<s:Body>" +
        "<u:" + soapAction + " xmlns:u=\"" + "urn:dslforum-org:service:" + soapService + ":1" + "\">";
    body = body + "</u:" + soapAction + ">" +
        "</s:Body>" +
        "</s:Envelope>";

    request({
        method: 'POST',
        uri: soapServiceUri,
        agentOptions: {
            rejectUnauthorized: false
        },
        headers: {
            "SoapAction": "urn:dslforum-org:service:" + soapService + ":1#" + soapAction,
            "Content-Type": "text/xml; charset=\"utf-8\""
        },
        body: body
    }, function (error, response, body) {

        parseString(body, {
            explicitArray: false
        }, function (err, result) {
            const challenge = result['s:Envelope']['s:Header']['h:Challenge']

            //calc digest
            var MD5 = crypto.createHash('md5');
            MD5.update(FRITZ_USER + ":" + 'F!Box SOAP-Auth' + ":" + FRITZ_USER_PASSWORD);
            var secret = MD5.digest('hex');
            MD5 = crypto.createHash('md5');
            MD5.update(secret + ":" + challenge.Nonce);
            const digest = MD5.digest('hex');


            head = "<s:Header>" +
                "<h:ClientAuth xmlns:h=\"http://soap-authentication.org/digest/2001/10/\"" +
                "s:mustUnderstand=\"1\">" +
                "<Nonce>" + challenge.Nonce + "</Nonce>" +
                "<Auth>" + digest + "</Auth>" +
                "<UserID>" + FRITZ_USER + "</UserID>" +
                "<Realm>" + 'F!Box SOAP-Auth' + "</Realm>" +
                "</h:ClientAuth>" +
                "</s:Header>";
            var body = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
                "<s:Envelope s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\" xmlns:s=\" http://schemas.xmlsoap.org/soap/envelope/\">" +
                head +
                "<s:Body>" +
                "<u:" + soapAction + " xmlns:u=\"" + "urn:dslforum-org:service:" + soapService + ":1" + "\">";
            body = body + "</u:" + soapAction + ">" +
                "</s:Body>" +
                "</s:Envelope>";

            request({
                method: 'POST',
                uri: soapServiceUri,
                agentOptions: {
                    rejectUnauthorized: false
                },
                headers: {
                    "SoapAction": "urn:dslforum-org:service:" + soapService + ":1#" + soapAction,
                    "Content-Type": "text/xml; charset=\"utf-8\""
                },
                body: body
            }, function (error, response, body) {

                parseString(body, {
                    explicitArray: false
                }, function (err, result) {
                    if (soapService === "WANCommonInterfaceConfig") {
                        const props = result['s:Envelope']['s:Body']["u:GetCommonLinkPropertiesResponse"]

                        console.log("CommonLinkProperties:")
                        console.log(props);
                        console.log("LinkStatus: " + props.NewPhysicalLinkStatus)
                        console.log("Upstream: " + props.NewLayer1UpstreamMaxBitRate);
                        console.log("Downstream: " + props.NewLayer1DownstreamMaxBitRate + "\n");
                    } else {
                        const props = result['s:Envelope']['s:Body']["u:GetInfoResponse"]
                        console.log("WANPPPConnection (DSL/CABLE):")
                        console.log("LinkStatus: " + props.NewConnectionStatus)
                        console.log("Upstream: " + props.NewUpstreamMaxBitRate);
                        console.log("Downstream: " + props.NewDownstreamMaxBitRate + "\n");
                    }

                });
            });
        })
    })
}


makeCall(SOAP_SERVICE, SOAP_SERVICE_URI, SOAP_ACTION)
makeCall(SOAP_SERVICE_DSL, SOAP_SERVICE_URI_DSL, SOAP_ACTION_DSL)
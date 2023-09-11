
const widget = {
  api: "{url}/api/endpoints/{env}/{endpoint}",
  proxyHandler: fritzboxProxyHandler,
  
  // mappings is api call? 
  mappings: {
    "docker/containers/json": {
      endpoint: "docker/containers/json",
      params: ["all"],
    },
  },
};

export default widget;

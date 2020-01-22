# Motication of Fork
https://github.com/abema/abema-web/issues/15269

# polyfill.io User Agent normaliser

This is the VCL & JS implementation of the User-Agent normalisation used within the [polyfill-service](https://github.com/Financial-Times/polyfill-service) and the [polyfill-library](https://github.com/Financial-Times/polyfill-library).

# Usage

For a request which was the user-agent Chrome 71.1:

# Example in VCL
```vcl
import "normalise-user-agent.vcl";

sub vcl_recv {
  call normalise_user_agent_1_0_6;
#   req.http.normalized_user_agent_family = "chrome";
#   req.http.normalized_user_agent_major_version = "71";
#   req.http.normalized_user_agent_minor_version = "1";
#   req.http.normalized_user_agent_patch_version = "0";
#   req.http.Normalized-User-Agent = "chrome/71.1.0";
}
```

# Example in JS

```js
const UA = require('@financial-times/polyfill-useragent-normaliser');

const useragent = new UA(request.headers['user-agent']);
console.log(useragent.isUnknown()); // false
console.log(useragent.satisfies("<50")); // false
console.log(useragent.satisfies(">50")); // true
```

Start making a quick test over "api-name" API using our Console. Take into account that you need to:

1. Be registered and logged-in.
2. Verify you have an application linked to "api-name" API.
3. Have a sandbox data set linked to your application. If you have already done this for your application you can skip the following points 4 to 6.
4. Go to the Console and select the manager-sbx API and the APP you will use for the test and press "Try" button.
5. Select the /data service.
··1. manager-sbx is a 2 legged OAuth API, so the Authorization Grant option must be switched to "Client Credentials"
··2. The domain combo must be switched to apis.bbva.com.
6. Execute the PUT order. You will receive a 204 return code. This means that you have correctly linked the sandbox data set to your application.
7. Again in the Console select the "api-name" API and your application and press "Try" button.
8. Select the service you want to try and remember that: 
··1. "api-name" is a 3 legged OAuth API, so the Authorization Grant option must be switched to "Authorization Code"
··2.  The domain combo must be switched to apis.bbva.com.
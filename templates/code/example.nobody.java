import java.io.BufferedReader;
import java.io.InputStreamReader;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.Http{{methodData.method|capitalize}};
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;

public class APIRestExample 
{
	public static void main(String[] args) throws Exception { 
		//API end point to make a call
		String url = "{{resolvedUriParams}}"; 
		HttpClientBuilder hcBuilder = HttpClients.custom();
		HttpClient client = hcBuilder.build() ;
		Http{{methodData.method|capitalize}} request = new Http{{methodData.method|capitalize	}}(url);
{% if headers %}
		//Setting header parameters
	{% for key,prop in  headers %}
		request.addHeader("{{key}}", "{{prop.example}}");
	{% endfor %}
{% endif %}
		//Executing the call
		HttpResponse response = client.execute(request); 
		System.out.println("Sending '{{methodData.method|upper}}' to " + url);
		System.out.println("HTTP Response: " + response.getStatusLine().getStatusCode()); 
		BufferedReader rd = new BufferedReader(new InputStreamReader(response.getEntity().getContent()));
		//Reading the response
		StringBuffer result = new StringBuffer();
		String line = "";
		while ((line = rd.readLine()) != null) {
			result.append(line);
		} 
		System.out.println(result.toString()); 
	}
}
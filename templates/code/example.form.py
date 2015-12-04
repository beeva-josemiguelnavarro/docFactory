import urllib
import httplib

qparams = {}{% for key,prop in queryParams %}{% if prop.required %}
qparams["{{prop.key}}"] = "{{prop.example}}"{%endif%}{% endfor %}
parqparams = urllib.urlencode(qparams)

body = {}{% for key,prop in postFormPars %}
body["{{key}}"] = "{{prop.example}}"{% endfor %}
parbody = urllib.urlencode(body)

{% if url.protocol == "https" %}
conn = httplib.HTTPSConnection('{{url.host}}'){%else%}
conn = httplib.HTTPConnection('{{url.host}}'){%endif%}

headers = {}{% for key,prop in  headers %}
headers["key"] = "{{prop.example}}"{% endfor %} 
headers["Content-type"] = "application/x-www-form-urlencoded"

conn.request('{{ methodData.method| upper }}', '{{url.path}}?%s'%parqparams, parbody, headers)

r = conn.getresponse()

print r.status, r.read()
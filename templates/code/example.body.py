import urllib
import httplib

qparams = {}{% for key,prop in queryParams %}{% if prop.required %}
qparams["{{prop.key}}"] = "{{prop.example}}"{%endif%}{% endfor %}
parqparams = urllib.urlencode(qparams)

body = { body: "goes here"}
# body = <body>goes here</body>

{% if url.protocol == "https" %}
conn = httplib.HTTPSConnection('{{url.host}}'){%else%}
conn = httplib.HTTPConnection('{{url.host}}'){%endif%}

headers = {}{% for key,prop in  headers %}
headers["{{key}}"] = "{{prop.example}}"{% endfor %}

conn.request('{{ methodData.method| upper }}', '{{url.path}}?%s'%parqparams, body, headers)

r = conn.getresponse()

print r.status, r.read()
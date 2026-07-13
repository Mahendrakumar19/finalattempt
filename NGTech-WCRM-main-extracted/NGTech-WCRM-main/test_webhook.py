import hmac
import hashlib
import json
import urllib.request
import urllib.error
import time

secret = b'44ae97f737651f0a9df9bda0588b3a13'
payload_dict = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1234567890",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "1234567890",
              "phone_number_id": "1234567890"
            },
            "contacts": [{"profile": {"name": "Test User"}, "wa_id": "1234567890"}],
            "messages": [
              {
                "from": "1234567890",
                "id": "wamid.HBgLMTIzNDU2Nzg5MBUCABEYEFQ=",
                "timestamp": str(int(time.time())),
                "text": {"body": "Hello test!"},
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}

payload = json.dumps(payload_dict, separators=(',', ':')).encode('utf-8')
signature = 'sha256=' + hmac.new(secret, payload, hashlib.sha256).hexdigest()

def test_url(url):
    print("---")
    print(f"Testing POST {url}")
    req = urllib.request.Request(url, data=payload, headers={
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature
    })
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Response Status: {response.status}")
            print(f"Response Body: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code}")
        print(f"Response Body: {e.read().decode('utf-8')}")
    except urllib.error.URLError as e:
        print(f"URLError: {e.reason}")

test_url('http://localhost:3000/api/whatsapp/webhook')
test_url('https://ng-tech-wcrm.vercel.app/api/whatsapp/webhook')
test_url('https://ng-tech-wcrm-8wib.vercel.app/api/whatsapp/webhook')

#!/usr/bin/env bash
set -u
B=http://127.0.0.1:8000
cd /tmp
printf '%%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%%%EOF\n' > lic.pdf

curl -s -o /dev/null -X POST "$B/api/register/provider" \
  -F 'orgName=预览测试' -F 'orgType=中介机构' -F 'country=美国' \
  -F 'contactPerson=王' -F 'phone=13700000901' -F 'password=secret123' \
  -F 'email=prev@x.com' -F 'cooperation=合作' -F 'lang=zh' \
  -F 'licenseFile=@lic.pdf;type=application/pdf'

curl -s -c adm.txt -X POST "$B/api/admin/login" -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"changeme"}' >/dev/null

AID=$(curl -s -b adm.txt "$B/api/admin/registrations/providers" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
ATT=$(curl -s -b adm.txt "$B/api/admin/registrations/provider/$AID" | grep -o '"attachments":\[{"id":[0-9]*' | grep -o '[0-9]*$')
echo "provider=$AID attachment=$ATT"

echo '=== inline (default) headers ==='
curl -s -D - -o /dev/null -b adm.txt "$B/api/admin/registrations/attachments/$ATT" | grep -iE 'content-type|content-disposition'
echo '=== download=1 headers ==='
curl -s -D - -o /dev/null -b adm.txt "$B/api/admin/registrations/attachments/$ATT?download=1" | grep -iE 'content-type|content-disposition'

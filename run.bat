
ECHO $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=OmniCheck" -CertStoreLocation "Cert:\CurrentUser\My"
ECHO $password = ConvertTo-SecureString -String "stringSenha123" -Force -AsPlainText
ECHO Export-PfxCertificate -Cert $cert -FilePath "D:\Documentos\pps-electron-windows\certificate.pfx" -Password $password

Remove-Item -Recurse -Force .vite, out -ErrorAction SilentlyContinue

npm start
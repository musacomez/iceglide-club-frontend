# IceGlide frontend derleme güncellemesi

Cloudflare derleme logu Next.js 15.5.26 sürümünde duruyor. Bu paket Next.js 16.4.6, React 19.3.1 ve OpenNext 1.20.17 sürümlerini pinler. Wrangler sürümü kilit dosyasında 4.165.0 olarak kayıtlıdır. Parolamı Değiştir ekranı da pakete dahildir.

1. ZIP'i ayıkla. Frontend Codespaces'te `package.json`, `package-lock.json`, `tsconfig.json` ve `eslint.config.mjs` dosyaları depo köküne gelecek. Önceki `.eslintrc.json` dosyasını kaldır. `src` altındaki dört dosyayı aynı yollarına kopyala. Depoda Copilot ile sonradan da yapılmış değişiklikler varsa ilgili dosyaları karşılaştırıp birleştir.
2. Source Control'da değişiklikleri incele ve tek commit ile Cloudflare'ın izlediği dala gönder. `package.json` ve `package-lock.json` aynı commit'te olmalı.
3. Cloudflare'daki frontend Worker'ın build komutu `npx opennextjs-cloudflare build` olarak kalır. Deploy komutu, mevcut çalışan OpenNext yapılandırmasına göre `npx opennextjs-cloudflare deploy` olabilir.
4. Yeni build logunda `Next.js version : 16.4.6` ve `OpenNext build complete.` satırlarını, ardından dağıtımın tamamlandığını kontrol et.
5. Parolamı Değiştir ekranını kullanmadan önce parola API güncellemesinin backend Worker'da yayımlandığını doğrula. Hesap menüsünden ekranı açıp bir deneme hesabıyla kontrol et.

Cloudflare logundaki audit sayımı bağımlılıkların ayrıca incelenmesini gerektirir. Bu paket, 22 uyarının tamamının giderildiğini doğrulamaz.

# 銀髮安心付｜使用說明

## 內容
- 熟齡大字體手機介面
- 四項模擬商品
- QR Code 相機掃描
- 店家與金額確認
- 四位數模擬密碼／模擬指紋
- 語音提示
- 電子收據
- 錯誤金額辨識關卡
- PWA，可加入手機主畫面

## 本機測試
直接開啟 index.html 可瀏覽主要流程。
相機掃描通常需要 HTTPS，因此建議上傳到 Netlify 或 GitHub Pages 後測試。

## Netlify 發布
1. 登入 Netlify。
2. 將整個 senior_pay_web 資料夾拖入網站部署區。
3. Netlify 會產生 HTTPS 網址。
4. 用手機開啟網址，允許相機權限。

## QR Code 商品代碼
- coffee
- bread
- pickle
- ticket
- trap

QR Code 也可放入網址，例如：
https://example.com/?code=coffee

## 教學安全聲明
此網站僅供教學模擬，不連結銀行帳戶，也不會產生真實扣款。

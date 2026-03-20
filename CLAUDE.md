# Groomer Mate

寵物美容師 CRM 系統，台灣市場，中文介面。

## Tech Stack

- **Framework**: Next.js 14.1 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS 3
- **Database**: Supabase (PostgreSQL + Storage)
- **AI**: Google Gemini 1.5 Flash（語音分析）
- **Auth**: LINE LIFF SDK（社群登入 + access token 驗證）
- **Icons**: lucide-react

## 開發指令

```bash
npm run dev      # 本機開發
npm run build    # 產品建置
npm run lint     # ESLint 檢查
```

## 環境變數

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_LIFF_ID
GEMINI_API_KEY
```

## 專案結構

```
app/
  page.tsx                          # 首頁（錄音 + PetSelector + 分享）
  history/page.tsx                  # 歷史紀錄（搜尋 + 篩選 + 分享）
  customers/page.tsx                # 客戶列表（搜尋 + 新增）
  customers/[id]/page.tsx           # 客戶詳情（編輯 + 寵物列表 + 刪除）
  customers/[id]/pets/[petId]/page.tsx  # 寵物詳情（編輯 + 美容紀錄 + 刪除）
  api/
    analyze-log/route.ts            # Gemini 語音分析
    grooming-logs/route.ts          # 紀錄 list/create（含篩選）
    grooming-logs/[id]/route.ts     # 紀錄 GET/PUT/DELETE
    customers/route.ts              # 客戶 list/create
    customers/[id]/route.ts         # 客戶 GET/PUT/DELETE
    pets/route.ts                   # 寵物 list/create
    pets/[id]/route.ts              # 寵物 GET/PUT/DELETE
    audio-upload/route.ts           # 音檔上傳到 Storage
components/
  LiffProvider.tsx                  # LIFF context（含 token 同步）
  BottomNav.tsx                     # 3-tab 底部導航
  HistoryCard.tsx                   # 紀錄卡片（含分享/關聯寵物）
  SearchBar.tsx, FormModal.tsx, ConfirmDialog.tsx
  PetSelector.tsx, CustomerCard.tsx, PetCard.tsx, EmptyState.tsx
  Toast.tsx, ErrorBoundary.tsx
lib/
  auth.ts                           # LIFF token 驗證（LINE Profile API）
  api.ts                            # Client API 函式（含 auth header 注入）
  liff.ts                           # LIFF 初始化（含 accessToken）
  line-share.ts                     # LINE shareTargetPicker + Flex Message
  supabase.ts / supabase-server.ts  # Supabase client/server
types/
  grooming-log.ts, customer.ts, pet.ts
supabase/
  schema.sql                        # Phase 0 DB schema
  schema-phase1.sql                 # Phase 1 DB migration
```

## 架構重點

- **Auth 策略**: API routes 用 `verifyLiffToken()` 驗證 LIFF access token（呼叫 LINE Profile API），同時保留 `userId` query param 作為 fallback 向後相容
- **RLS**: 全表 deny-all policy，所有操作透過 service role key 繞過 RLS
- **Ownership**: 每個 API 都做 `user_id` ownership check，美容師之間資料隔離
- **pet_id nullable**: grooming_logs.pet_id 可為空，允許先錄音後關聯寵物
- **反正規化**: pets.user_id 複製自 customers，加速 ownership check 免 JOIN
- **錄音改進**: 串流快取（streamRef）、權限防呆（isRequestingPermission）、全域 release 監聽

## DB 關聯

```
customers (1) ──CASCADE──> pets (N)
pets (1) ──SET NULL──> grooming_logs.pet_id (N)
```

刪客戶 → 自動刪寵物；刪寵物 → 紀錄保留但 pet_id 清空。

## 完成狀態

### Phase 0（已完成）
- LINE LIFF 登入
- 語音錄製 + Gemini AI 分析
- Supabase 儲存 grooming_logs
- 歷史紀錄頁面

### Phase 1（已完成 — 程式碼）
- customers / pets 表 + 型別定義
- LIFF token 驗證（lib/auth.ts）
- 客戶 CRUD API + 寵物 CRUD API
- 音檔上傳到 Supabase Storage
- grooming_logs 擴充：pet_id、server-side 篩選（寵物/客戶/日期/關鍵字/標籤）
- 客戶列表頁 + 客戶詳情頁 + 寵物詳情頁
- 首頁加 PetSelector + 音檔上傳 + 分享按鈕
- 歷史頁加搜尋 + 篩選面板 + 分享 + 關聯寵物
- 底部導航改為 3 tab（首頁/客戶/紀錄）
- LINE shareTargetPicker + Flex Message 分享

## 待辦事項

### Phase 1 部署前（必要）
- [ ] 在 Supabase Dashboard 執行 `supabase/schema-phase1.sql`
- [ ] 部署後在 LINE 內建瀏覽器完整測試核心流程
- [ ] 驗證：新增客戶 → 新增寵物 → 選寵物錄音 → 儲存 → 確認 pet_id
- [ ] 驗證：不選寵物直接錄音 → 儲存 → pet_id = null（向後相容）
- [ ] 驗證：歷史紀錄搜尋 / 篩選 / 關聯寵物
- [ ] 驗證：LINE 分享按鈕（僅 LINE 內建瀏覽器顯示）

### Phase 1 優化（可選）
- [ ] LIFF token 過期處理：client 攔截 401 → 重新取 token 或提示重新整理
- [ ] 錯誤邊界（ErrorBoundary）覆蓋新頁面

### Phase 2 候選功能
- [ ] 音檔播放 UI（Storage 已有檔案，缺前端播放器）
- [ ] 分頁載入（客戶/紀錄量大時的 infinite scroll）
- [ ] 寵物照片上傳
- [ ] 定期美容提醒通知
- [ ] 離線支援（Service Worker 快取）

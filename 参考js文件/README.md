# 参考 JS 文件说明

本目录为从 catalogue.ac 等参考项目抽取的脚本，用于对照和复用。以下为各文件用途及在当前项目中的使用建议。

---

## 1. `main.js`

- **用途**：主入口，jQuery 驱动，包含语言列表、设置、图鉴/日历等逻辑；体量较大。
- **可复用点**：
  - **onImgError**：图片加载失败时替换为 `img/not_found.png`。当前项目已在各组件中实现类似逻辑（使用内联 SVG 占位），并已在 `src/lib/acnh-api.js` 中统一导出 `onImgError` 与 `IMG_FALLBACK_SVG`，建议新组件直接使用该 API。
- **建议**：仅作逻辑参考，不直接引入；需要时从 main 中摘取具体算法再在 Vue 中重写。

---

## 2. `tools.catalogue.js`

- **用途**：图鉴搜索与筛选（压缩后）。提供 `Catalogue` 实例，支持：
  - `search(filters)`：按名称、分类、北/南半球月份、活动、日期等筛选。
  - `get(id)` / `getIndex()`：按 id 取单条或索引。
- **数据形态**：依赖 catalogue.ac 的 `data.json` + `maps`（var、evt、vad 等），与当前项目使用的数据结构一致。
- **可复用点**：
  - 若要做「按月份/半球筛选鱼虫海」或「按活动筛选」，可参考其 `search` 里对 `cav`/`nhd`/`shd`、`evt` 的处理逻辑，在 `stores/catalogue.js` 或 `acnh-api.js` 中实现一套简化版筛选。
- **已实现**：在 `acnh-api.js` 中实现了 `expandNhdShd`、`isCritterAvailableInMonth`、`hasCritterEvent`，图鉴转换时附带 `monthsNorth`/`monthsSouth`/`eventIds`；在 `CatalogueView.vue` 中为鱼/虫/海增加了「北半球/南半球」「全部月份/当前月/1–12 月」「全部活动/按活动」筛选。
- **注意**：代码已压缩，可读性差，建议只参考思路，用可读代码在 Vue/Pinia 中重写。

---

## 3. `tools.dialog.js`

- **用途**：基于 jQuery 的弹窗封装（open/close/replaceContent/replaceButtons/onClose）。
- **当前项目**：已使用 Vue 组件 `DetailDialog` 等实现详情弹窗。
- **建议**：无需引入；若需增强弹窗 API，可在现有 Vue 组件上扩展，不必移植 jQuery 版。

---

## 4. `tools.encoder.js`

- **用途**：自定义字符集编解码（`encodeString` / `decodeString`），将字符串转为短码（类 Base64 的 6bit 编码）。
- **可复用点**：
  - 若要做「分享链接」「图鉴进度码」「大头菜模式码」等，需要短码时可移植或重写此 Encoder。
- **建议**：当前未使用；有分享/导出功能时再考虑引入或重写。

---

## 5. `tools.intervaltimer.js`

- **用途**：按固定时间间隔在「整点」触发回调（如每 5 分钟在 0、5、10… 分触发），用于与服务器或游戏内刷新时间对齐。
- **可复用点**：
  - 大头菜价格「下次刷新倒计时」、日历「下次日期切换」等，可用类似逻辑在 Vue 里用 `setTimeout`/`setInterval` 实现下一次触发时间。
- **建议**：需要「下次刷新在 X 分 X 秒」时，可参考其 `setTimeout` 与 `Math.ceil(n/o)*o - n` 的算法，在 `TurnipView.vue` 或单独 composable 中实现，不必直接引入原脚本。

---

## 6. `tools.localizer.js`

- **用途**：多语言与日期/时间格式化（`getDate`、`getLongDate`、`getMonth`、`getWeekday`、`getTime`、`getDateRange` 等），基于 `Intl.DateTimeFormat`，并驱动 `[data-loc]` 的 DOM 更新。
- **可复用点**：
  - 若要做多语言或统一日期时间显示格式，可参考其用法，用 `Intl.DateTimeFormat` 在 Vue 里写格式化函数或 i18n 插件。
- **建议**：当前以中文为主，若后续加多语言或统一日期格式，再按需抽取/重写，不必引入整份 Localizer。

---

## 7. `tools.ratelimiter.js`

- **用途**：节流：`call()` 后在一段时间内只执行一次回调；`lock`/`unlock` 可暂停/恢复。
- **可复用点**：
  - 限制请求频率（如搜索接口、图鉴接口）或按钮重复点击时，可用类似节流逻辑。
- **当前项目**：已在 `acnh-api.js` 中提供 `debounce`（防抖），用于搜索输入等场景；若需「每 N 秒最多执行一次」的节流，可单独写一个 `throttle` 或 composable。

---

## 当前项目已做的对应实现

| 参考 | 项目内实现 |
|------|------------|
| onImgError | `acnh-api.js`: `onImgError`、`IMG_FALLBACK_SVG`，各组件可统一使用 |
| 图鉴数据与 CDN | `acnh-api.js` + `stores/catalogue.js`：拉取、转换、图标 URL |
| 弹窗 | Vue 组件：`DetailDialog`、详情页等 |
| 防抖 | `acnh-api.js`: `debounce(fn, ms)`，可用于搜索框等 |

如需在某个页面使用「节流」「间隔定时器」或「编码器」，可在对应模块中按上述建议从参考脚本中抽取思路并实现，避免直接依赖未维护的压缩代码。

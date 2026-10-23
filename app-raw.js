/*!
 * 火烧云预报系统 · 前端业务脚本
 * Copyright (c) 2026 Sohp. All rights reserved.
 *
 * 本文件为著作权作品，受法律保护；未经书面许可，禁止复制、传播或二次分发。
 */

/* 主题预置：在首次绘制前定好 data-theme，避免浅/深色切换闪烁 */
    (function () {
      var mode = "system";
      try { mode = localStorage.getItem("sunset-theme") || "system"; } catch (e) {}
      var dark = false;
      try {
        if (window.AndroidTheme && typeof AndroidTheme.isDark === "function") dark = !!AndroidTheme.isDark();
        else dark = !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
      } catch (e) { dark = false; }
      var resolved = mode === "dark" || (mode === "system" && dark);
      document.documentElement.setAttribute("data-theme", resolved ? "dark" : "light");
    })();

// ==================== 1. 8级火烧云分级定义（见 algorithm-raw.js） ====================
/* GRADES 由 algorithm-raw.js 定义，index.html 在本脚本之前加载该文件。 */

// ==================== 2. 内置中国及全球所有主要城市地理坐标字典 ====================
const CITY_COORDS_DB = {
  // --- 中国主要城市 ---
  "上海": { name: "中国·上海市", en: "Shanghai", region: "中国", lat: 31.2304, lon: 121.4737, tz: 8 },
  "北京": { name: "中国·北京市", en: "Beijing", region: "中国", lat: 39.9042, lon: 116.4074, tz: 8 },
  "广州": { name: "中国·广州市", en: "Guangzhou", region: "中国", lat: 23.1291, lon: 113.2644, tz: 8 },
  "深圳": { name: "中国·深圳市", en: "Shenzhen", region: "中国", lat: 22.5431, lon: 114.0579, tz: 8 },
  "杭州": { name: "中国·杭州市", en: "Hangzhou", region: "中国", lat: 30.2741, lon: 120.1551, tz: 8 },
  "南京": { name: "中国·南京市", en: "Nanjing", region: "中国", lat: 32.0603, lon: 118.7969, tz: 8 },
  "苏州": { name: "中国·苏州市", en: "Suzhou", region: "中国", lat: 31.2989, lon: 120.5853, tz: 8 },
  "无锡": { name: "中国·无锡市", en: "Wuxi", region: "中国", lat: 31.4912, lon: 120.3119, tz: 8 },
  "常州": { name: "中国·常州市", en: "Changzhou", region: "中国", lat: 31.8112, lon: 119.9741, tz: 8 },
  "南通": { name: "中国·南通市", en: "Nantong", region: "中国", lat: 31.9802, lon: 120.8943, tz: 8 },
  "扬州": { name: "中国·扬州市", en: "Yangzhou", region: "中国", lat: 32.3942, lon: 119.4129, tz: 8 },
  "徐州": { name: "中国·徐州市", en: "Xuzhou", region: "中国", lat: 34.2044, lon: 117.2858, tz: 8 },
  "宁波": { name: "中国·宁波市", en: "Ningbo", region: "中国", lat: 29.8683, lon: 121.5440, tz: 8 },
  "温州": { name: "中国·温州市", en: "Wenzhou", region: "中国", lat: 27.9943, lon: 120.6994, tz: 8 },
  "嘉兴": { name: "中国·嘉兴市", en: "Jiaxing", region: "中国", lat: 30.7468, lon: 120.7555, tz: 8 },
  "湖州": { name: "中国·湖州市", en: "Huzhou", region: "中国", lat: 30.8943, lon: 120.0868, tz: 8 },
  "绍兴": { name: "中国·绍兴市", en: "Shaoxing", region: "中国", lat: 30.0303, lon: 120.5802, tz: 8 },
  "金华": { name: "中国·金华市", en: "Jinhua", region: "中国", lat: 29.0792, lon: 119.6474, tz: 8 },
  "台州": { name: "中国·台州市", en: "Taizhou", region: "中国", lat: 28.6564, lon: 121.4208, tz: 8 },
  "舟山": { name: "中国·舟山市", en: "Zhoushan", region: "中国", lat: 29.9853, lon: 122.2072, tz: 8 },
  "合肥": { name: "中国·合肥市", en: "Hefei", region: "中国", lat: 31.8206, lon: 117.2272, tz: 8 },
  "芜湖": { name: "中国·芜湖市", en: "Wuhu", region: "中国", lat: 31.3529, lon: 118.4331, tz: 8 },
  "黄山": { name: "中国·黄山市", en: "Huangshan", region: "中国", lat: 29.7147, lon: 118.3375, tz: 8 },
  "成都": { name: "中国·成都市", en: "Chengdu", region: "中国", lat: 30.5728, lon: 104.0668, tz: 8 },
  "重庆": { name: "中国·重庆市", en: "Chongqing", region: "中国", lat: 29.5630, lon: 106.5516, tz: 8 },
  "绵阳": { name: "中国·绵阳市", en: "Mianyang", region: "中国", lat: 31.4675, lon: 104.6791, tz: 8 },
  "甘孜": { name: "中国·甘孜藏族自治州", en: "Garze", region: "中国", lat: 30.0495, lon: 101.9623, tz: 8 },
  "阿坝": { name: "中国·阿坝藏族羌族自治州", en: "Ngawa", region: "中国", lat: 31.8994, lon: 102.2246, tz: 8 },
  "武汉": { name: "中国·武汉市", en: "Wuhan", region: "中国", lat: 30.5928, lon: 114.3055, tz: 8 },
  "宜昌": { name: "中国·宜昌市", en: "Yichang", region: "中国", lat: 30.6920, lon: 111.2865, tz: 8 },
  "襄阳": { name: "中国·襄阳市", en: "Xiangyang", region: "中国", lat: 32.0090, lon: 112.1224, tz: 8 },
  "长沙": { name: "中国·长沙市", en: "Changsha", region: "中国", lat: 28.2282, lon: 112.9388, tz: 8 },
  "张家界": { name: "中国·张家界市", en: "Zhangjiajie", region: "中国", lat: 29.1171, lon: 110.4792, tz: 8 },
  "西安": { name: "中国·西安市", en: "Xi'an", region: "中国", lat: 34.3416, lon: 108.9398, tz: 8 },
  "青岛": { name: "中国·青岛市", en: "Qingdao", region: "中国", lat: 36.0671, lon: 120.3826, tz: 8 },
  "济南": { name: "中国·济南市", en: "Jinan", region: "中国", lat: 36.6512, lon: 117.1201, tz: 8 },
  "烟台": { name: "中国·烟台市", en: "Yantai", region: "中国", lat: 37.4638, lon: 121.4479, tz: 8 },
  "威海": { name: "中国·威海市", en: "Weihai", region: "中国", lat: 37.5131, lon: 122.1204, tz: 8 },
  "厦门": { name: "中国·厦门市", en: "Xiamen", region: "中国", lat: 24.4798, lon: 118.0894, tz: 8 },
  "福州": { name: "中国·福州市", en: "Fuzhou", region: "中国", lat: 26.0745, lon: 119.2965, tz: 8 },
  "泉州": { name: "中国·泉州市", en: "Quanzhou", region: "中国", lat: 24.8741, lon: 118.6757, tz: 8 },
  "大理": { name: "中国·大理白族自治州", en: "Dali", region: "中国", lat: 25.6065, lon: 100.2676, tz: 8 },
  "昆明": { name: "中国·昆明市", en: "Kunming", region: "中国", lat: 25.0389, lon: 102.7183, tz: 8 },
  "丽江": { name: "中国·丽江市", en: "Lijiang", region: "中国", lat: 26.8721, lon: 100.2299, tz: 8 },
  "香格里拉": { name: "中国·香格里拉市", en: "Shangri-La", region: "中国", lat: 27.8269, lon: 99.7060, tz: 8 },
  "西双版纳": { name: "中国·西双版纳傣族自治州", en: "Xishuangbanna", region: "中国", lat: 22.0088, lon: 100.7972, tz: 8 },
  "拉萨": { name: "中国·拉萨市", en: "Lhasa", region: "中国", lat: 29.6525, lon: 91.1721, tz: 8 },
  "林芝": { name: "中国·林芝市", en: "Nyingchi", region: "中国", lat: 29.6491, lon: 94.3615, tz: 8 },
  "日喀则": { name: "中国·日喀则市", en: "Shigatse", region: "中国", lat: 29.2669, lon: 88.8806, tz: 8 },
  "三亚": { name: "中国·三亚市", en: "Sanya", region: "中国", lat: 18.2528, lon: 109.5120, tz: 8 },
  "海口": { name: "中国·海口市", en: "Haikou", region: "中国", lat: 20.0440, lon: 110.1999, tz: 8 },
  "桂林": { name: "中国·桂林市", en: "Guilin", region: "中国", lat: 25.2736, lon: 110.2900, tz: 8 },
  "南宁": { name: "中国·南宁市", en: "Nanning", region: "中国", lat: 22.8170, lon: 108.3665, tz: 8 },
  "北海": { name: "中国·北海市", en: "Beihai", region: "中国", lat: 21.4812, lon: 109.1199, tz: 8 },
  "贵阳": { name: "中国·贵阳市", en: "Guiyang", region: "中国", lat: 26.6470, lon: 106.6302, tz: 8 },
  "南昌": { name: "中国·南昌市", en: "Nanchang", region: "中国", lat: 28.6820, lon: 115.8579, tz: 8 },
  "九江": { name: "中国·九江市", en: "Jiujiang", region: "中国", lat: 29.7051, lon: 116.0019, tz: 8 },
  "郑州": { name: "中国·郑州市", en: "Zhengzhou", region: "中国", lat: 34.7466, lon: 113.6253, tz: 8 },
  "洛阳": { name: "中国·洛阳市", en: "Luoyang", region: "中国", lat: 34.6197, lon: 112.4540, tz: 8 },
  "太原": { name: "中国·太原市", en: "Taiyuan", region: "中国", lat: 37.8706, lon: 112.5489, tz: 8 },
  "大同": { name: "中国·大同市", en: "Datong", region: "中国", lat: 40.0768, lon: 113.3001, tz: 8 },
  "石家庄": { name: "中国·石家庄市", en: "Shijiazhuang", region: "中国", lat: 38.0428, lon: 114.5149, tz: 8 },
  "秦皇岛": { name: "中国·秦皇岛市", en: "Qinhuangdao", region: "中国", lat: 39.9354, lon: 119.6005, tz: 8 },
  "天津": { name: "中国·天津市", en: "Tianjin", region: "中国", lat: 39.3434, lon: 117.3616, tz: 8 },
  "沈阳": { name: "中国·沈阳市", en: "Shenyang", region: "中国", lat: 41.8057, lon: 123.4315, tz: 8 },
  "大连": { name: "中国·大连市", en: "Dalian", region: "中国", lat: 38.9140, lon: 121.6147, tz: 8 },
  "长春": { name: "中国·长春市", en: "Changchun", region: "中国", lat: 43.8171, lon: 125.3235, tz: 8 },
  "哈尔滨": { name: "中国·哈尔滨市", en: "Harbin", region: "中国", lat: 45.8038, lon: 126.5350, tz: 8 },
  "呼和浩特": { name: "中国·呼和浩特市", en: "Hohhot", region: "中国", lat: 40.8426, lon: 111.7492, tz: 8 },
  "银川": { name: "中国·银川市", en: "Yinchuan", region: "中国", lat: 38.4872, lon: 106.2309, tz: 8 },
  "兰州": { name: "中国·兰州市", en: "Lanzhou", region: "中国", lat: 36.0611, lon: 103.8343, tz: 8 },
  "敦煌": { name: "中国·敦煌市", en: "Dunhuang", region: "中国", lat: 40.1421, lon: 94.6620, tz: 8 },
  "西宁": { name: "中国·西宁市", en: "Xining", region: "中国", lat: 36.6171, lon: 101.7782, tz: 8 },
  "乌鲁木齐": { name: "中国·乌鲁木齐市", en: "Urumqi", region: "中国", lat: 43.8256, lon: 87.6168, tz: 8 },
  "喀什": { name: "中国·喀什地区", en: "Kashgar", region: "中国", lat: 39.4704, lon: 75.9898, tz: 8 },
  "伊犁": { name: "中国·伊犁哈萨克自治州", en: "Ili", region: "中国", lat: 43.9169, lon: 81.3246, tz: 8 },
  "阿勒泰": { name: "中国·阿勒泰地区", en: "Altay", region: "中国", lat: 47.8449, lon: 88.1403, tz: 8 },
  "香港": { name: "中国·香港特别行政区", en: "Hong Kong", region: "中国", lat: 22.3193, lon: 114.1694, tz: 8 },
  "澳门": { name: "中国·澳门特别行政区", en: "Macau", region: "中国", lat: 22.1987, lon: 113.5439, tz: 8 },
  "台北": { name: "中国·台北市", en: "Taipei", region: "中国", lat: 25.0330, lon: 121.5654, tz: 8 },
  "高雄": { name: "中国·高雄市", en: "Kaohsiung", region: "中国", lat: 22.6273, lon: 120.3014, tz: 8 },
  "珠海": { name: "中国·珠海市", en: "Zhuhai", region: "中国", lat: 22.2710, lon: 113.5767, tz: 8 },
  "佛山": { name: "中国·佛山市", en: "Foshan", region: "中国", lat: 23.0215, lon: 113.1214, tz: 8 },
  "东莞": { name: "中国·东莞市", en: "Dongguan", region: "中国", lat: 23.0207, lon: 113.7518, tz: 8 },
  "惠州": { name: "中国·惠州市", en: "Huizhou", region: "中国", lat: 23.1115, lon: 114.4162, tz: 8 },
  "汕头": { name: "中国·汕头市", en: "Shantou", region: "中国", lat: 23.3541, lon: 116.6820, tz: 8 },

  // --- 国外主要城市：亚洲与中东 ---
  "东京": { name: "日本·东京 (Tokyo)", en: "Tokyo", region: "亚洲", lat: 35.6762, lon: 139.6503, tz: 9 },
  "大阪": { name: "日本·大阪 (Osaka)", en: "Osaka", region: "亚洲", lat: 34.6937, lon: 135.5023, tz: 9 },
  "京都": { name: "日本·京都 (Kyoto)", en: "Kyoto", region: "亚洲", lat: 35.0116, lon: 135.7681, tz: 9 },
  "横滨": { name: "日本·横滨 (Yokohama)", en: "Yokohama", region: "亚洲", lat: 35.4437, lon: 139.6380, tz: 9 },
  "名古屋": { name: "日本·名古屋 (Nagoya)", en: "Nagoya", region: "亚洲", lat: 35.1815, lon: 136.9066, tz: 9 },
  "札幌": { name: "日本·札幌 (Sapporo)", en: "Sapporo", region: "亚洲", lat: 43.0618, lon: 141.3545, tz: 9 },
  "福冈": { name: "日本·福冈 (Fukuoka)", en: "Fukuoka", region: "亚洲", lat: 33.5902, lon: 130.4017, tz: 9 },
  "冲绳": { name: "日本·冲绳那霸 (Okinawa)", en: "Okinawa", region: "亚洲", lat: 26.2124, lon: 127.6809, tz: 9 },
  "富士山": { name: "日本·河口湖/富士山 (Mt. Fuji)", en: "Fuji", region: "亚洲", lat: 35.4982, lon: 138.7686, tz: 9 },
  "首尔": { name: "韩国·首尔 (Seoul)", en: "Seoul", region: "亚洲", lat: 37.5665, lon: 126.9780, tz: 9 },
  "釜山": { name: "韩国·釜山 (Busan)", en: "Busan", region: "亚洲", lat: 35.1796, lon: 129.0756, tz: 9 },
  "济州岛": { name: "韩国·济州岛 (Jeju)", en: "Jeju", region: "亚洲", lat: 33.4996, lon: 126.5312, tz: 9 },
  "仁川": { name: "韩国·仁川 (Incheon)", en: "Incheon", region: "亚洲", lat: 37.4563, lon: 126.7052, tz: 9 },
  "新加坡": { name: "新加坡 (Singapore)", en: "Singapore", region: "亚洲", lat: 1.3521, lon: 103.8198, tz: 8 },
  "曼谷": { name: "泰国·曼谷 (Bangkok)", en: "Bangkok", region: "亚洲", lat: 13.7563, lon: 100.5018, tz: 7 },
  "清迈": { name: "泰国·清迈 (Chiang Mai)", en: "Chiang Mai", region: "亚洲", lat: 18.7883, lon: 98.9853, tz: 7 },
  "普吉岛": { name: "泰国·普吉岛 (Phuket)", en: "Phuket", region: "亚洲", lat: 7.8804, lon: 98.3923, tz: 7 },
  "吉隆坡": { name: "马来西亚·吉隆坡 (Kuala Lumpur)", en: "Kuala Lumpur", region: "亚洲", lat: 3.1390, lon: 101.6869, tz: 8 },
  "槟城": { name: "马来西亚·槟城 (Penang)", en: "Penang", region: "亚洲", lat: 5.4141, lon: 100.3288, tz: 8 },
  "亚庇": { name: "马来西亚·沙巴亚庇 (Kota Kinabalu)", en: "Kota Kinabalu", region: "亚洲", lat: 5.9804, lon: 116.0735, tz: 8 },
  "雅加达": { name: "印度尼西亚·雅加达 (Jakarta)", en: "Jakarta", region: "亚洲", lat: -6.2088, lon: 106.8456, tz: 7 },
  "巴厘岛": { name: "印度尼西亚·巴厘岛 (Bali)", en: "Bali", region: "亚洲", lat: -8.4095, lon: 115.1889, tz: 8 },
  "马尼拉": { name: "菲律宾·马尼拉 (Manila)", en: "Manila", region: "亚洲", lat: 14.5995, lon: 120.9842, tz: 8 },
  "长滩岛": { name: "菲律宾·长滩岛 (Boracay)", en: "Boracay", region: "亚洲", lat: 11.9674, lon: 121.9248, tz: 8 },
  "河内": { name: "越南·河内 (Hanoi)", en: "Hanoi", region: "亚洲", lat: 21.0285, lon: 105.8542, tz: 7 },
  "胡志明市": { name: "越南·胡志明市 (Ho Chi Minh City)", en: "Ho Chi Minh City", region: "亚洲", lat: 10.8231, lon: 106.6297, tz: 7 },
  "岘港": { name: "越南·岘港 (Da Nang)", en: "Da Nang", region: "亚洲", lat: 16.0544, lon: 108.2022, tz: 7 },
  "金边": { name: "柬埔寨·金边 (Phnom Penh)", en: "Phnom Penh", region: "亚洲", lat: 11.5564, lon: 104.9282, tz: 7 },
  "暹粒": { name: "柬埔寨·暹粒吴哥 (Siem Reap)", en: "Siem Reap", region: "亚洲", lat: 13.3633, lon: 103.8564, tz: 7 },
  "万象": { name: "老挝·万象 (Vientiane)", en: "Vientiane", region: "亚洲", lat: 17.9757, lon: 102.6331, tz: 7 },
  "仰光": { name: "缅甸·仰光 (Yangon)", en: "Yangon", region: "亚洲", lat: 16.8409, lon: 96.1735, tz: 6.5 },
  "加德满都": { name: "尼泊尔·加德满都 (Kathmandu)", en: "Kathmandu", region: "亚洲", lat: 27.7172, lon: 85.3240, tz: 5.75 },
  "新德里": { name: "印度·新德里 (New Delhi)", en: "New Delhi", region: "亚洲", lat: 28.6139, lon: 77.2090, tz: 5.5 },
  "孟买": { name: "印度·孟买 (Mumbai)", en: "Mumbai", region: "亚洲", lat: 19.0760, lon: 72.8777, tz: 5.5 },
  "班加罗尔": { name: "印度·班加罗尔 (Bangalore)", en: "Bangalore", region: "亚洲", lat: 12.9716, lon: 77.5946, tz: 5.5 },
  "科伦坡": { name: "斯里兰卡·科伦坡 (Colombo)", en: "Colombo", region: "亚洲", lat: 6.9271, lon: 79.8612, tz: 5.5 },
  "马累": { name: "马尔代夫·马累 (Male)", en: "Male", region: "亚洲", lat: 4.1755, lon: 73.5093, tz: 5 },
  "伊斯兰堡": { name: "巴基斯坦·伊斯兰堡 (Islamabad)", en: "Islamabad", region: "亚洲", lat: 33.6844, lon: 73.0479, tz: 5 },
  "乌兰巴托": { name: "蒙古·乌兰巴托 (Ulaanbaatar)", en: "Ulaanbaatar", region: "亚洲", lat: 47.8864, lon: 106.9057, tz: 8 },
  "阿拉木图": { name: "哈萨克斯坦·阿拉木图 (Almaty)", en: "Almaty", region: "亚洲", lat: 43.2220, lon: 76.8512, tz: 5 },
  "塔什干": { name: "乌兹别克斯坦·塔什干 (Tashkent)", en: "Tashkent", region: "亚洲", lat: 41.2995, lon: 69.2401, tz: 5 },
  "迪拜": { name: "阿联酋·迪拜 (Dubai)", en: "Dubai", region: "亚洲", lat: 25.2048, lon: 55.2708, tz: 4 },
  "阿布扎比": { name: "阿联酋·阿布扎比 (Abu Dhabi)", en: "Abu Dhabi", region: "亚洲", lat: 24.4539, lon: 54.3773, tz: 4 },
  "多哈": { name: "卡塔尔·多哈 (Doha)", en: "Doha", region: "亚洲", lat: 25.2854, lon: 51.5310, tz: 3 },
  "利雅得": { name: "沙特阿拉伯·利雅得 (Riyadh)", en: "Riyadh", region: "亚洲", lat: 24.7136, lon: 46.6753, tz: 3 },
  "德黑兰": { name: "伊朗·德黑兰 (Tehran)", en: "Tehran", region: "亚洲", lat: 35.6892, lon: 51.3890, tz: 3.5 },
  "耶路撒冷": { name: "耶路撒冷 (Jerusalem)", en: "Jerusalem", region: "亚洲", lat: 31.7683, lon: 35.2137, tz: 2 },
  "特拉维夫": { name: "以色列·特拉维夫 (Tel Aviv)", en: "Tel Aviv", region: "亚洲", lat: 32.0853, lon: 34.7818, tz: 2 },
  "伊斯坦布尔": { name: "土耳其·伊斯坦布尔 (Istanbul)", en: "Istanbul", region: "亚洲", lat: 41.0082, lon: 28.9784, tz: 3 },
  "安卡拉": { name: "土耳其·安卡拉 (Ankara)", en: "Ankara", region: "亚洲", lat: 39.9334, lon: 32.8597, tz: 3 },
  "卡帕多奇亚": { name: "土耳其·卡帕多奇亚 (Cappadocia)", en: "Cappadocia", region: "亚洲", lat: 38.6431, lon: 34.8289, tz: 3 },

  // --- 国外主要城市：欧洲 ---
  "伦敦": { name: "英国·伦敦 (London)", en: "London", region: "欧洲", lat: 51.5074, lon: -0.1278, tz: 0 },
  "爱丁堡": { name: "英国·爱丁堡 (Edinburgh)", en: "Edinburgh", region: "欧洲", lat: 55.9533, lon: -3.1883, tz: 0 },
  "曼彻斯特": { name: "英国·曼彻斯特 (Manchester)", en: "Manchester", region: "欧洲", lat: 53.4808, lon: -2.2426, tz: 0 },
  "剑桥": { name: "英国·剑桥 (Cambridge)", en: "Cambridge", region: "欧洲", lat: 52.2053, lon: 0.1218, tz: 0 },
  "牛津": { name: "英国·牛津 (Oxford)", en: "Oxford", region: "欧洲", lat: 51.7520, lon: -1.2577, tz: 0 },
  "都柏林": { name: "爱尔兰·都柏林 (Dublin)", en: "Dublin", region: "欧洲", lat: 53.3498, lon: -6.2603, tz: 0 },
  "巴黎": { name: "法国·巴黎 (Paris)", en: "Paris", region: "欧洲", lat: 48.8566, lon: 2.3522, tz: 1 },
  "尼斯": { name: "法国·尼斯 (Nice)", en: "Nice", region: "欧洲", lat: 43.7102, lon: 7.2620, tz: 1 },
  "里昂": { name: "法国·里昂 (Lyon)", en: "Lyon", region: "欧洲", lat: 45.7640, lon: 4.8357, tz: 1 },
  "马赛": { name: "法国·马赛 (Marseille)", en: "Marseille", region: "欧洲", lat: 43.2965, lon: 5.3698, tz: 1 },
  "柏林": { name: "德国·柏林 (Berlin)", en: "Berlin", region: "欧洲", lat: 52.5200, lon: 13.4050, tz: 1 },
  "慕尼黑": { name: "德国·慕尼黑 (Munich)", en: "Munich", region: "欧洲", lat: 48.1351, lon: 11.5820, tz: 1 },
  "法兰克福": { name: "德国·法兰克福 (Frankfurt)", en: "Frankfurt", region: "欧洲", lat: 50.1109, lon: 8.6821, tz: 1 },
  "汉堡": { name: "德国·汉堡 (Hamburg)", en: "Hamburg", region: "欧洲", lat: 53.5511, lon: 9.9937, tz: 1 },
  "科隆": { name: "德国·科隆 (Cologne)", en: "Cologne", region: "欧洲", lat: 50.9375, lon: 6.9603, tz: 1 },
  "罗马": { name: "意大利·罗马 (Rome)", en: "Rome", region: "欧洲", lat: 41.9028, lon: 12.4964, tz: 1 },
  "米兰": { name: "意大利·米兰 (Milan)", en: "Milan", region: "欧洲", lat: 45.4642, lon: 9.1900, tz: 1 },
  "威尼斯": { name: "意大利·威尼斯 (Venice)", en: "Venice", region: "欧洲", lat: 45.4408, lon: 12.3155, tz: 1 },
  "佛罗伦萨": { name: "意大利·佛罗伦萨 (Florence)", en: "Florence", region: "欧洲", lat: 43.7696, lon: 11.2558, tz: 1 },
  "那不勒斯": { name: "意大利·那不勒斯 (Naples)", en: "Naples", region: "欧洲", lat: 40.8518, lon: 14.2681, tz: 1 },
  "马德里": { name: "西班牙·马德里 (Madrid)", en: "Madrid", region: "欧洲", lat: 40.4168, lon: -3.7038, tz: 1 },
  "巴塞罗那": { name: "西班牙·巴塞罗那 (Barcelona)", en: "Barcelona", region: "欧洲", lat: 41.3851, lon: 2.1734, tz: 1 },
  "塞维利亚": { name: "西班牙·塞维利亚 (Seville)", en: "Seville", region: "欧洲", lat: 37.3891, lon: -5.9845, tz: 1 },
  "里斯本": { name: "葡萄牙·里斯本 (Lisbon)", en: "Lisbon", region: "欧洲", lat: 38.7223, lon: -9.1393, tz: 0 },
  "波尔图": { name: "葡萄牙·波尔图 (Porto)", en: "Porto", region: "欧洲", lat: 41.1579, lon: -8.6291, tz: 0 },
  "阿姆斯特丹": { name: "荷兰·阿姆斯特丹 (Amsterdam)", en: "Amsterdam", region: "欧洲", lat: 52.3676, lon: 4.9041, tz: 1 },
  "鹿特丹": { name: "荷兰·鹿特丹 (Rotterdam)", en: "Rotterdam", region: "欧洲", lat: 51.9244, lon: 4.4777, tz: 1 },
  "布鲁塞尔": { name: "比利时·布鲁塞尔 (Brussels)", en: "Brussels", region: "欧洲", lat: 50.8503, lon: 4.3517, tz: 1 },
  "苏黎世": { name: "瑞士·苏黎世 (Zurich)", en: "Zurich", region: "欧洲", lat: 47.3769, lon: 8.5417, tz: 1 },
  "日内瓦": { name: "瑞士·日内瓦 (Geneva)", en: "Geneva", region: "欧洲", lat: 46.2044, lon: 6.1432, tz: 1 },
  "因特拉肯": { name: "瑞士·因特拉肯 (Interlaken)", en: "Interlaken", region: "欧洲", lat: 46.6863, lon: 7.8632, tz: 1 },
  "维也纳": { name: "奥地利·维也纳 (Vienna)", en: "Vienna", region: "欧洲", lat: 48.2082, lon: 16.3738, tz: 1 },
  "萨尔茨堡": { name: "奥地利·萨尔茨堡 (Salzburg)", en: "Salzburg", region: "欧洲", lat: 47.8095, lon: 13.0550, tz: 1 },
  "布拉格": { name: "捷克·布拉格 (Prague)", en: "Prague", region: "欧洲", lat: 50.0755, lon: 14.4378, tz: 1 },
  "布达佩斯": { name: "匈牙利·布达佩斯 (Budapest)", en: "Budapest", region: "欧洲", lat: 47.4979, lon: 19.0402, tz: 1 },
  "华沙": { name: "波兰·华沙 (Warsaw)", en: "Warsaw", region: "欧洲", lat: 52.2297, lon: 21.0122, tz: 1 },
  "雅典": { name: "希腊·雅典 (Athens)", en: "Athens", region: "欧洲", lat: 37.9838, lon: 23.7275, tz: 2 },
  "圣托里尼": { name: "希腊·圣托里尼 (Santorini)", en: "Santorini", region: "欧洲", lat: 36.3932, lon: 25.4615, tz: 2 },
  "斯德哥尔摩": { name: "瑞典·斯德哥尔摩 (Stockholm)", en: "Stockholm", region: "欧洲", lat: 59.3293, lon: 18.0686, tz: 1 },
  "哥本哈根": { name: "丹麦·哥本哈根 (Copenhagen)", en: "Copenhagen", region: "欧洲", lat: 55.6761, lon: 12.5683, tz: 1 },
  "奥斯陆": { name: "挪威·奥斯陆 (Oslo)", en: "Oslo", region: "欧洲", lat: 59.9139, lon: 10.7522, tz: 1 },
  "特罗姆瑟": { name: "挪威·特罗姆瑟 (Tromso)", en: "Tromso", region: "欧洲", lat: 69.6492, lon: 18.9553, tz: 1 },
  "赫尔辛基": { name: "芬兰·赫尔辛基 (Helsinki)", en: "Helsinki", region: "欧洲", lat: 60.1699, lon: 24.9384, tz: 2 },
  "雷克雅未克": { name: "冰岛·雷克雅未克 (Reykjavik)", en: "Reykjavik", region: "欧洲", lat: 64.1466, lon: -21.9426, tz: 0 },
  "莫斯科": { name: "俄罗斯·莫斯科 (Moscow)", en: "Moscow", region: "欧洲", lat: 55.7558, lon: 37.6173, tz: 3 },
  "圣彼得堡": { name: "俄罗斯·圣彼得堡 (Saint Petersburg)", en: "Saint Petersburg", region: "欧洲", lat: 59.9343, lon: 30.3351, tz: 3 },
  "海参崴": { name: "俄罗斯·符拉迪沃斯托克 (Vladivostok)", en: "Vladivostok", region: "亚洲", lat: 43.1155, lon: 131.8855, tz: 10 },

  // --- 国外主要城市：北美洲与南美洲 ---
  "纽约": { name: "美国·纽约 (New York)", en: "New York", region: "美洲", lat: 40.7128, lon: -74.0060, tz: -5 },
  "洛杉矶": { name: "美国·洛杉矶 (Los Angeles)", en: "Los Angeles", region: "美洲", lat: 34.0522, lon: -118.2437, tz: -8 },
  "旧金山": { name: "美国·旧金山 (San Francisco)", en: "San Francisco", region: "美洲", lat: 37.7749, lon: -122.4194, tz: -8 },
  "西雅图": { name: "美国·西雅图 (Seattle)", en: "Seattle", region: "美洲", lat: 47.6062, lon: -122.3321, tz: -8 },
  "芝加哥": { name: "美国·芝加哥 (Chicago)", en: "Chicago", region: "美洲", lat: 41.8781, lon: -87.6298, tz: -6 },
  "波士顿": { name: "美国·波士顿 (Boston)", en: "Boston", region: "美洲", lat: 42.3601, lon: -71.0589, tz: -5 },
  "华盛顿": { name: "美国·华盛顿 (Washington D.C.)", en: "Washington", region: "美洲", lat: 38.9072, lon: -77.0369, tz: -5 },
  "迈阿密": { name: "美国·迈阿密 (Miami)", en: "Miami", region: "美洲", lat: 25.7617, lon: -80.1918, tz: -5 },
  "拉斯维加斯": { name: "美国·拉斯维加斯 (Las Vegas)", en: "Las Vegas", region: "美洲", lat: 36.1699, lon: -115.1398, tz: -8 },
  "圣地亚哥": { name: "美国·圣迭戈 (San Diego)", en: "San Diego", region: "美洲", lat: 32.7157, lon: -117.1611, tz: -8 },
  "休斯顿": { name: "美国·休斯顿 (Houston)", en: "Houston", region: "美洲", lat: 29.7604, lon: -95.3698, tz: -6 },
  "檀香山": { name: "美国·夏威夷檀香山 (Honolulu)", en: "Honolulu", region: "美洲", lat: 21.3069, lon: -157.8583, tz: -10 },
  "温哥华": { name: "加拿大·温哥华 (Vancouver)", en: "Vancouver", region: "美洲", lat: 49.2827, lon: -123.1207, tz: -8 },
  "多伦多": { name: "加拿大·多伦多 (Toronto)", en: "Toronto", region: "美洲", lat: 43.6532, lon: -79.3832, tz: -5 },
  "蒙特利尔": { name: "加拿大·蒙特利尔 (Montreal)", en: "Montreal", region: "美洲", lat: 45.5017, lon: -73.5673, tz: -5 },
  "渥太华": { name: "加拿大·渥太华 (Ottawa)", en: "Ottawa", region: "美洲", lat: 45.4215, lon: -75.6972, tz: -5 },
  "卡尔加里": { name: "加拿大·卡尔加里 (Calgary)", en: "Calgary", region: "美洲", lat: 51.0447, lon: -114.0719, tz: -7 },
  "班夫": { name: "加拿大·班夫国家公园 (Banff)", en: "Banff", region: "美洲", lat: 51.1784, lon: -115.5708, tz: -7 },
  "墨西哥城": { name: "墨西哥·墨西哥城 (Mexico City)", en: "Mexico City", region: "美洲", lat: 19.4326, lon: -99.1332, tz: -6 },
  "坎昆": { name: "墨西哥·坎昆 (Cancun)", en: "Cancun", region: "美洲", lat: 21.1619, lon: -86.8515, tz: -5 },
  "哈瓦那": { name: "古巴·哈瓦那 (Havana)", en: "Havana", region: "美洲", lat: 23.1136, lon: -82.3666, tz: -5 },
  "里约热内卢": { name: "巴西·里约热内卢 (Rio de Janeiro)", en: "Rio de Janeiro", region: "美洲", lat: -22.9068, lon: -43.1729, tz: -3 },
  "圣保罗": { name: "巴西·圣保罗 (Sao Paulo)", en: "Sao Paulo", region: "美洲", lat: -23.5505, lon: -46.6333, tz: -3 },
  "布宜诺斯艾利斯": { name: "阿根廷·布宜诺斯艾利斯 (Buenos Aires)", en: "Buenos Aires", region: "美洲", lat: -34.6037, lon: -58.3816, tz: -3 },
  "乌斯怀亚": { name: "阿根廷·乌斯怀亚 (Ushuaia)", en: "Ushuaia", region: "美洲", lat: -54.8019, lon: -68.3030, tz: -3 },
  "智利圣地亚哥": { name: "智利·圣地亚哥 (Santiago)", en: "Santiago", region: "美洲", lat: -33.4489, lon: -70.6693, tz: -4 },
  "利马": { name: "秘鲁·利马 (Lima)", en: "Lima", region: "美洲", lat: -12.0464, lon: -77.0428, tz: -5 },
  "库斯科": { name: "秘鲁·库斯科 (Cusco)", en: "Cusco", region: "美洲", lat: -13.5320, lon: -71.9675, tz: -5 },
  "波哥大": { name: "哥伦比亚·波哥大 (Bogota)", en: "Bogota", region: "美洲", lat: 4.7110, lon: -74.0721, tz: -5 },

  // --- 国外主要城市：大洋洲与非洲 ---
  "悉尼": { name: "澳大利亚·悉尼 (Sydney)", en: "Sydney", region: "大洋洲与非洲", lat: -33.8688, lon: 151.2093, tz: 10 },
  "墨尔本": { name: "澳大利亚·墨尔本 (Melbourne)", en: "Melbourne", region: "大洋洲与非洲", lat: -37.8136, lon: 144.9631, tz: 10 },
  "布里斯班": { name: "澳大利亚·布里斯班 (Brisbane)", en: "Brisbane", region: "大洋洲与非洲", lat: -27.4705, lon: 153.0260, tz: 10 },
  "珀斯": { name: "澳大利亚·珀斯 (Perth)", en: "Perth", region: "大洋洲与非洲", lat: -31.9505, lon: 115.8605, tz: 8 },
  "阿德莱德": { name: "澳大利亚·阿德莱德 (Adelaide)", en: "Adelaide", region: "大洋洲与非洲", lat: -34.9285, lon: 138.6007, tz: 9.5 },
  "黄金海岸": { name: "澳大利亚·黄金海岸 (Gold Coast)", en: "Gold Coast", region: "大洋洲与非洲", lat: -28.0167, lon: 153.4000, tz: 10 },
  "霍巴特": { name: "澳大利亚·塔斯马尼亚霍巴特 (Hobart)", en: "Hobart", region: "大洋洲与非洲", lat: -42.8821, lon: 147.3272, tz: 10 },
  "奥克兰": { name: "新西兰·奥克兰 (Auckland)", en: "Auckland", region: "大洋洲与非洲", lat: -36.8485, lon: 174.7633, tz: 12 },
  "皇后镇": { name: "新西兰·皇后镇 (Queenstown)", en: "Queenstown", region: "大洋洲与非洲", lat: -45.0312, lon: 168.6626, tz: 12 },
  "基督城": { name: "新西兰·基督城 (Christchurch)", en: "Christchurch", region: "大洋洲与非洲", lat: -43.5321, lon: 172.6362, tz: 12 },
  "惠灵顿": { name: "新西兰·惠灵顿 (Wellington)", en: "Wellington", region: "大洋洲与非洲", lat: -41.2865, lon: 174.7762, tz: 12 },
  "苏瓦": { name: "斐济·苏瓦 (Suva)", en: "Suva", region: "大洋洲与非洲", lat: -18.1416, lon: 178.4419, tz: 12 },
  "开罗": { name: "埃及·开罗 (Cairo)", en: "Cairo", region: "大洋洲与非洲", lat: 30.0444, lon: 31.2357, tz: 2 },
  "卢克索": { name: "埃及·卢克索 (Luxor)", en: "Luxor", region: "大洋洲与非洲", lat: 25.6872, lon: 32.6396, tz: 2 },
  "卡萨布兰卡": { name: "摩洛哥·卡萨布兰卡 (Casablanca)", en: "Casablanca", region: "大洋洲与非洲", lat: 33.5731, lon: -7.5898, tz: 1 },
  "马拉喀什": { name: "摩洛哥·马拉喀什 (Marrakech)", en: "Marrakech", region: "大洋洲与非洲", lat: 31.6295, lon: -7.9811, tz: 1 },
  "开普敦": { name: "南非·开普敦 (Cape Town)", en: "Cape Town", region: "大洋洲与非洲", lat: -33.9249, lon: 18.4241, tz: 2 },
  "约翰内斯堡": { name: "南非·约翰内斯堡 (Johannesburg)", en: "Johannesburg", region: "大洋洲与非洲", lat: -26.2041, lon: 28.0473, tz: 2 },
  "内罗毕": { name: "肯尼亚·内罗毕 (Nairobi)", en: "Nairobi", region: "大洋洲与非洲", lat: -1.2921, lon: 36.8219, tz: 3 },
  "达累斯萨拉姆": { name: "坦桑尼亚·达累斯萨拉姆 (Dar es Salaam)", en: "Dar es Salaam", region: "大洋洲与非洲", lat: -6.7924, lon: 39.2083, tz: 3 },
  "路易港": { name: "毛里求斯·路易港 (Port Louis)", en: "Port Louis", region: "大洋洲与非洲", lat: -20.1609, lon: 57.5012, tz: 4 }
};

function formatCoordText(lat, lon) {
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
  return `${latStr}, ${lonStr}`;
}

const DAY_WEEK_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const FORECAST_DAYS = 7;          // v2.0：预报周期由 3 天扩展至 7 天
const NOTIFY_DAYS = 3;            // 安卓本地提醒仍只覆盖前 3 天

function getSlotMetas(dayCount) {
  const shortNames = ["今天", "明天", "后天"];
  const metas = [];
  const base = new Date();
  for (let d = 0; d < dayCount; d++) {
    const dt = new Date(base.getTime() + d * 86400000);
    const dateStr = `${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    const dayLabel = d < 3 ? shortNames[d] : DAY_WEEK_CN[dt.getDay()];
    metas.push({
      key: `d${d}_am`, dayIdx: d, dayLabel, dateStr, dateMs: dt.getTime(),
      type: "am", typeName: "朝霞", icon: "🌅"
    });
    metas.push({
      key: `d${d}_pm`, dayIdx: d, dayLabel, dateStr, dateMs: dt.getTime(),
      type: "pm", typeName: "晚霞", icon: "🌇"
    });
  }
  return metas;
}
const SLOT_METAS = getSlotMetas(FORECAST_DAYS);

function estimateSunTime(lon, type, tzOffset) {
  const stdMeridian = (typeof tzOffset === "number") ? (tzOffset * 15) : (Math.round(lon / 15) * 15);
  const offsetMin = Math.round((stdMeridian - lon) * 4);
  const baseMin = type === "am" ? (5 * 60 + 56) : (17 * 60 + 32);
  const totalMin = baseMin + offsetMin;
  const hh = String(Math.floor((totalMin + 1440) % 1440 / 60)).padStart(2, "0");
  const mm = String((totalMin + 1440) % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/* ---------------- 真实太阳方位（轻量天文算法，纯 JS 无外部依赖） ----------------
 * 固定方位角（朝霞 82° / 晚霞 262°）在秋冬会让 100/250/400km 光路采样点整体偏离
 * 太阳真实入射轴 10°~20°：北半球秋分前后日落方位约 240°~250°，夏至前后约 295°~305°。
 * 这里按「目标经纬度 + 当天日期」实时求解：
 *   δ 太阳赤纬（Spencer 傅里叶级数，误差 < 0.1°）
 *   H0 日出/日落时角 = acos((cos 90.833° − sinφ·sinδ) / (cosφ·cosδ))
 *   由 H、δ、φ 反解方位角（从正北顺时针，东=90°、南=180°、西=270°）。
 */
function sunDeclinationRad(dayOfYear) {
  const g = 2 * Math.PI / 365 * (dayOfYear - 1 + 0.5);
  return 0.006918
    - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
    - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
}

function sunEventPosition(lat, dateMs, isMorning) {
  const dt = new Date(dateMs);
  // 用当地日历日（而非毫秒差）计算年内第几天，避免时区偏移导致整体错一天
  const dayOfYear = Math.floor(
    (Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) - Date.UTC(dt.getFullYear(), 0, 1)) / 86400000
  ) + 1;
  const dec = sunDeclinationRad(dayOfYear);
  const latR = lat * Math.PI / 180;
  const cosH = (Math.cos(90.833 * Math.PI / 180) - Math.sin(latR) * Math.sin(dec))
             / (Math.cos(latR) * Math.cos(dec));
  // |cosH| > 1：极昼 / 极夜，当天没有日出日落，退化为正午方位（北半球约 180°）
  const polar = Math.abs(cosH) > 1;
  const H0 = Math.acos(Math.max(-1, Math.min(1, cosH)));
  const H = isMorning ? -H0 : H0;
  const alt = Math.asin(Math.sin(latR) * Math.sin(dec) + Math.cos(latR) * Math.cos(dec) * Math.cos(H));
  // atan2 得到「从南起算、向西为正」的方位角，+180° 转成从正北顺时针
  let az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(latR) - Math.tan(dec) * Math.cos(latR));
  az = (az * 180 / Math.PI + 180 + 360) % 360;
  return { azimuth: az, altitude: alt * 180 / Math.PI, polar: polar };
}

/* 方位角 → 「西偏南 244°」式中文描述（就近取四正方向 + 偏角） */
function formatAzimuth(deg) {
  const d = ((deg % 360) + 360) % 360;
  const cards = [
    { deg: 0, name: "北", cw: "偏东", ccw: "偏西" },
    { deg: 90, name: "东", cw: "偏南", ccw: "偏北" },
    { deg: 180, name: "南", cw: "偏西", ccw: "偏东" },
    { deg: 270, name: "西", cw: "偏北", ccw: "偏南" }
  ];
  let best = cards[0], delta = 360;
  cards.forEach(function (c) {
    const t = ((d - c.deg + 540) % 360) - 180;
    if (Math.abs(t) < Math.abs(delta)) { delta = t; best = c; }
  });
  const tail = Math.abs(delta) < 1.5 ? "" : (delta > 0 ? best.cw : best.ccw);
  return best.name + tail + " " + Math.round(d) + "°";
}

/* 取某时段（朝霞 / 晚霞）在当前城市的真实太阳方位；altitude 为地平纬度角 */
function slotSunInfo(meta, city) {
  const c = city || currentCityData;
  if (!meta || !c) return { azimuth: 262, altitude: 0, text: "--", polar: false };
  const pos = sunEventPosition(c.lat, meta.dateMs || Date.now(), meta.type === "am");
  return { azimuth: pos.azimuth, altitude: pos.altitude, text: formatAzimuth(pos.azimuth), polar: pos.polar };
}

/** 逆地理失败时的展示城市名：以纯坐标呈现，避免因无法解析地名而中断预报流程。 */
function formatCoordLabel(lat, lon) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `当前位置 (${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lon).toFixed(2)}°${ew})`;
}

// ==================== 3. 全局状态与带超时熔断的请求工具 ====================
let currentCityData = null;
// 定位城市：仅由定位流程（前台 GPS / 后台无界面）写入，是提醒任务的唯一数据源；
// 手动搜索只更新 currentCityData 用于页面展示，不触碰此变量，避免覆盖定位位置的提醒。
let locatedCity = null;
let searchSeq = 0;   // 请求序号：防止旧请求返回后覆盖用户已发起的新查询
// B：同城同日气象结果缓存（键 = 经纬度 + 日期），上限 32 条，超出按插入顺序淘汰最旧
const WEATHER_CACHE = {};
let selectedSlotKey = "d0_pm";
let eventFilter = "all";
let canvasMode = "sky";

async function fetchJsonWithTimeout(url, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    return await resp.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/** 单数据源带重试请求：仅对失败的重发，成功即返回；单次超时 4500ms，默认最多尝试 2 次。 */
async function fetchSourceWithRetry(url, timeoutMs = 4500, attempts = 2) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try { return await fetchJsonWithTimeout(url, timeoutMs); }
    catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("fetch failed");
}

// ==================== 4. 城市匹配（含国内外中英文名录）与数据拉取主流程 ====================

/** IANA 时区名 → 当前（含夏令时）UTC 偏移小时数；解析失败返回 null，由调用方退回经度估算。 */
function tzOffsetFromIana(iana) {
  if (!iana) return null;
  try {
    const now = new Date();
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: iana, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    const p = {};
    dtf.formatToParts(now).forEach((part) => { p[part.type] = part.value; });
    const asUTC = Date.UTC(
      Number(p.year), Number(p.month) - 1, Number(p.day),
      Number(p.hour) === 24 ? 0 : Number(p.hour), Number(p.minute), Number(p.second)
    );
    const offsetHours = (asUTC - Math.floor(now.getTime() / 1000) * 1000) / 3600000;
    if (!Number.isFinite(offsetHours)) return null;
    // 归一到 0.25 小时粒度，兼容 5:45 / 5:30 / 9:30 等特殊时区
    return Math.round(offsetHours * 4) / 4;
  } catch (e) {
    return null;
  }
}

/** 从 geocoding 多候选中挑最可能的主城：以人口为主、行政级别为辅的综合评分。
    人口占绝对权重，避免把同名小镇排在大城市之前；行政级别只做小幅加成
    （注意 PPLA2/PPLA3 等行政区首府编码也常见于大城市，不能仅按编码分级排序）。 */
function pickBestGeoHit(results) {
  const adminBonus = (code) => {
    if (!code) return 0;
    if (code === "PPLC" || code === "PPLG") return 200000;   // 首都 / 国家政府所在地
    if (code.startsWith("PPLA")) return 100000;              // PPLA / PPLA2 / PPLA3 / PPLA4 行政首府
    return 0;
  };
  const score = (r) => (r.population || 0) + adminBonus(r.feature_code);
  return results.slice().sort((a, b) => score(b) - score(a))[0];
}

/** geocoding 结果缓存（localStorage 持久化，最多 64 条，仅缓存成功结果，避免网络瞬断污染缓存）。 */
const GEO_CACHE_KEY = "sunset-geo-cache-v2";   // v2：候选排序与低置信标记语义变更，避免命中旧缓存
const GEO_CACHE = (() => {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
})();

function geoCacheSet(k, v) {
  GEO_CACHE[k] = v;
  try {
    const keys = Object.keys(GEO_CACHE);
    if (keys.length > 64) delete GEO_CACHE[keys[0]];
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(GEO_CACHE));
  } catch (e) {}
}

/** 在线地名解析：zh / en 两种语言各取 10 条候选，合并去重后统一按综合评分排序，回填真实时区。
    说明：Open-Meteo 中文地名库对国外城市很稀疏，且中文串仅 language=zh 可匹配，
    故这里不再"命中即返回"，改为两语言候选并集统一评分，避免被单条低质量中文词条锁死。
    命中为普通居民点且人口极低时打 lowConfidence 标记，供上层提示用户改用英文名。 */
async function queryGeocoding(clean) {
  const hasCJK = /[\u3400-\u9FFF]/.test(clean);
  const langs = hasCJK ? ["zh", "en"] : ["en", "zh"];
  const pool = [];
  const seen = new Set();
  for (let i = 0; i < langs.length; i++) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=10&language=${langs[i]}&format=json`;
      const resp = await fetchJsonWithTimeout(url, 8000);
      const list = (resp && Array.isArray(resp.results)) ? resp.results : [];
      list.forEach((r) => {
        if (!r || typeof r.latitude !== "number" || typeof r.longitude !== "number") return;
        const key = `${r.latitude.toFixed(2)},${r.longitude.toFixed(2)}`;   // 同一地点不同语言视为同一条
        if (seen.has(key)) return;
        seen.add(key);
        pool.push(r);
      });
    } catch (err) {}
  }
  if (pool.length === 0) return null;

  const hit = pickBestGeoHit(pool);
  const countryPrefix = hit.country ? `${hit.country}·` : "";
  const tz = tzOffsetFromIana(hit.timezone);
  return {
    name: `${countryPrefix}${hit.name}` + (hit.admin1 ? ` (${hit.admin1})` : ""),
    lat: Number(hit.latitude.toFixed(4)),
    lon: Number(hit.longitude.toFixed(4)),
    // 优先使用地名库返回的官方时区；缺失时退回经度估算
    tz: (tz === null || tz === undefined) ? Math.round(hit.longitude / 15) : tz,
    // 低置信标记：中文输入 + 命中为普通居民点且人口极低 → 疑似中文译名撞上同名小地方
    lowConfidence: hasCJK && hit.feature_code === "PPL" && (hit.population || 0) < 25000
  };
}

async function resolveCityCoordinates(rawQuery) {
  const raw = rawQuery.trim();
  if (!raw) return null;

  // 去掉「国家·」前缀与「 (省/州)」后缀，使收藏城市回填的展示名
  // （如「中国·景德镇 (江西)」）也能被正确二次搜索
  const clean = raw.replace(/^[^·]{0,8}·/, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (!clean) return null;

  const normalized = clean.replace(/(市|地区|特别行政区|白族自治州|哈萨克自治州|藏族羌族自治州|藏族自治州|傣族自治州|自治州|区|县)$/g, "");

  // ① 内置字典精确命中（原名 / 去后缀名）
  if (CITY_COORDS_DB[clean]) return CITY_COORDS_DB[clean];
  if (CITY_COORDS_DB[normalized]) return CITY_COORDS_DB[normalized];

  // ② 英文名精确命中
  const lowerClean = clean.toLowerCase();
  for (const key of Object.keys(CITY_COORDS_DB)) {
    const item = CITY_COORDS_DB[key];
    if (item.en && item.en.toLowerCase() === lowerClean) return item;
  }

  // ③ 交由 Open-Meteo 权威地名库解析（避免本地模糊匹配把「北海道」劫持成「北海」）
  //    国际城市优先走在线解析：双语候选合并排序 + 真实时区 + 结果缓存；低置信命中会带标记返回
  const geoKey = clean.toLowerCase();
  let geoHit = GEO_CACHE[geoKey] || null;
  if (!geoHit) {
    geoHit = await queryGeocoding(clean);
    if (geoHit) geoCacheSet(geoKey, geoHit);
  }
  if (geoHit) return geoHit;

  // ④ 最后兜底：仅接受「前缀匹配」，且输入至少 2 个字符；
  //    不再使用 clean.includes(key) / item.name.includes(...)，避免子串劫持与国名误命中
  if (normalized.length >= 2) {
    for (const key of Object.keys(CITY_COORDS_DB)) {
      const item = CITY_COORDS_DB[key];
      if (key.startsWith(normalized) || (item.en && item.en.toLowerCase().startsWith(lowerClean))) {
        return item;
      }
    }
  }
  return null;
}

function calcRayPoint(lat, lon, distKm, azimuthDeg) {
  const R = 6371.0;
  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const azRad = azimuthDeg * Math.PI / 180;
  const d = distKm / R;

  const rLat = Math.asin(Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(azRad));
  const rLon = lonRad + Math.atan2(Math.sin(azRad) * Math.sin(d) * Math.cos(latRad), Math.cos(d) - Math.sin(latRad) * Math.sin(rLat));
  return { lat: (rLat * 180 / Math.PI).toFixed(4), lon: (rLon * 180 / Math.PI).toFixed(4) };
}

function calcRemoteBlockFromModel(lowC, midC) {
  const lowBlock = (lowC ?? 15) * 0.78;
  const thickMidBlock = Math.max(0, (midC ?? 20) - 25) * 0.50;
  return Math.min(100, Math.round(lowBlock + thickMidBlock));
}

function buildDeterministicCitySlots(lat, lon) {
  const slots = {};
  const seedBase = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453);
  SLOT_METAS.forEach((m, idx) => {
    const h1 = ((seedBase * (idx + 1.3)) % 1);
    const h2 = ((seedBase * (idx + 2.7)) % 1);
    const h3 = ((seedBase * (idx + 4.1)) % 1);

    const gfs_h = Math.round(14 + h1 * 62);
    const gfs_m = Math.round(12 + h2 * 52);
    const gfs_l = Math.round(4 + Math.pow(h3, 1.45) * 55);
    const ec_h  = Math.min(100, Math.max(0, gfs_h + Math.round((h2 - 0.5) * 12)));
    const ec_m  = Math.min(100, Math.max(0, gfs_m + Math.round((h3 - 0.5) * 10)));
    const ec_l  = Math.min(100, Math.max(0, gfs_l + Math.round((h1 - 0.5) * 10)));

    const rem_100 = calcRemoteBlockFromModel(ec_l, ec_m);
    const rem_250 = calcRemoteBlockFromModel(Math.round(ec_l * 0.75 + h2 * 14), ec_m);
    const rem_400 = calcRemoteBlockFromModel(Math.round(h3 * 32), Math.round(ec_m * 0.80));
    const aod = Number((0.12 + (lon > 105 ? 0.14 : 0.04) + h2 * 0.22).toFixed(2));
    const rh  = Math.round(45 + (Math.abs(lat) < 32 ? 15 : 5) + h3 * 25);

    slots[m.key] = {
      gfs_h, gfs_m, gfs_l, ec_h, ec_m, ec_l,
      rem_100, rem_250, rem_400, aod, rh,
      updatedAt: new Date().toLocaleTimeString()
    };
  });
  return slots;
}

function quickSelectCity(cityKey) {
  const inputEl = document.getElementById("cityInput");
  inputEl.value = cityKey;
  handleCitySearch();
}

/* isLocate：仅 GPS 定位流程传入 true，用于区分「定位城市」与「收藏城市」，
   保证安卓提醒始终以定位位置为准，不被收藏城市覆盖。 */
async function handleCitySearch(ev, presetCity, isLocate) {
  if (ev && ev.preventDefault) ev.preventDefault();
  const inputEl = document.getElementById("cityInput");
  const btn = document.getElementById("searchBtn");
  const query = inputEl.value.trim();
  const mySeq = ++searchSeq;   // 本次请求序号：旧请求返回后会被下面的校验丢弃

  // 分支 1：未输入城市名称（且无预置坐标）-> 不渲染后三天预测结果
  if (!presetCity && !query) {
    currentCityData = null;
    showEmptyOrErrorState(
      "🌇",
      "未输入城市名称，暂不展示火烧云预测结果",
      "请在上方输入框中输入有效的国内外城市名称，系统匹配地理坐标后将自动拉取 GFS/EC 模型数据并渲染未来七天预报。",
      false
    );
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ 正在匹配城市并拉取模型...";

  // 定位完成时由 GPS 精确坐标直接进入本流程（presetCity 已给定，跳过地名匹配）；
  // 手动输入才走地名解析。await 返回后先校验序号，避免被更新的请求覆盖。
  const matched = presetCity || await resolveCityCoordinates(query);
  if (mySeq !== searchSeq) return;

  // 分支 2：城市匹配失败 -> 不渲染后三天预测结果
  if (!matched) {
    currentCityData = null;
    btn.disabled = false;
    btn.innerText = "匹配城市并生成预报";
    showEmptyOrErrorState(
      "⚠️",
      `未匹配到城市「${query}」的地理坐标`,
      "系统无法识别该城市名称，已终止气象模型拉取并隐藏未来七天火烧云预测面板。请检查拼写；国际城市可改用英文名（例：New York）查询。",
      true
    );
    return;
  }

  // 分支 3：城市匹配成功 -> 拉取该城市 GFS + EC + CAMS 数据
  // 光路采样点沿「真实太阳入射轴」布置：按该经纬度 + 今天日期求解日出 / 日落方位角
  // （7 天窗口内赤纬变化 < 1°，方位漂移 < 3°，远小于 100km 采样间距）
  const amAz = sunEventPosition(matched.lat, Date.now(), true).azimuth;
  const pmAz = sunEventPosition(matched.lat, Date.now(), false).azimuth;
  const e100 = calcRayPoint(matched.lat, matched.lon, 100, amAz);
  const e250 = calcRayPoint(matched.lat, matched.lon, 250, amAz);
  const e400 = calcRayPoint(matched.lat, matched.lon, 400, amAz);
  const w100 = calcRayPoint(matched.lat, matched.lon, 100, pmAz);
  const w250 = calcRayPoint(matched.lat, matched.lon, 250, pmAz);
  const w400 = calcRayPoint(matched.lat, matched.lon, 400, pmAz);

  const lats = [matched.lat, e100.lat, e250.lat, e400.lat, w100.lat, w250.lat, w400.lat].join(",");
  const lons = [matched.lon, e100.lon, e250.lon, e400.lon, w100.lon, w250.lon, w400.lon].join(",");

  let slots = {};
  let sourceLabel = "Open-Meteo GFS + ECMWF + CAMS 实时API";
  let degraded = false;

  // B：同城同日缓存 —— 同一城市在同一天内重复点击直接复用上次结果，保证两次结果一致
  const cacheDay = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const cacheKey = `${matched.lat},${matched.lon},${cacheDay}`;
  const cached = WEATHER_CACHE[cacheKey];
  if (cached) {
    slots = JSON.parse(JSON.stringify(cached.slots));
    sourceLabel = cached.sourceLabel;
    degraded = cached.degraded;
  } else {
  try {
    const gfsUrl = `https://api.open-meteo.com/v1/gfs?latitude=${matched.lat}&longitude=${matched.lon}&hourly=cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m,precipitation_probability,weather_code&forecast_days=7&timezone=auto`;
    const ecUrl  = `https://api.open-meteo.com/v1/ecmwf?latitude=${lats}&longitude=${lons}&hourly=cloud_cover_low,cloud_cover_mid,cloud_cover_high&forecast_days=7&timezone=auto`;
    const aodUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${matched.lat}&longitude=${matched.lon}&hourly=aerosol_optical_depth&forecast_days=7&timezone=auto`;

    // A：三个数据源互不牵连 —— 各自成功各自使用，单个失败只降级该源，不拖垮其余两个
    // 每个数据源各自独立重试（只重发失败的那一个，已成功的不再重复请求），
    // 单次超时 4500ms：既能覆盖首屏冷启动建连开销，又避免最坏情况长时间阻塞。
    const [gfsS, ecS, aodS] = await Promise.allSettled([
      fetchSourceWithRetry(gfsUrl, 4500, 2),
      fetchSourceWithRetry(ecUrl, 4500, 2),
      fetchSourceWithRetry(aodUrl, 4500, 2)
    ]);
    const gfsResp = gfsS.status === "fulfilled" ? gfsS.value : null;
    const ecResp  = ecS.status === "fulfilled" ? ecS.value : null;
    const aodResp = aodS.status === "fulfilled" ? aodS.value : null;

    const gfsH = (gfsResp && gfsResp.hourly) || {};
    const ecArr = ecResp ? (Array.isArray(ecResp) ? ecResp : [ecResp]) : [];
    const ecLocal = ecArr[0]?.hourly || {};
    const aodH = (aodResp && aodResp.hourly) || {};

    if (!gfsH.cloud_cover_high && !ecLocal.cloud_cover_high && !aodH.aerosol_optical_depth) {
      throw new Error("Empty hourly payload");
    }

    // E：逐源标记降级，缺失字段仍由下方 ??.默认值 兜底（行为与原逻辑一致）
    if (!gfsH.cloud_cover_high) degraded = true;
    if (!ecLocal.cloud_cover_high) degraded = true;
    if (!aodH.aerosol_optical_depth) degraded = true;

    SLOT_METAS.forEach(m => {
      // 采样时刻改用当地实际日出 / 日落小时（西部与高纬城市不能用固定的 06:00 / 18:00）
      const sunHourRaw = parseInt(estimateSunTime(matched.lon, m.type, matched.tz).split(":")[0], 10);
      const sunHour = Number.isFinite(sunHourRaw) ? Math.min(23, Math.max(0, sunHourRaw)) : (m.type === "am" ? 6 : 18);
      const hrIdx = m.dayIdx * 24 + sunHour;
      const p100 = (ecArr[m.type === "am" ? 1 : 4]?.hourly) || ecLocal;
      const p250 = (ecArr[m.type === "am" ? 2 : 5]?.hourly) || ecLocal;
      const p400 = (ecArr[m.type === "am" ? 3 : 6]?.hourly) || ecLocal;

      const r100 = calcRemoteBlockFromModel(p100.cloud_cover_low?.[hrIdx], p100.cloud_cover_mid?.[hrIdx]);
      const r250 = calcRemoteBlockFromModel(p250.cloud_cover_low?.[hrIdx], p250.cloud_cover_mid?.[hrIdx]);
      const r400 = calcRemoteBlockFromModel(p400.cloud_cover_low?.[hrIdx], p400.cloud_cover_mid?.[hrIdx]);

      slots[m.key] = {
        gfs_h: Math.round(gfsH.cloud_cover_high?.[hrIdx] ?? 35),
        gfs_m: Math.round(gfsH.cloud_cover_mid?.[hrIdx] ?? 28),
        gfs_l: Math.round(gfsH.cloud_cover_low?.[hrIdx] ?? 18),
        ec_h:  Math.round(ecLocal.cloud_cover_high?.[hrIdx] ?? 38),
        ec_m:  Math.round(ecLocal.cloud_cover_mid?.[hrIdx] ?? 30),
        ec_l:  Math.round(ecLocal.cloud_cover_low?.[hrIdx] ?? 16),
        rem_100: r100, rem_250: r250, rem_400: r400,
        aod:   Number((aodH.aerosol_optical_depth?.[hrIdx] ?? 0.26).toFixed(2)),
        rh:    Math.round(gfsH.relative_humidity_2m?.[hrIdx] ?? 64),
        // 降水概率 / WMO 天气现象码：交给评分引擎做「一票否决」熔断
        pop:   Math.round(gfsH.precipitation_probability?.[hrIdx] ?? 0),
        wx:    Math.round(gfsH.weather_code?.[hrIdx] ?? 0),
        updatedAt: new Date().toLocaleTimeString()
      };
    });
  } catch (e) {
    slots = buildDeterministicCitySlots(matched.lat, matched.lon);
    sourceLabel = "GFS + ECMWF + CAMS 网格基准数据";
    degraded = true;
  }
    // 仅缓存未降级的真实结果，避免把降级数据固化给后续点击
    if (!degraded) {
      WEATHER_CACHE[cacheKey] = { slots: JSON.parse(JSON.stringify(slots)), sourceLabel, degraded };
      const ck = Object.keys(WEATHER_CACHE);
      if (ck.length > 32) delete WEATHER_CACHE[ck[0]];
    }
  }

  // 气象数据返回后再校验一次序号：若用户已发起新查询，则丢弃本次结果
  if (mySeq !== searchSeq) return;

  currentCityData = {
    name: matched.name,
    lat: matched.lat,
    lon: matched.lon,
    tz: matched.tz,
    slots,
    sourceLabel,
    degraded,
    lowConfidence: matched.lowConfidence === true
  };

  // 定位流程（前台 GPS / 后台无界面给定）单独记录「定位城市」；
  // 手动搜索与收藏城市不写这里，因此其数据只用于页面展示，不会覆盖定位位置的提醒任务。
  if (presetCity && isLocate) locatedCity = JSON.parse(JSON.stringify(currentCityData));

  btn.disabled = false;
  btn.innerText = "🔍 匹配城市并生成预报";
  renderForecastDashboard();
}

/* ---------------- 骨架屏：预报区骨架已移除，骨架仅代表页面资源加载 ----------------
 * 旧逻辑曾在城市匹配 / 气象数据拉取期间显示预报区骨架，并在 renderForecastDashboard
 * （气象 API 回调）中关闭 —— 现改为：骨架只在页面 DOM 加载完成后隐藏，
 * 气象数据改为页面加载完成后再后台异步请求，不再用骨架占位等待接口。 */

function showEmptyOrErrorState(icon, title, desc, isError) {
  document.getElementById("forecastContainer").style.display = "none";
  document.getElementById("matchedBanner").style.display = "none";

  const box = document.getElementById("emptyOrErrorState");
  box.style.display = "block";
  box.classList.toggle("state-error", isError);
  document.getElementById("stateIcon").innerText = icon;
  document.getElementById("stateTitle").innerText = title;
  document.getElementById("stateDesc").innerText = desc;
}

// ==================== 5. 黄金平衡校准版火烧云物理量化引擎（已拆分至 algorithm-raw.js） ====================
/* 评分引擎 smoothSPenaltyCurve / evaluateGlowBalanced 由 algorithm-raw.js 提供，
   index.html 在本脚本之前加载该文件；调整评分模型时只需修改那一个文件。 */

// ==================== 6. 渲染后三天预报主面板 ====================
function renderForecastDashboard() {
  if (!currentCityData) return;

  document.getElementById("emptyOrErrorState").style.display = "none";
  document.getElementById("forecastContainer").style.display = "block";

  const banner = document.getElementById("matchedBanner");
  banner.style.display = "flex";
  document.getElementById("matchedCoordText").innerText = `✓ 已匹配城市：${currentCityData.name}`;
  const syncEl = document.getElementById("matchedSyncTime");
  if (currentCityData.lowConfidence) {
    syncEl.innerText = currentCityData.degraded
      ? `⚠ 地名匹配置信度较低，且数据来源已降级（${currentCityData.sourceLabel}）；若城市不符请改用英文名查询`
      : "⚠ 地名匹配置信度较低，若城市不符请在输入框中改用英文名查询";
    syncEl.style.color = "var(--warn)";
    syncEl.style.display = "";
  } else if (currentCityData.degraded) {
    syncEl.innerText = `⚠ 数据来源：${currentCityData.sourceLabel}（部分数据源降级，仅供参考）`;
    syncEl.style.color = "var(--warn)";
    syncEl.style.display = "";
  } else {
    // 正常情况下不再展示数据来源，仅保留低置信度 / 数据源降级时的警示
    syncEl.innerText = "";
    syncEl.style.display = "none";
  }
  document.getElementById("matrixTitle").innerText =
    `📅 ${currentCityData.name} · 未来七天朝霞与晚霞预测`;

  renderForecastMatrix();
  updateActiveSlotView();
  renderTrendChart();
  renderFavorites();

  // 切换城市时播放一次入场动效（点击时段不会重播）
  ["forecastMatrix", "trendWrap"].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("is-fresh");
    void el.offsetWidth;
    el.classList.add("is-fresh");
    setTimeout(function () { el.classList.remove("is-fresh"); }, 700);
  });

  // 前台渲染完成后，把最近一次达标朝霞/晚霞交给安卓原生层做定时提醒
  if (typeof window.__pushRemindTasks === "function") {
    try { window.__pushRemindTasks(); } catch (e) {}
  }
}

function renderForecastMatrix() {
  if (!currentCityData) return;
  const matrixEl = document.getElementById("forecastMatrix");
  const days = [];
  for (let d = 0; d < FORECAST_DAYS; d++) days.push(d);

  matrixEl.innerHTML = days.map(d => {
    const dayMetas = SLOT_METAS.filter(m => m.dayIdx === d && (eventFilter === "all" || m.type === eventFilter));
    const headMeta = SLOT_METAS.find(m => m.dayIdx === d);
    const singleCls = dayMetas.length === 1 ? "single-col" : "";

    const slotsHtml = dayMetas.map(m => {
      const p = currentCityData.slots[m.key];
      const res = evaluateGlowBalanced(p, m.type);
      const isAct = m.key === selectedSlotKey ? "active" : "";
      const sunTime = estimateSunTime(currentCityData.lon, m.type, currentCityData.tz);

      return `
        <div class="slot-card ${isAct}" data-key="${m.key}" onclick="selectSlot('${m.key}')">
          <div class="slot-type">
            <span>${m.icon} ${m.typeName}</span>
            <span class="slot-time">${sunTime}</span>
          </div>
          <div class="slot-grade-row">
            <span class="slot-badge" style="background:${res.grade.hex}">L${res.grade.level} ${res.grade.name}</span>
            <span class="slot-score">${res.score}</span>
          </div>
          <div class="slot-bar" style="background:${res.gradientCSS}"></div>
        </div>
      `;
    }).join("");

    return `
      <div class="day-col">
        <div class="day-header">
          <span>${headMeta.dayLabel} (${headMeta.dateStr})</span>
        </div>
        <div class="day-slots ${singleCls}">${slotsHtml}</div>
      </div>
    `;
  }).join("");
}

/* ---------------- 七日霞光指数趋势（原生 SVG，无第三方图表库） ----------------
 * 朝霞 / 晚霞两条折线 + 每日最高分浅色柱，标注整周最高分出片时段；
 * 每个数据点都绑定 selectSlot，点击即切换下方详情卡片与天空画布（双向联动）。 */
const TREND_W = 760;
const TREND_H = 286;
const TREND_AM_COLOR = "#c8701a";
const TREND_PM_COLOR = "#9e1c3e";

function buildTrendSeries() {
  const days = [];
  for (let d = 0; d < FORECAST_DAYS; d++) {
    const amMeta = SLOT_METAS.find(x => x.dayIdx === d && x.type === "am");
    const pmMeta = SLOT_METAS.find(x => x.dayIdx === d && x.type === "pm");
    const pick = (meta) => {
      if (!meta) return null;
      const p = currentCityData.slots[meta.key];
      if (!p) return null;
      const r = evaluateGlowBalanced(p, meta.type);
      return { meta, score: r.score, grade: r.grade };
    };
    days.push({
      idx: d,
      label: amMeta ? amMeta.dayLabel : `D${d + 1}`,
      dateStr: amMeta ? amMeta.dateStr : "",
      am: pick(amMeta),
      pm: pick(pmMeta)
    });
  }
  return days;
}

function renderTrendChart() {
  const wrap = document.getElementById("trendWrap");
  if (!wrap || !currentCityData) return;

  const days = buildTrendSeries();
  const padL = 44, padR = 16, padT = 34, padB = 56;
  const cw = TREND_W - padL - padR;
  const ch = TREND_H - padT - padB;
  const step = cw / FORECAST_DAYS;
  const X = (d) => padL + step * (d + 0.5);
  const Y = (s) => padT + ch * (1 - Math.max(0, Math.min(100, s)) / 100);

  let best = null;
  days.forEach((day) => {
    ["am", "pm"].forEach((t) => {
      const o = day[t];
      if (o && (!best || o.score > best.score)) best = o;
    });
  });

  let grid = "";
  [0, 25, 50, 75, 100].forEach((v) => {
    const y = Y(v);
    grid += `<line x1="${padL}" y1="${y}" x2="${TREND_W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.14" stroke-width="1" stroke-dasharray="3 4"/>`;
    grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="currentColor" fill-opacity="0.5">${v}</text>`;
  });

  let bars = "";
  days.forEach((day, i) => {
    const top = Math.max(day.am ? day.am.score : 0, day.pm ? day.pm.score : 0);
    if (top <= 0) return;
    const bh = ch * top / 100;
    bars += `<rect x="${(X(i) - step * 0.24).toFixed(1)}" y="${(padT + ch - bh).toFixed(1)}" width="${(step * 0.48).toFixed(1)}" height="${bh.toFixed(1)}" fill="currentColor" fill-opacity="0.055"/>`;
  });

  const selMeta = SLOT_METAS.find(x => x.key === selectedSlotKey);
  let vline = "";
  if (selMeta) {
    const x = X(selMeta.dayIdx).toFixed(1);
    vline = `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + ch}" stroke="currentColor" stroke-opacity="0.32" stroke-width="1" stroke-dasharray="4 5"/>`;
  }

  const lineOf = (type, color) => {
    const pts = [];
    days.forEach((day, i) => {
      const o = day[type];
      if (o) pts.push(`${X(i).toFixed(1)},${Y(o.score).toFixed(1)}`);
    });
    if (pts.length < 2) return "";
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
  };

  let points = "";
  days.forEach((day, i) => {
    ["am", "pm"].forEach((type) => {
      const o = day[type];
      if (!o) return;
      const x = X(i), y = Y(o.score);
      const color = type === "am" ? TREND_AM_COLOR : TREND_PM_COLOR;
      const isActive = o.meta.key === selectedSlotKey;
      if (isActive) {
        points += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="none" stroke="${color}" stroke-opacity="0.45" stroke-width="2"/>`;
      }
      points += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isActive ? 5.4 : 4}" fill="${o.grade.hex}" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.1" pointer-events="none"/>`;
      points += `<circle class="trend-hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="transparent" onclick="selectSlot('${o.meta.key}')"><title>${day.label} ${o.meta.typeName} · ${o.score}分 · ${o.grade.name}</title></circle>`;
    });
  });

  let bestMark = "";
  if (best) {
    const bx = X(best.meta.dayIdx), by = Y(best.score);
    bestMark = `<text x="${bx.toFixed(1)}" y="${(by - 15).toFixed(1)}" text-anchor="middle" font-size="13" fill="${best.grade.hex}" stroke="none">★ ${best.score}</text>`;
  }

  let labels = "";
  days.forEach((day, i) => {
    const x = X(i);
    const bestOfDay = (day.am && day.pm)
      ? (day.am.score >= day.pm.score ? day.am.meta.key : day.pm.meta.key)
      : ((day.am || day.pm) ? (day.am || day.pm).meta.key : "");
    const click = bestOfDay ? ` class="trend-hit" onclick="selectSlot('${bestOfDay}')"` : "";
    labels += `<g${click}><text x="${x.toFixed(1)}" y="${TREND_H - padB + 20}" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity="0.86">${day.label}</text>`;
    labels += `<text x="${x.toFixed(1)}" y="${TREND_H - padB + 36}" text-anchor="middle" font-size="10.5" fill="currentColor" fill-opacity="0.5">${day.dateStr}</text></g>`;
  });

  wrap.innerHTML = `<svg viewBox="0 0 ${TREND_W} ${TREND_H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="七日霞光指数趋势图">`
    + grid + bars + vline
    + lineOf("am", TREND_AM_COLOR) + lineOf("pm", TREND_PM_COLOR)
    + points + bestMark + labels
    + `</svg>`;

  const titleEl = document.getElementById("trendBestText");
  if (titleEl) {
    titleEl.innerText = best
      ? `本周最佳：${best.meta.dayLabel} (${best.meta.dateStr}) · ${best.meta.typeName} ${best.score} 分 · L${best.grade.level} ${best.grade.name}`
      : "--";
  }
}

function updateActiveSlotView() {
  if (!currentCityData) return;
  const slotMeta = SLOT_METAS.find(m => m.key === selectedSlotKey) || SLOT_METAS[1];
  const p = currentCityData.slots[selectedSlotKey];
  const evalRes = evaluateGlowBalanced(p, slotMeta.type);
  const sunTime = estimateSunTime(currentCityData.lon, slotMeta.type, currentCityData.tz);

  document.getElementById("heroLocInfo").innerText = `📍 ${currentCityData.name} (${formatCoordText(currentCityData.lat, currentCityData.lon)})`;
  document.getElementById("heroSlotInfo").innerText = `${slotMeta.icon} ${slotMeta.dayLabel} (${slotMeta.dateStr}) · ${slotMeta.typeName}`;
  const sunInfo = slotSunInfo(slotMeta, currentCityData);
  const lightEl = document.getElementById("heroLightPathInfo");
  lightEl.innerText = `☀️ 光路：${sunInfo.text}`;
  lightEl.title = `太阳高度角 ${sunInfo.altitude.toFixed(1)}°（${sunInfo.polar ? "极昼/极夜，按正午方位近似" : "日出/日落时刻"}）`;
  document.getElementById("heroPeakTime").innerText = `最佳观赏窗口：当地时间 ${sunTime}`;

  const badge = document.getElementById("mainGradeBadge");
  badge.innerText = `L${evalRes.grade.level} · ${evalRes.grade.name}`;
  badge.style.backgroundColor = evalRes.grade.hex;

  const scoreEl = document.getElementById("mainScoreNum");
  scoreEl.innerHTML = `${evalRes.score} <small style="font-size:13px; color:#e2dbc9;">/ 100分</small>`;
  scoreEl.classList.remove("pop");
  void scoreEl.offsetWidth;
  scoreEl.classList.add("pop");
  document.getElementById("colorBiasText").innerText = evalRes.colorBias;
  document.getElementById("aodTagInfo").innerText = `AOD: ${Number(p.aod).toFixed(2)} | 湿度: ${p.rh}%`;
  document.getElementById("spectrumBar").style.background = evalRes.gradientCSS;

  const fill = document.getElementById("scaleFill");
  fill.style.width = `${evalRes.score}%`;
  fill.style.backgroundColor = evalRes.grade.hex;

  GRADES.forEach(g => {
    const chip = document.getElementById(`chip_lvl_${g.level}`);
    const lbl = document.getElementById(`lbl_lvl_${g.level}`);
    if (g.level === evalRes.grade.level) {
      chip.classList.add("current");
      lbl.style.color = "#8c3b2b";
      lbl.style.fontWeight = "normal";
    } else {
      chip.classList.remove("current");
      lbl.style.color = "";
      lbl.style.fontWeight = "normal";
    }
  });

  document.getElementById("diagText").innerText = `💡 物理成因诊断：${evalRes.diag}`;
  renderCanvas(evalRes, p, slotMeta);
}

// ==================== 7. 双模式 Canvas 渲染 ====================
function drawRoundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.closePath();
}

function renderCanvas(evalRes, p, slotMeta) {
  const canvas = document.getElementById("skyCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (canvasMode === "path") {
    render3PointRayCrossSection(ctx, w, h, evalRes, p, slotMeta);
  } else {
    renderRealisticSkyline(ctx, w, h, evalRes, p, slotMeta);
  }
}

function renderRealisticSkyline(ctx, w, h, evalRes, p, slotMeta) {
  const isAM = slotMeta.type === "am";
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, evalRes.grade.skyTop);
  if (evalRes.grade.level >= 6) {
    skyGrad.addColorStop(0.48, isAM ? "#701a75" : "#831843");
  } else if (evalRes.grade.level >= 3) {
    skyGrad.addColorStop(0.55, "#7c2d12");
  } else {
    skyGrad.addColorStop(0.6, "#334155");
  }
  skyGrad.addColorStop(1, evalRes.grade.skyHorizon);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  const sunX = isAM ? w * 0.24 : w * 0.76;
  const sunY = h * 0.90;
  const sunTransmission = evalRes.combinedTrans;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, Math.max(70, 320 * sunTransmission));
  sunGrad.addColorStop(0, `rgba(254, 249, 195, ${0.92 * sunTransmission})`);
  sunGrad.addColorStop(0.35, `rgba(251, 146, 60, ${0.65 * sunTransmission})`);
  sunGrad.addColorStop(0.75, `rgba(225, 29, 72, ${0.32 * sunTransmission})`);
  sunGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h);

  const cloudCount = Math.floor((evalRes.highC + evalRes.midC) / 8);
  for (let i = 0; i < cloudCount; i++) {
    const cx = (i * 107 + (isAM ? 20 : 45)) % (w - 80);
    const cy = 26 + (i * 27) % (h * 0.52);
    const cw = 90 + (i % 4) * 52;
    const ch = 11 + (i % 3) * 6;

    const cGrad = ctx.createLinearGradient(cx, cy, cx, cy + ch);
    if (evalRes.grade.level >= 7) {
      cGrad.addColorStop(0, "rgba(192, 132, 252, 0.78)");
      cGrad.addColorStop(0.55, "rgba(244, 63, 94, 0.88)");
      cGrad.addColorStop(1, "rgba(253, 224, 71, 0.92)");
    } else if (evalRes.grade.level >= 4) {
      cGrad.addColorStop(0, "rgba(148, 163, 184, 0.55)");
      cGrad.addColorStop(1, "rgba(249, 115, 22, 0.88)");
    } else if (evalRes.grade.level >= 2) {
      cGrad.addColorStop(0, "rgba(100, 116, 139, 0.55)");
      cGrad.addColorStop(1, "rgba(217, 119, 6, 0.65)");
    } else {
      cGrad.addColorStop(0, "rgba(71, 85, 105, 0.65)");
      cGrad.addColorStop(1, "rgba(100, 116, 139, 0.55)");
    }
    ctx.fillStyle = cGrad;
    drawRoundRectPath(ctx, cx, cy, cw, ch, 0);
    ctx.fill();
  }

  const lowCloudCount = Math.floor(evalRes.lowC / 8.5);
  for (let i = 0; i < lowCloudCount; i++) {
    const lx = (i * 115 + 10) % (w - 40);
    const ly = h * 0.45 + (i % 3) * 16;
    const lw = 155 + (i % 3) * 60;
    const lh = 26 + (i % 2) * 12;
    ctx.fillStyle = `rgba(15, 23, 42, ${0.70 + (evalRes.lowC / 260)})`;
    drawRoundRectPath(ctx, lx, ly, lw, lh, 0);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(247, 244, 236, 0.75)";
  ctx.font = "12px KaiTi, STKaiti, serif";
  ctx.fillText(isAM ? "◀ 东 (East 日出方向)" : "◀ 东 (East)", 18, h - 24);
  ctx.fillText(isAM ? "西 (West) ▶" : "西 (West 日落方向) ▶", w - 145, h - 24);

  ctx.fillStyle = "#0a0908";
  ctx.beginPath();
  ctx.moveTo(0, h); ctx.lineTo(0, h - 15);
  for (let x = 0; x <= w; x += 34) {
    const bh = (x % 68 === 0) ? 25 : 13;
    ctx.lineTo(x, h - bh); ctx.lineTo(x + 24, h - bh);
  }
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
}

function render3PointRayCrossSection(ctx, w, h, evalRes, p, slotMeta) {
  ctx.fillStyle = "#141311";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(247, 244, 236, 0.16)";
  ctx.lineWidth = 1;
  [52, 102, 150].forEach((y, idx) => {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    ctx.fillStyle = "#b5aea0"; ctx.font = "11px KaiTi, STKaiti, serif";
    const labels = ["高云层 (>6km 卷云·不阻断远端光路)", "中云层 (2-6km 高积云·主力受光云幕)", "低云层 (<2km 视线与斜射阻断层)"];
    ctx.fillText(labels[idx], 14, y - 4);
  });

  ctx.fillStyle = "#1f1d1a";
  ctx.strokeStyle = "#6e685c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 22);
  ctx.quadraticCurveTo(w * 0.48, h - 50, w, h - 18);
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fill(); ctx.stroke();

  // 朝霞取东向、晚霞取西向光路；三档阻断阈值统一为 55，与云块告警变红的判定保持一致
  const dirWord = (slotMeta && slotMeta.type === "am") ? "东向" : "西向";
  const pts = [
    { x: 170, label: "📍 本地观测点", val: null, yCloud: 50 },
    { x: 380, label: "100km近端", val: p.rem_100, yCloud: 132 },
    { x: 580, label: "250km中端", val: p.rem_250, yCloud: 112 },
    { x: 780, label: "400km远端", val: p.rem_400, yCloud: 96 }
  ];

  let cutoffX = pts[0].x;
  let cutoffY = 65;
  if (p.rem_400 > 55) { cutoffX = pts[3].x; cutoffY = pts[3].yCloud; }
  else if (p.rem_250 > 55) { cutoffX = pts[2].x; cutoffY = pts[2].yCloud; }
  else if (p.rem_100 > 55) { cutoffX = pts[1].x; cutoffY = pts[1].yCloud; }

  const rayGrad = ctx.createLinearGradient(w - 15, h - 38, cutoffX, cutoffY);
  rayGrad.addColorStop(0, "rgba(253, 224, 71, 0.95)");
  rayGrad.addColorStop(0.5, "rgba(249, 115, 22, 0.82)");
  rayGrad.addColorStop(1, cutoffX > pts[0].x ? "rgba(239, 68, 68, 0.85)" : `${evalRes.grade.hex}EE`);

  ctx.strokeStyle = rayGrad;
  ctx.lineWidth = cutoffX > pts[0].x ? 4 : 6;
  ctx.beginPath();
  ctx.moveTo(w - 10, h - 34);
  ctx.lineTo(cutoffX, cutoffY);
  ctx.stroke();

  if (cutoffX > pts[0].x) {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(247, 244, 236, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cutoffX, cutoffY);
    ctx.lineTo(pts[0].x, 65);
    ctx.stroke();
    ctx.restore();
  }

  pts.slice(1).forEach(pt => {
    ctx.fillStyle = pt.val > 55 ? "#c84b31" : "#d99b26";
    ctx.beginPath(); ctx.arc(pt.x, h - 32, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e6e1d6"; ctx.font = "11px KaiTi, STKaiti, serif";
    ctx.fillText(pt.label, pt.x - 28, h - 12);

    const isWall = pt.val > 55;
    ctx.fillStyle = isWall ? `rgba(180, 45, 35, ${0.45 + pt.val / 200})` : `rgba(90, 85, 75, ${0.35 + pt.val / 180})`;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    drawRoundRectPath(ctx, pt.x - 45, pt.yCloud - 14, 90, 26, 0);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f7f4ec"; ctx.font = "11px KaiTi, STKaiti, serif";
    ctx.fillText(`有效阻断:${pt.val}%`, pt.x - 38, pt.yCloud + 3);
  });

  const obsX = pts[0].x;
  ctx.fillStyle = "#d99b26";
  ctx.beginPath(); ctx.arc(obsX, h - 30, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f7f4ec"; ctx.font = "11px KaiTi, STKaiti, serif";
  ctx.fillText("📍 本地观测点 · " + dirWord, obsX - 36, h - 11);

  ctx.fillStyle = `${evalRes.grade.hex}CC`;
  drawRoundRectPath(ctx, obsX - 58, 38, 116, 18, 0);
  ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "11px KaiTi, STKaiti, serif";
  ctx.fillText(`本地高云: ${Math.round(evalRes.highC)}%`, obsX - 42, 51);

  ctx.fillStyle = `${evalRes.grade.hex}AA`;
  drawRoundRectPath(ctx, obsX - 58, 88, 116, 18, 0);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(`本地中云: ${Math.round(evalRes.midC)}%`, obsX - 42, 101);

  ctx.fillStyle = `rgba(30, 28, 24, ${0.55 + evalRes.lowC / 150})`;
  ctx.strokeStyle = "#a34836";
  drawRoundRectPath(ctx, obsX - 58, 136, 116, 18, 0);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f5d0c5";
  ctx.fillText(`本地低云: ${Math.round(evalRes.lowC)}%`, obsX - 42, 149);
}

// ==================== 8. 视图切换与时段联动 ====================
function selectSlot(slotKey) {
  selectedSlotKey = slotKey;
  renderForecastMatrix();
  updateActiveSlotView();
  renderTrendChart();
  // 双向联动：把当前时段对应的矩阵卡片横向滚动到可视区（桌面端 / 手机端一致）
  try {
    const card = document.querySelector(`.slot-card[data-key="${slotKey}"]`);
    if (card && card.scrollIntoView) card.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  } catch (e) {}
}

function setEventFilter(flt) {
  eventFilter = flt;
  ["all", "am", "pm"].forEach(k => document.getElementById(`flt_${k}`).classList.toggle("active", k === flt));
  const curMeta = SLOT_METAS.find(m => m.key === selectedSlotKey) || SLOT_METAS[1];
  if (flt !== "all" && curMeta.type !== flt) selectedSlotKey = `d${curMeta.dayIdx}_${flt}`;
  renderForecastMatrix();
  updateActiveSlotView();
}

function setCanvasMode(mode) {
  canvasMode = mode;
  document.getElementById("view_sky").classList.toggle("active", mode === "sky");
  document.getElementById("view_path").classList.toggle("active", mode === "path");
  updateActiveSlotView();
}

function initStaticElements() {
  const legendEl = document.getElementById("gradeLegend");
  const scaleLabelsEl = document.getElementById("scaleLabels");
  legendEl.innerHTML = GRADES.map(g => `
    <div class="grade-chip" id="chip_lvl_${g.level}">
      <span class="dot" style="background:${g.hex}"></span>
      <span>L${g.level} ${g.name}</span>
    </div>
  `).join("");
  scaleLabelsEl.innerHTML = GRADES.map(g => `<span id="lbl_lvl_${g.level}">${g.name}</span>`).join("");

  // 初始化城市输入候选列表
  const datalistEl = document.getElementById("cityDatalist");
  if (datalistEl) {
    datalistEl.innerHTML = Object.keys(CITY_COORDS_DB).map(k => {
      const c = CITY_COORDS_DB[k];
      return `<option value="${k}">${c.name} (${c.en || ""})</option>`;
    }).join("");
  }

  const cityInputEl = document.getElementById("cityInput");

  cityInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCitySearch();
    }
  });

  cityInputEl.addEventListener("input", (e) => {
    if (e.target.value.trim() === "") {
      searchSeq++;             // 使在途的旧查询失效，避免其返回后覆盖已清空的界面
      currentCityData = null;
      showEmptyOrErrorState(
        "🌇",
        "请输入或点选目标城市名称以获取火烧云预测",
        "系统支持中国及全球各大洲主要城市中英文匹配，自动解析目标城市经纬度坐标，拉取后端固定的 GFS、ECMWF 云层数据及 CAMS 气溶胶参数，计算未来七天（7 天趋势）的朝霞与晚霞等级。",
        false
      );
    }
  });
}

window.addEventListener("DOMContentLoaded", initStaticElements);

// ==================== 9. 常用地点 / 收藏夹（localStorage: sunset-favorites） ====================
/* 设计要点：
 *  · 收藏时保存「精确 GPS 经纬度 + 时区 + 展示城市名 + 自定义别名」；
 *  · 点击胶囊直接用保存的坐标拉模型（跳过地名解析，避免重名城市误匹配）；
 *  · 收藏城市不写入 locatedCity，安卓提醒仍以真实定位位置为准。 */
const FAV_KEY = "sunset-favorites";
const FAV_LIMIT = 24;
let favEditingId = null;

function escapeHtmlText(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function readFavorites() {
  try {
    const arr = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => x && typeof x.id === "string" && isFinite(x.lat) && isFinite(x.lon));
  } catch (e) { return []; }
}

function writeFavorites(list) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(list.slice(0, FAV_LIMIT))); } catch (e) {}
  renderFavorites();
}

function favoriteId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function defaultAliasFor(city) {
  const plain = String((city && city.name) || "").replace(/^[^·]*·/, "");
  return plain || formatCoordText(city.lat, city.lon);
}

function showFavTip(msg) {
  const tip = document.getElementById("favTip");
  if (!tip) return;
  tip.innerText = msg || "";
  tip.style.display = msg ? "block" : "none";
}

function renderFavorites() {
  const wrap = document.getElementById("favBarWrap");
  const bar = document.getElementById("favBar");
  const cnt = document.getElementById("favCountText");
  if (!wrap || !bar) return;

  const list = readFavorites();
  wrap.style.display = list.length ? "block" : "none";
  if (cnt) cnt.innerText = list.length ? `共 ${list.length} 个` : "";

  const curLat = currentCityData ? currentCityData.lat : null;
  const curLon = currentCityData ? currentCityData.lon : null;

  bar.innerHTML = list.map((f) => {
    const active = (curLat !== null && Math.abs(curLat - f.lat) < 1e-6 && Math.abs(curLon - f.lon) < 1e-6) ? " active" : "";
    return `<div class="fav-chip${active}" data-id="${f.id}">`
      + `<button type="button" class="fav-main" onclick="loadFavorite('${f.id}')" title="${escapeHtmlText(f.name || f.alias)}">`
      + `<span>⭐ ${escapeHtmlText(f.alias)}</span></button>`
      + `<button type="button" class="fav-op" onclick="editFavorite('${f.id}')" aria-label="编辑别名">✎</button>`
      + `<button type="button" class="fav-op" onclick="deleteFavorite('${f.id}')" aria-label="删除地点">✕</button>`
      + `</div>`;
  }).join("");
}

function toggleFavoriteEditor() {
  const ed = document.getElementById("favEditor");
  if (!ed) return;
  if (ed.classList.contains("open")) { cancelFavoriteEditor(); return; }
  if (!currentCityData) {
    showFavTip("请先查询地点（或使用定位）后再收藏当前地点。");
    return;
  }
  favEditingId = null;
  showFavTip("");
  const input = document.getElementById("favAliasInput");
  if (input) input.value = defaultAliasFor(currentCityData);
  ed.classList.add("open");
  if (input) { try { input.focus(); input.select(); } catch (e) {} }
}

function cancelFavoriteEditor() {
  favEditingId = null;
  const ed = document.getElementById("favEditor");
  if (ed) ed.classList.remove("open");
  showFavTip("");
}

function saveFavoriteAlias() {
  if (!currentCityData) { showFavTip("请先查询地点后再收藏。"); return; }
  const input = document.getElementById("favAliasInput");
  const alias = ((input ? input.value : "") || "").trim() || defaultAliasFor(currentCityData);
  const list = readFavorites();

  if (favEditingId) {
    const idx = list.findIndex((x) => x.id === favEditingId);
    if (idx >= 0) list[idx].alias = alias;
  } else {
    const same = list.find((x) => Math.abs(x.lat - currentCityData.lat) < 1e-6 && Math.abs(x.lon - currentCityData.lon) < 1e-6);
    if (same) {
      same.alias = alias;
    } else {
      list.unshift({
        id: favoriteId(),
        alias,
        name: currentCityData.name,
        lat: currentCityData.lat,
        lon: currentCityData.lon,
        tz: currentCityData.tz,
        createdAt: Date.now()
      });
    }
  }

  writeFavorites(list);
  cancelFavoriteEditor();
  showFavTip("已收藏，可在搜索栏下方快捷胶囊中直接调用。");
  setTimeout(() => { showFavTip(""); }, 2600);
}

function loadFavorite(id) {
  const f = readFavorites().find((x) => x.id === id);
  if (!f) return;
  const display = f.name || f.alias;
  const input = document.getElementById("cityInput");
  if (input) input.value = display;
  cancelFavoriteEditor();
  // 第三个参数 false：收藏城市不写入「定位城市」，避免覆盖安卓提醒的定位位置
  handleCitySearch(undefined, {
    name: display,
    lat: Number(f.lat),
    lon: Number(f.lon),
    tz: (typeof f.tz === "number") ? f.tz : Math.round(Number(f.lon) / 15)
  }, false);
}

function editFavorite(id) {
  const f = readFavorites().find((x) => x.id === id);
  if (!f) return;
  favEditingId = id;
  const input = document.getElementById("favAliasInput");
  const ed = document.getElementById("favEditor");
  if (input) input.value = f.alias;
  if (ed) ed.classList.add("open");
  showFavTip("正在编辑地点别名，保存后立即生效。");
  if (input) { try { input.focus(); input.select(); } catch (e) {} }
}

function deleteFavorite(id) {
  if (favEditingId === id) cancelFavoriteEditor();
  const chip = document.querySelector(`.fav-chip[data-id="${id}"]`);
  const commit = function () {
    writeFavorites(readFavorites().filter((x) => x.id !== id));
  };
  if (!chip) { commit(); return; }
  // 先播放收起动效，再写回 localStorage 并重渲染
  chip.classList.add("is-removing");
  setTimeout(commit, 175);
}

// ==================== 10. 霞光签海报（原生 Canvas 离线绘制，无外部库） ====================
const POSTER_RATIOS = { "9:16": { w: 1080, h: 1920 }, "4:5": { w: 1080, h: 1350 } };
const POSTER_FONT = '"Noto Serif SC","Noto Serif CJK SC","Source Han Serif SC","Songti SC","STSong","SimSun",serif';
const POSTER_NUM_FONT = '"Cormorant Garamond","Georgia","Times New Roman",serif';
const POSTER_SKY_POS = [0, 0.18, 0.36, 0.54, 0.7, 0.85, 1];
const POSTER_SKY = {
  pm: {
    big: ["#0d0a26", "#2a1450", "#6a1f69", "#c1305a", "#f0643a", "#ffb04a", "#ffe0a0"],
    mid: ["#101830", "#2c2a63", "#76407f", "#c85d73", "#ee8f58", "#fbc17e", "#ffe3b3"],
    small: ["#1c2744", "#33406e", "#5f6a9a", "#a98ba4", "#e0a99c", "#f5cfae", "#fdeed4"]
  },
  am: {
    big: ["#141c46", "#3a3478", "#8a3f86", "#d9547a", "#f78a5a", "#ffc070", "#fff0c0"],
    mid: ["#1a2a50", "#43508a", "#8c6296", "#e0809a", "#f6a878", "#ffd39a", "#fff2d2"],
    small: ["#25365c", "#4a5a8c", "#7f86b0", "#c49fb4", "#eebfae", "#fbe0c0", "#fff6e4"]
  }
};
let posterRatio = "9:16";
let POSTER_DATA = { url: "", name: "" };
const POSTER_SHARE_LINK = "https://sohpisacoder.github.io/sunset-forecast/";
let posterFontsReady = false;

function posterPad2(n) { return String(n).padStart(2, "0"); }

/* 字体就绪：只等待文档里真实声明过、且尚未就绪的字体；
   未声明的字体族 fonts.check() 直接返回 true，无需空等，避免首图被无谓推迟 900ms */
async function posterEnsureFonts() {
  if (posterFontsReady || typeof document === "undefined" || !document.fonts) return;
  try {
    const wanted = [
      '500 40px "Noto Serif SC"',
      '300 40px "Noto Serif SC"',
      '300 40px "Cormorant Garamond"',
      '500 40px "Songti SC"'
    ].filter(function (spec) {
      try { return !document.fonts.check(spec); } catch (e) { return false; }
    });
    if (!wanted.length) { posterFontsReady = true; return; }
    await Promise.race([
      Promise.allSettled(wanted.map(function (spec) { return document.fonts.load(spec); })),
      new Promise(function (r) { setTimeout(r, 900); })
    ]);
  } catch (e) {}
  posterFontsReady = true;
}

/* Canvas 没有 letter-spacing：逐字绘制并记录总宽，供右对齐与自动收窄使用 */
function posterTrackWidth(ctx, text, size, trackingEm) {
  const chars = String(text).split("");
  let w = 0;
  chars.forEach((ch) => { w += ctx.measureText(ch).width; });
  return w + size * trackingEm * Math.max(0, chars.length - 1);
}
function posterDrawTracked(ctx, text, x, y, size, trackingEm, align) {
  const chars = String(text).split("");
  const gap = size * trackingEm;
  let cx = (align === "right") ? x - posterTrackWidth(ctx, text, size, trackingEm) : x;
  ctx.textAlign = "left";
  chars.forEach((ch) => {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + gap;
  });
}

/* ---- 颜色工具：统一转 rgb，支持 #hex / rgb() ---- */
function posterRgb(color) {
  const s = String(color || "").trim();
  if (s.charAt(0) === "#") {
    let h = s.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const v = parseInt(h, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  const m = s.match(/(\d+(?:\.\d+)?)/g);
  if (m && m.length >= 3) return [+m[0], +m[1], +m[2]];
  return [255, 255, 255];
}
function posterMix(a, b, t) {
  const A = posterRgb(a), B = posterRgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}
/* 降饱和：向自身灰阶靠拢 */
function posterDesat(color, t) {
  const c = posterRgb(color);
  const g = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  return `rgb(${Math.round(c[0] + (g - c[0]) * t)},${Math.round(c[1] + (g - c[1]) * t)},${Math.round(c[2] + (g - c[2]) * t)})`;
}

/* 等级 → 配色档：大烧 / 中烧 / 微烧；更低等级沿用微烧并略微降饱和 */
function posterSkyStops(level, type) {
  const key = level >= 7 ? "big" : (level >= 5 ? "mid" : "small");
  const pal = ((POSTER_SKY[type] || POSTER_SKY.pm)[key] || POSTER_SKY.pm.small).slice();
  return level <= 1 ? pal.map((c) => posterDesat(c, 0.18)) : pal;
}

/* 天空：7 色标垂直线性渐变；deepen 仅加深自下而上第 3、4 个色标 */
function posterPaintSky(ctx, W, H, stops, deepen) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  stops.forEach((c, i) => {
    const col = (deepen > 0 && (i === 3 || i === 4)) ? posterMix(c, "#000000", deepen) : c;
    g.addColorStop(POSTER_SKY_POS[i], col);
  });
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/* 地平线柔光：椭圆径向渐变，圆心 (50%,100%)，rx 95%W / ry 42%H，取第 6 个色标 */
function posterPaintGlow(ctx, W, H, stops) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.55;
  ctx.translate(W / 2, H);
  ctx.scale(1, (0.42 * H) / (0.95 * W));
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.95 * W);
  g.addColorStop(0, stops[5]);
  g.addColorStop(0.74, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-W, -0.95 * W, 2 * W, 0.95 * W);
  ctx.restore();
}

/* 左下评分区域的平均亮度（用于白字可读性自检）：整块一次读回，避免多次 getImageData 的 GPU 回读开销 */
function posterScoreLum(ctx, W, H, cqw) {
  const x0 = Math.round(4 * cqw), y0 = Math.round(H - 34 * cqw);
  const w = Math.max(1, Math.round(30 * cqw)), h = Math.max(1, Math.round(28 * cqw));
  const data = ctx.getImageData(x0, y0, w, h).data;
  let sum = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    n++;
  }
  return n ? sum / n : 0;
}

/* 数据缺失时清空预览，避免把上一个城市的旧图当成当前城市下载 / 分享 */
function posterResetPreview() {
  POSTER_DATA.url = "";
  POSTER_DATA.name = "";
  const img = document.getElementById("posterPreview");
  if (img) img.removeAttribute("src");
  const titleEl = document.getElementById("posterTitle");
  if (titleEl) titleEl.innerText = "🖼 霞光签预览";
}

async function drawPoster() {
  if (!currentCityData) { posterResetPreview(); return; }
  await posterEnsureFonts();

  const ratio = posterRatio;          // 等字体就绪后再取比例，避免快速切换时的竞态
  const slotMeta = SLOT_METAS.find((m) => m.key === selectedSlotKey) || SLOT_METAS[1];
  const p = currentCityData.slots[selectedSlotKey];
  if (!p) { posterResetPreview(); return; }

  const evalRes = evaluateGlowBalanced(p, slotMeta.type);
  const sunTime = estimateSunTime(currentCityData.lon, slotMeta.type, currentCityData.tz);
  const size = POSTER_RATIOS[ratio] || POSTER_RATIOS["9:16"];
  const W = size.w, H = size.h;
  const tall = (ratio === "9:16");
  const cqw = W / 100;                // 以画布宽度为基准的排版单位
  const padX = 9 * cqw;               // 左右安全边距 9cqw
  const ink = "#fffaf2";
  const grade = evalRes.grade;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  /* ---- 1. 背景仅两层：天空 7 色标渐变 + 地平线柔光 ---- */
  const stops = posterSkyStops(grade.level, slotMeta.type);
  posterPaintSky(ctx, W, H, stops, 0);
  posterPaintGlow(ctx, W, H, stops);
  // 微烧等亮底：自检左下评分区亮度，必要时一次性加深自下而上第 3、4 个色标（结果确定）
  if (posterScoreLum(ctx, W, H, cqw) > 0.72) {
    posterPaintSky(ctx, W, H, stops, 0.18);
    posterPaintGlow(ctx, W, H, stops);
  }

  /* ---- 2. 文字：城市 / 日期时段 / 等级大字 / 评分 + 最佳时间 ---- */
  ctx.textBaseline = "alphabetic";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowColor = "rgba(24,10,40,0.22)";
  ctx.shadowBlur = 4 * cqw;

  const dayObj = new Date();
  dayObj.setDate(dayObj.getDate() + slotMeta.dayIdx);

  // 城市：左上，左边距 9cqw、顶部 10cqw，5.6cqw / 500 / 字距 .32em
  let citySize = 5.6 * cqw;
  const cityMaxW = W - padX * 2 - 34 * cqw;   // 给右侧竖排大字留出空间
  ctx.font = `500 ${citySize}px ${POSTER_FONT}`;
  while (citySize > 2.6 * cqw && posterTrackWidth(ctx, currentCityData.name, citySize, 0.32) > cityMaxW) {
    citySize -= 0.1 * cqw;
    ctx.font = `500 ${citySize}px ${POSTER_FONT}`;
  }
  ctx.fillStyle = ink;
  posterDrawTracked(ctx, currentCityData.name, padX, 10 * cqw + citySize * 0.88, citySize, 0.32, "left");

  // 日期 + 时段：城市下方 2.2cqw，2.9cqw / 300 / 字距 .24em / 不透明度 .9
  const dateSize = 2.9 * cqw;
  ctx.globalAlpha = 0.9;
  ctx.font = `300 ${dateSize}px ${POSTER_FONT}`;
  posterDrawTracked(
    ctx,
    `${dayObj.getMonth() + 1}月${dayObj.getDate()}日 ${slotMeta.typeName}`,
    padX,
    10 * cqw + citySize + 2.2 * cqw + dateSize * 0.88,
    dateSize, 0.24, "left"
  );
  ctx.globalAlpha = 1;

  // 等级大字：竖排逐字，右上，34cqw / 500 / 字距 .06em / 右边距 9cqw
  const word = String(grade.name || "").split("");
  const wordTop = (tall ? 30 : 16) * cqw;
  let charSize = 34 * cqw;
  const wordAvail = H - wordTop - 9 * cqw;
  if (word.length * charSize * 1.06 > wordAvail) {
    charSize = wordAvail / Math.max(1, word.length * 1.06);   // 超长等级名兜底，常规两字不受影响
  }
  ctx.font = `500 ${charSize}px ${POSTER_FONT}`;
  ctx.shadowColor = "rgba(24,10,40,0.18)";   // 大字阴影 alpha 降为 .18
  let wy = wordTop + charSize * 0.88;
  word.forEach((ch) => {
    posterDrawTracked(ctx, ch, W - padX, wy, charSize, 0.06, "right");
    wy += charSize * 1.06;
  });

  // 评分 + 最佳时间：左下，评分块整体底边距 14cqw（9:16）/ 12cqw（4:5）
  ctx.shadowColor = "rgba(24,10,40,0.22)";
  const timeSize = 3.2 * cqw;
  const timeBase = H - (tall ? 14 : 12) * cqw;
  const scoreBase = timeBase - 6 * cqw;      // 时间在评分下方 3.2cqw
  ctx.fillStyle = ink;
  ctx.font = `300 ${20 * cqw}px ${POSTER_NUM_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(String(evalRes.score), padX, scoreBase);

  ctx.globalAlpha = 0.94;
  ctx.font = `300 ${timeSize}px ${POSTER_FONT}`;
  posterDrawTracked(ctx, `${sunTime} 最佳`, padX, timeBase, timeSize, 0.26, "left");
  ctx.globalAlpha = 1;

  /* ---- 3. 输出：dataURL 预览 + 下载 ---- */
  POSTER_DATA.url = canvas.toDataURL("image/png");
  const safeCity = String(currentCityData.name || "city").replace(/[\\/:*?"<>|\s]/g, "_").slice(0, 24);
  const fullDate = `${dayObj.getFullYear()}-${posterPad2(dayObj.getMonth() + 1)}-${posterPad2(dayObj.getDate())}`;
  POSTER_DATA.name = `霞光签_${safeCity}_${fullDate}_${slotMeta.typeName}_${ratio.replace(":", "-")}.png`;

  const img = document.getElementById("posterPreview");
  if (img) img.src = POSTER_DATA.url;
  const titleEl = document.getElementById("posterTitle");
  if (titleEl) titleEl.innerText = `🖼 霞光签 · ${currentCityData.name}`;
}

function syncPosterRatioBtns() {
  const a = document.getElementById("ratio_916");
  const b = document.getElementById("ratio_45");
  if (a) a.classList.toggle("active", posterRatio === "9:16");
  if (b) b.classList.toggle("active", posterRatio === "4:5");
}

function showPosterTip(msg) {
  const tip = document.getElementById("posterTip");
  if (!tip) return;
  tip.innerText = msg;
  tip.classList.add("show");
  clearTimeout(showPosterTip._t);
  showPosterTip._t = setTimeout(function () { tip.classList.remove("show"); }, 2200);
}

async function generatePoster() {
  if (!currentCityData) {
    showPosterTip("请先查询城市后再生成霞光签。");
    return;
  }
  posterRatio = "9:16";
  syncPosterRatioBtns();
  const modal = document.getElementById("posterModal");
  if (modal) {
    modal.classList.remove("is-closing");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modal.scrollTop = 0;
  }
  await drawPoster();   // 字体就绪后再绘制，避免首次导出回退成默认字体
}

async function setPosterRatio(ratio) {
  if (!POSTER_RATIOS[ratio]) return;
  posterRatio = ratio;
  syncPosterRatioBtns();
  await drawPoster();
  const img = document.getElementById("posterPreview");
  if (img) {
    img.classList.remove("swap");
    void img.offsetWidth;
    img.classList.add("swap");
  }
}

function closePoster() {
  const modal = document.getElementById("posterModal");
  if (!modal || !modal.classList.contains("open") || modal.classList.contains("is-closing")) return;
  modal.classList.add("is-closing");
  modal.setAttribute("aria-hidden", "true");
  setTimeout(function () {
    modal.classList.remove("open");
    modal.classList.remove("is-closing");
  }, 195);
}

/* 取原生桥：仅安卓壳内存在 AndroidInterface */
function posterBridge() {
  try {
    if (typeof AndroidInterface !== "undefined" && AndroidInterface) return AndroidInterface;
  } catch (e) {}
  return null;
}

/* 保存 / 下载 PNG：安卓走 MediaStore，浏览器走 <a download> */
function downloadPoster(ev) {
  if (!POSTER_DATA.url) { if (ev && ev.preventDefault) ev.preventDefault(); return; }
  const br = posterBridge();
  if (br && typeof br.savePosterImage === "function") {
    if (ev && ev.preventDefault) ev.preventDefault();
    let res = "";
    try { res = br.savePosterImage(POSTER_DATA.url, POSTER_DATA.name); }
    catch (e) { res = "ERR"; }
    const ok = res && String(res).indexOf("ERR") !== 0;
    showPosterTip(ok ? "✅ 已保存到相册：Pictures/SunsetForecast" : "自动保存失败，请长按上方图片手动保存到相册。");
    return;
  }
  const a = document.createElement("a");
  a.href = POSTER_DATA.url;
  a.download = POSTER_DATA.name || "霞光签.png";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showPosterTip("已开始下载 PNG。");
}

/* 复制分享链接（固定指向 GitHub Pages，网页端与安卓端一致） */
function copyPosterLink() {
  const link = POSTER_SHARE_LINK;
  const done = function () { showPosterTip("链接已复制，可粘贴到微信 / 小红书分享。"); };
  const fallback = function () {
    try {
      const ta = document.createElement("textarea");
      ta.value = link;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) done();
      else showPosterTip("复制失败，请手动复制地址栏链接。");
    } catch (e) {
      showPosterTip("复制失败，请手动复制地址栏链接。");
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(done).catch(fallback);
  } else {
    fallback();
  }
}

/* dataURL → Blob：同步解码，不经过 fetch，保证分享调用仍在用户手势内 */
function posterDataUrlToBlob(dataUrl) {
  const comma = String(dataUrl || "").indexOf(",");
  if (comma < 0) return null;
  const bin = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

/* 分享到微信 / 小红书：安卓走原生分享（缓存目录 + FileProvider，不写相册），网页走系统分享面板 */
async function sharePoster(target) {
  if (!POSTER_DATA.url) { showPosterTip("请先生成霞光签。"); return; }
  const name = POSTER_DATA.name || "霞光签.png";
  const br = posterBridge();
  if (br && typeof br.sharePosterImage === "function") {
    let res = "";
    try { res = br.sharePosterImage(POSTER_DATA.url, name, target); }
    catch (e) { res = "ERR"; }
    const ok = res && String(res).indexOf("ERR") !== 0;
    showPosterTip(ok
      ? (target === "xhs" ? "正在打开小红书发布编辑…" : "正在打开微信好友列表…")
      : "分享失败：未找到可用的应用，请长按图片手动分享。");
    return;
  }
  // 浏览器端：同步解码 dataURL 后再调 navigator.share，
  // 避免 await fetch 丢失用户手势（Safari 会因此抛 NotAllowedError）
  try {
    const blob = posterDataUrlToBlob(POSTER_DATA.url);
    if (blob && navigator.canShare && typeof File === "function") {
      const file = new File([blob], name, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "霞光签" });
        return;
      }
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;   // 用户在系统分享面板里取消，不提示
  }
  showPosterTip("当前浏览器不支持直接分享图片，请长按上方图片保存后发送。");
}

/* 客户端判定：手机 / 平板之外的桌面浏览器隐藏微信、小红书按钮 */
function isMobileClient() {
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  if (/Android|iPhone|iPod|iPad|HarmonyOS|Mobile|Windows Phone/i.test(ua)) return true;
  // iPadOS 13+ 的 UA 伪装成 Macintosh，用触点数量兜底
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

/* ---------------- 收藏夹 / 海报的初始化绑定 ---------------- */
window.addEventListener("DOMContentLoaded", function () {
  if (document.documentElement && !isMobileClient()) {
    document.documentElement.classList.add("is-pc");
  }
  renderFavorites();

  // 悬浮分享按钮：静止时接近透明，页面滚动时逐渐显现，停止滚动后再次淡出
  const fab = document.getElementById("posterFab");
  if (fab) {
    let fabTimer = null;
    const revealFab = function () {
      fab.classList.add("is-visible");
      clearTimeout(fabTimer);
      fabTimer = setTimeout(function () { fab.classList.remove("is-visible"); }, 1100);
    };
    window.addEventListener("scroll", revealFab, { passive: true });
    window.addEventListener("touchmove", revealFab, { passive: true });
  }

  const aliasInput = document.getElementById("favAliasInput");
  if (aliasInput) {
    aliasInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        saveFavoriteAlias();
      }
    });
  }

  const modal = document.getElementById("posterModal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closePoster();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePoster();
  });
});

/* ---------------- 首屏骨架：初始化完成后淡出并从 DOM 移除 ---------------- */
(function () {
  const MIN_MS = 360;   // 至少展示这么久，避免骨架一闪而过
  const t0 = window.performance && performance.now ? performance.now() : Date.now();
  function elapsed() {
    return (window.performance && performance.now ? performance.now() : Date.now()) - t0;
  }
  function dismiss() {
    const el = document.getElementById("appSkeleton");
    if (!el) return;
    setTimeout(() => {
      el.className = "is-hidden";
      el.setAttribute("aria-busy", "false");
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 340);
    }, Math.max(0, MIN_MS - elapsed()));
  }
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", dismiss);
  else dismiss();
})();

(function () {
      "use strict";
      var KEY = "sunset-theme";
      var MODES = ["light", "dark", "system"];

      function storedMode() {
        try {
          var v = localStorage.getItem(KEY);
          return MODES.indexOf(v) >= 0 ? v : "system";
        } catch (e) { return "system"; }
      }
      function systemDark() {
        try {
          if (window.AndroidTheme && typeof AndroidTheme.isDark === "function") return !!AndroidTheme.isDark();
        } catch (e) {}
        return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
      function apply(mode, persist) {
        var dark = mode === "dark" || (mode === "system" && systemDark());
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        // 通知安卓外壳：状态栏、导航栏配色与图标明暗随主题切换
        try {
          if (window.AndroidTheme && typeof AndroidTheme.setTheme === "function") {
            AndroidTheme.setTheme(dark ? "dark" : "light");
          }
        } catch (e) {}
        if (persist) { try { localStorage.setItem(KEY, mode); } catch (e) {} }
        var panel = document.getElementById("themePanel");
        if (panel) {
          var opts = panel.querySelectorAll(".theme-option");
          for (var i = 0; i < opts.length; i++) {
            var on = opts[i].getAttribute("data-mode") === mode;
            opts[i].className = "theme-option" + (on ? " active" : "");
            opts[i].setAttribute("aria-pressed", on ? "true" : "false");
          }
        }
      }

      function bindUi() {
        var gear = document.getElementById("themeGear");
      var panel = document.getElementById("themePanel");
      function closePanel() {
        if (panel) { panel.className = "theme-panel"; }
        if (gear) { gear.setAttribute("aria-expanded", "false"); }
      }
      if (gear && panel) {
        gear.addEventListener("click", function (e) {
          e.stopPropagation();
          var open = panel.className.indexOf("open") < 0;
          panel.className = "theme-panel" + (open ? " open" : "");
          gear.setAttribute("aria-expanded", open ? "true" : "false");
        });
        var opts = panel.querySelectorAll(".theme-option");
        for (var i = 0; i < opts.length; i++) {
          opts[i].addEventListener("click", function () {
            apply(this.getAttribute("data-mode"), true);
            closePanel();
          });
        }
        document.addEventListener("click", function (e) {
          if (panel.className.indexOf("open") >= 0 && !panel.contains(e.target)) closePanel();
        });
      }
      }

      // 系统深浅色变化时自动跟随；安卓外壳切换系统主题时也会主动调用本函数
      if (window.matchMedia) {
        var mq = window.matchMedia("(prefers-color-scheme: dark)");
        var onMq = function () { if (storedMode() === "system") apply("system", false); };
        if (mq.addEventListener) mq.addEventListener("change", onMq);
        else if (mq.addListener) mq.addListener(onMq);
      }
      window.__applyThemeFromSystem = function () {
        if (storedMode() === "system") apply("system", false);
      };

      apply(storedMode(), false);
      if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", bindUi);
      else bindUi();
    })();

(function () {
      "use strict";

      // 输入类元素（含被其包裹的子节点）一律放行，不做任何拦截
      function isEditable(target) {
        if (!target || target.nodeType !== 1) return false;
        var tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
        if (target.isContentEditable) return true;
        return !!(target.closest && target.closest("input, textarea, select, [contenteditable='true']"));
      }

      // 1. 右键菜单：输入框放行（右键粘贴可用），霞光签预览区放行（长按保存图片），其余屏蔽
      document.addEventListener("contextmenu", function (e) {
        if (isEditable(e.target)) return;
        if (e.target && e.target.closest && e.target.closest("#posterModal")) return;
        e.preventDefault();
      }, true);

      // 2. 文本选中：输入框放行，其余阻止（不拦截 Ctrl+A 等键盘操作，避免影响无障碍读屏）
      document.addEventListener("selectstart", function (e) {
        if (isEditable(e.target)) return;
        if (e.target && e.target.closest && e.target.closest("#posterModal")) return;
        e.preventDefault();
      }, true);

      // 3. 复制 / 剪切：输入框放行，其余清空选区并阻止
      function blockCopy(e) {
        if (isEditable(e.target)) return;
        e.preventDefault();
        try {
          if (e.clipboardData) e.clipboardData.setData("text/plain", "");
          var sel = window.getSelection && window.getSelection();
          if (sel && sel.removeAllRanges) sel.removeAllRanges();
        } catch (err) {}
      }
      document.addEventListener("copy", blockCopy, true);
      document.addEventListener("cut", blockCopy, true);
    })();

(function () {
      "use strict";

      var AUTO_KEY = "sunset-auto-locate";   // 自动定位开关的 localStorage 键（"1" 开启 / "0" 关闭）
      var GEO_TIMEOUT = 10000;               // 浏览器定位超时：10 秒
      var REVERSE_TIMEOUT = 5000;            // 逆地理接口超时

      /* ---------- localStorage 读写：开关状态持久保存，异常时静默降级 ---------- */
      function readAutoFlag() {
        try { return localStorage.getItem(AUTO_KEY) === "1"; } catch (e) { return false; }
      }
      function writeAutoFlag(on) {
        try { localStorage.setItem(AUTO_KEY, on ? "1" : "0"); } catch (e) {}
      }

      /* ---------- 统一提示：复用页面既有的首页占位 / 告警面板 ---------- */
      function notice(icon, title, desc, isError) {
        try {
          if (typeof showEmptyOrErrorState === "function") {
            showEmptyOrErrorState(icon, title, desc, !!isError);
          }
        } catch (e) {}
      }

      /* ---------- 1. 浏览器定位：超时 10 秒、关闭高精度 ---------- */
      function getPosition() {
        return new Promise(function (resolve, reject) {
          try {
            if (!navigator || !navigator.geolocation) {
              reject({ code: "unsupported" });
              return;
            }
            navigator.geolocation.getCurrentPosition(
              function (pos) {
                try {
                  resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                } catch (e) { reject({ code: "unknown" }); }
              },
              function (err) { reject(err || { code: "unknown" }); },
              { enableHighAccuracy: false, timeout: GEO_TIMEOUT, maximumAge: 60000 }
            );
          } catch (e) { reject({ code: "unknown" }); }
        });
      }

      /* ---------- 2. 逆地理：经纬度 → 中文城市名 ----------
         注：Open-Meteo 的 geocoding API 仅提供「地名 → 坐标」正向解析，
             无反向接口，故此处使用免密钥、允许浏览器跨域的服务（首选 BigDataCloud，
             失败则回退 OpenStreetMap Nominatim），两者均按中文返回地名。 */
      function reverseGeocode(lat, lon) {
        var primary = "https://api.bigdatacloud.net/data/reverse-geocode-client"
          + "?latitude=" + encodeURIComponent(lat)
          + "&longitude=" + encodeURIComponent(lon)
          + "&localityLanguage=zh";

        return fetchJsonWithTimeout(primary, REVERSE_TIMEOUT).then(function (d) {
          var name = d && (d.city || d.locality || d.principalSubdivision || d.countryName);
          if (!name || !String(name).trim()) throw new Error("empty primary result");
          return String(name).trim();
        }).catch(function () {
          var fallback = "https://nominatim.openstreetmap.org/reverse"
            + "?format=jsonv2&zoom=10&accept-language=zh-CN"
            + "&lat=" + encodeURIComponent(lat)
            + "&lon=" + encodeURIComponent(lon);
          return fetchJsonWithTimeout(fallback, REVERSE_TIMEOUT).then(function (d) {
            var a = (d && d.address) || {};
            var name = a.city || a.town || a.village || a.county || a.state || (d && d.name);
            if (!name || !String(name).trim()) throw new Error("empty fallback result");
            return String(name).trim();
          });
        });
      }

      /* ---------- 3. 回填输入框并复用既有主流程加载预报 ---------- */
      /* 传入已解析好的城市对象（含 GPS 精确坐标），跳过地名匹配直接拉取预报 */
      function loadForecast(city) {
        try {
          var inputEl = document.getElementById("cityInput");
          if (!inputEl) throw new Error("city input not found");
          inputEl.value = city.name;
          if (typeof handleCitySearch === "function") return handleCitySearch(undefined, city, true);
          throw new Error("handleCitySearch not available");
        } catch (e) {
          return Promise.reject(e);
        }
      }

      /* ---------- 4. 定位失败文案：按错误类型给出友好提示，页面停留在首页输入态 ---------- */
      function showLocateError(err) {
        var code = (err && err.code !== undefined) ? err.code : err;
        if (code === 1 || code === "PERMISSION_DENIED") {
          notice("🔒", "定位权限被拒绝",
            "浏览器未授予定位权限，无法自动获取位置。请在上方输入框中手动输入城市名称，或在系统设置中允许定位后重试。", true);
        } else if (code === 3 || code === "TIMEOUT") {
          notice("⏱", "定位请求超时",
            "10 秒内未获取到位置信息，可能信号较弱或权限受限。可点击「手动获取当前位置」重试，或直接在上方输入框中输入城市名称。", true);
        } else if (code === 2 || code === "POSITION_UNAVAILABLE") {
          notice("📵", "暂时无法获取当前位置",
            "设备的定位服务不可用，请检查系统定位开关是否已打开，或在上方输入框中手动输入城市名称查询。", true);
        } else if (code === "unsupported") {
          notice("🚫", "当前环境不支持定位",
            "此浏览器或运行环境未提供定位能力，请在上方输入框中手动输入城市名称查询。", true);
        } else {
          notice("⚠️", "定位失败",
            "获取位置时出现异常，请稍后重试，或在上方输入框中手动输入城市名称查询。", true);
        }
      }

      /* ---------- 5. 定位主流程：并发保护 + 全链路异常兜底 ---------- */
      var locating = false;

      function startLocate() {
        if (locating) return;
        locating = true;

        var btn = document.getElementById("locateNowBtn");
        var btnText = btn ? btn.innerText : "";
        try { if (btn) { btn.disabled = true; btn.innerText = "⏳ 正在定位..."; } } catch (e) {}

        function finish() {
          locating = false;
          try { if (btn) { btn.disabled = false; btn.innerText = btnText || "📡 手动获取当前位置"; } } catch (e) {}
        }

        notice("📡", "正在获取当前位置…",
          "已请求定位权限，取得坐标后将自动匹配最近城市并拉取气象模型数据。", false);

        getPosition().then(function (pt) {
          // 定位成功后直接采用 GPS 精确坐标拉取气象数据；
          // 逆地理结果仅作为页面展示的城市标题，失败时退回坐标文案，不再中断流程
          return reverseGeocode(pt.lat, pt.lon).then(
            function (name) { return name; },
            function () { return ""; }
          ).then(function (name) {
            return {
              name: name || formatCoordLabel(pt.lat, pt.lon),
              lat: pt.lat,
              lon: pt.lon,
              tz: Math.round(pt.lon / 15)
            };
          });
        }).then(function (city) {
          return loadForecast(city);
        }).catch(function (err) {
          showLocateError(err);
        }).then(finish, finish);
      }

      /* ---------- 6. 初始化：恢复开关状态、绑定手动按钮 ---------- */
      function init() {
        try {
          var cb = document.getElementById("autoLocateCheck");
          var on = readAutoFlag();

          if (cb) {
            cb.checked = on;
            cb.addEventListener("change", function () {
              try { writeAutoFlag(!!cb.checked); } catch (e) {}
            });
          }

          var btn = document.getElementById("locateNowBtn");
          if (btn) {
            btn.addEventListener("click", function () {
              try { startLocate(); } catch (e) {}
            });
          }

          // 仅在复选框为开启状态、且页面加载完成之后才自动定位；
          // 关闭时完全不触发定位，避免页面一打开就弹出权限申请。
          if (on && cb && cb.checked) {
            setTimeout(function () { try { startLocate(); } catch (e) {} }, 200);
          }
        } catch (e) {}
      }

      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", function () {
          try { init(); } catch (e) {}
        });
      } else {
        try { init(); } catch (e) {}
      }
    })();

// ==================== 7. 霞情通知（网页端 ⇄ 安卓 WebView 原生层） ====================
/*
 * 说明：
 *  · 前台：页面每次渲染完三天预报后，把「未来达标的朝霞 / 晚霞时段」交给安卓原生层，
 *    由原生层存 SQLite 并用 WorkManager / AlarmManager 定时，到点弹系统通知；
 *    页面自身不使用任何 JS 定时器来推送。
 *  · 后台：安卓 WorkManager 唤醒一个无界面 WebView 加载本页（?headless=1），
 *    复用同一套定位 / 拉数 / 评分逻辑，算完通过 onHeadlessDone 回传原生层。
 *  · 通知开关依赖「启动时自动获取位置加载预报」：未开启自动定位时不允许开启通知。
 */
(function () {
  "use strict";

  var NOTIFY_KEY      = "sunset-notify";       // 通知总开关："1" 开启 / "0" 关闭
  var NOTIFY_MODE_KEY = "sunset-notify-mode";  // 通知模式："mid"（≥中烧）| "all"（全部时段）
  var AUTO_KEY        = "sunset-auto-locate";  // 与定位模块共用同一开关键
  var MID_MIN         = 58;                    // GRADES 中「中烧」的分数下限
  var GEO_TIMEOUT     = 10000;

  /* ---------- 原生桥 / 本地存储 ---------- */
  function bridge() {
    try {
      if (typeof AndroidInterface !== "undefined" && AndroidInterface) return AndroidInterface;
    } catch (e) {}
    return null;
  }
  function readStr(k, dft) {
    try { var v = localStorage.getItem(k); return v === null ? dft : v; } catch (e) { return dft; }
  }
  function writeStr(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function notifyOn()  { return readStr(NOTIFY_KEY, "0") === "1"; }
  function allMode()   { return readStr(NOTIFY_MODE_KEY, "mid") === "all"; }
  function autoOn()    { return readStr(AUTO_KEY, "0") === "1"; }

  /* ---------- 时段 → 本地时间戳（今天 / 明天 / 后天的朝霞或晚霞时刻） ---------- */
  function slotWhen(meta, city) {
    try {
      var seg = String(meta.dateStr).split("-");
      var mm = parseInt(seg[0], 10), dd = parseInt(seg[1], 10);
      if (!mm || !dd || !city) return 0;
      var hm = String(estimateSunTime(city.lon, meta.type, city.tz)).split(":");
      var y = new Date().getFullYear();
      var t = new Date(y, mm - 1, dd, parseInt(hm[0], 10), parseInt(hm[1], 10), 0, 0).getTime();
      // 12 月末的「明天/后天」会跨到下一年，此时月份小于当前月，补正年份
      if (mm < new Date().getMonth() + 1) {
        t = new Date(y + 1, mm - 1, dd, parseInt(hm[0], 10), parseInt(hm[1], 10), 0, 0).getTime();
      }
      return t;
    } catch (e) { return 0; }
  }

  function gradeOf(score) {
    var g = GRADES[0];
    for (var i = 0; i < GRADES.length; i++) { if (score >= GRADES[i].min) g = GRADES[i]; }
    return g;
  }

  /* ---------- 当前展示的城市是否就是「定位城市」（按经纬度比对） ---------- */
  function isLocatedCity() {
    if (!locatedCity || !currentCityData) return false;
    return Math.abs(currentCityData.lat - locatedCity.lat) < 1e-6
        && Math.abs(currentCityData.lon - locatedCity.lon) < 1e-6;
  }

  /* ---------- 按定位城市数据 + 通知模式，生成未来提醒任务清单 ----------
   * 只有当前展示的城市就是「定位城市」时才生成提醒；手动搜索的城市仅用于页面展示，
   * 此时返回 null 表示「不改动既有提醒」。提醒内容恒以 locatedCity 为准，
   * 确保推送的永远是定位位置的霞情。 */
  function buildTasks() {
    if (!locatedCity || !isLocatedCity()) return null;
    var city  = locatedCity;
    var floor = Date.now() + 60 * 1000;   // 至少留 1 分钟，避免刚过点就推送
    var all   = allMode();
    var list  = [];

    for (var i = 0; i < SLOT_METAS.length; i++) {
      var m = SLOT_METAS[i];
      // v2.0：趋势扩展到 7 天，但系统提醒仍只推送前 3 天，避免长期占用闹钟
      if (m.dayIdx >= NOTIFY_DAYS) break;
      var p = city.slots[m.key];
      if (!p) continue;

      var res  = evaluateGlowBalanced(p, m.type);
      var when = slotWhen(m, city);
      if (!when || when <= floor) continue;
      if (!all && res.score < MID_MIN) continue;   // 「≥中烧」模式过滤

      var g = gradeOf(res.score);
      // 通知文案里的城市名去掉「国家·」前缀（示例：今日上海市的晚霞为中烧。）
      var cityPlain = String(city.name || "").replace(/^[^·]*·/, "");
      var dayWord = m.dayIdx === 0 ? "今日" : (m.dayIdx === 1 ? "明日" : "后天");
      list.push({
        key:     m.key,
        time:    when,
        score:   Math.round(res.score * 10) / 10,
        grade:   g.name,
        level:   g.level,
        city:    city.name,
        slot:    m.dayLabel + "·" + m.typeName,
        title:   m.typeName + " · " + g.name,
        content: dayWord + cityPlain + "的" + m.typeName + "为" + g.name + "。"
      });
    }

    list.sort(function (a, b) { return a.time - b.time; });
    return list;
  }

  /* ---------- 把任务清单交给原生层 ----------
   * · 通知 / 自动定位任一关闭 → 传空数组清空待办；
   * · 当前展示的不是定位城市 → 跳过同步，保持定位位置的提醒不被手动搜索覆盖。 */
  function syncTasks() {
    var br = bridge();
    if (!br || typeof br.addRemindTask !== "function") return -1;
    if (!(notifyOn() && autoOn())) {
      try { br.addRemindTask("[]"); } catch (e) { return -1; }
      return 0;
    }
    var tasks = buildTasks();
    if (tasks === null) return -1;
    try { br.addRemindTask(JSON.stringify(tasks)); } catch (e) { return -1; }
    return tasks.length;
  }

  /* 由 renderForecastDashboard 在每次渲染完成后调用 */
  window.__pushRemindTasks = function () {
    try { return syncTasks(); } catch (e) { return -1; }
  };

  /* ---------- 设置面板：通知开关 + 模式选择（依赖自动定位） ---------- */
  function refreshPanel() {
    var chk  = document.getElementById("notifyCheck");
    var box  = document.getElementById("notifyModes");
    var hint = document.getElementById("notifyHint");
    var auto = autoOn();
    var on   = notifyOn();

    if (chk) {
      chk.checked  = on && auto;
      chk.disabled = !auto;                 // 未开启自动定位时不允许开启通知
    }
    if (box) { box.className = "notify-modes" + ((on && auto) ? " open" : ""); }
    if (hint) {
      hint.innerText = !auto
        ? "需先开启「启动时自动获取位置加载预报」"
        : (on ? "已开启，将在达标时段推送提醒" : "关闭后不再推送任何提醒");
    }

    var opts = document.querySelectorAll("#notifyModes [data-mode]");
    for (var i = 0; i < opts.length; i++) {
      var active = (opts[i].getAttribute("data-mode") === (allMode() ? "all" : "mid"));
      opts[i].className = "notify-option" + (active ? " active" : "");
      opts[i].setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function bindPanel() {
    var chk = document.getElementById("notifyCheck");
    if (chk) {
      chk.addEventListener("change", function () {
        var want = !!chk.checked;
        if (want && !autoOn()) {            // 通知必须建立在自动定位已开启的基础上
          chk.checked = false;
          writeStr(NOTIFY_KEY, "0");
          refreshPanel();
          return;
        }
        writeStr(NOTIFY_KEY, want ? "1" : "0");
        refreshPanel();
        var n = syncTasks();
        var br = bridge();
        if (want && br && typeof br.showLocalNotification === "function") {
          try {
            br.showLocalNotification("霞情提醒已开启",
              n > 0 ? ("已安排 " + n + " 条提醒，到点将推送系统通知。") : "三天内暂无可推送的达标时段。");
          } catch (e) {}
        }
      });
    }

    var opts = document.querySelectorAll("#notifyModes [data-mode]");
    for (var i = 0; i < opts.length; i++) {
      opts[i].addEventListener("click", function () {
        writeStr(NOTIFY_MODE_KEY, this.getAttribute("data-mode") === "all" ? "all" : "mid");
        refreshPanel();
        syncTasks();
      });
    }

    // 自动定位开关变化时，通知可用状态随之联动（定位关闭 → 通知自动关闭）
    var autoChk = document.getElementById("autoLocateCheck");
    if (autoChk) {
      autoChk.addEventListener("change", function () {
        if (!autoChk.checked && notifyOn()) { writeStr(NOTIFY_KEY, "0"); syncTasks(); }
        refreshPanel();
      });
    }

    refreshPanel();
  }

  /* ---------- 后台无界面模式：复用同一定位 / 拉数 / 评分链路 ---------- */
  function headlessReport(payload) {
    var br = bridge();
    try {
      if (br && typeof br.onHeadlessDone === "function") br.onHeadlessDone(JSON.stringify(payload));
    } catch (e) {}
  }

  function headlessPosition() {
    return new Promise(function (resolve, reject) {
      try {
        if (!navigator || !navigator.geolocation) { reject({ code: "unsupported" }); return; }
        navigator.geolocation.getCurrentPosition(
          function (pos) { resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }); },
          function (err) { reject(err || { code: "unknown" }); },
          { enableHighAccuracy: false, timeout: GEO_TIMEOUT, maximumAge: 300000 }
        );
      } catch (e) { reject({ code: "unknown" }); }
    });
  }

  function headlessCityName(lat, lon) {
    var primary = "https://api.bigdatacloud.net/data/reverse-geocode-client"
      + "?latitude=" + encodeURIComponent(lat) + "&longitude=" + encodeURIComponent(lon)
      + "&localityLanguage=zh";
    return fetchJsonWithTimeout(primary, 5000).then(function (d) {
      var name = d && (d.city || d.locality || d.principalSubdivision || d.countryName);
      if (!name || !String(name).trim()) throw new Error("empty primary");
      return String(name).trim();
    }).catch(function () {
      var back = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=zh-CN"
        + "&lat=" + encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lon);
      return fetchJsonWithTimeout(back, 5000).then(function (d) {
        var a = (d && d.address) || {};
        var name = a.city || a.town || a.village || a.county || a.state || (d && d.name);
        if (!name || !String(name).trim()) throw new Error("empty fallback");
        return String(name).trim();
      });
    });
  }

  // 安卓 WorkManager 在无界面 WebView 中按名调用（属性名不会被混淆）
  window.__startHeadless = function () {
    if (!notifyOn() || !autoOn()) { headlessReport({ ok: false, reason: "disabled" }); return; }

    var input = document.getElementById("cityInput");
    if (!input || typeof handleCitySearch !== "function") {
      headlessReport({ ok: false, reason: "no-pipeline" });
      return;
    }

    headlessPosition().then(function (pt) {
      // 与前台一致：直接用 GPS 坐标拉数，逆地理仅作展示名，失败退回坐标文案
      return headlessCityName(pt.lat, pt.lon).then(
        function (name) { return name; },
        function () { return ""; }
      ).then(function (name) {
        return {
          name: name || formatCoordLabel(pt.lat, pt.lon),
          lat: pt.lat,
          lon: pt.lon,
          tz: Math.round(pt.lon / 15)
        };
      });
    }).then(function (city) {
      input.value = city.name;
      return handleCitySearch(undefined, city, true);
    }).then(function () {
      headlessReport({
        ok:    true,
        city:  currentCityData ? currentCityData.name : "",
        mode:  allMode() ? "all" : "mid",
        tasks: (buildTasks() || [])
      });
    }).catch(function (err) {
      headlessReport({ ok: false, reason: String((err && err.code) || err || "error") });
    });
  };

  /* ---------- 初始化 ---------- */
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", function () { try { bindPanel(); } catch (e) {} });
  } else {
    try { bindPanel(); } catch (e) {}
  }
})();

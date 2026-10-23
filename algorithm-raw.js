/*!
 * 火烧云预报系统 · 火烧云质量评测算法
 * Copyright (c) 2026 Sohp. All rights reserved.
 *
 * 本文件为著作权作品，受法律保护；未经书面许可，禁止复制、传播或二次分发。
 *
 * ---------------------------------------------------------------------------
 * 本文件只承载「霞情质量评测」相关逻辑，与页面渲染、定位、数据拉取、通知等
 * 业务代码完全分离。以后调整评分模型时，只需修改本文件，然后重新压缩：
 *
 *   python Android\tools\build_web.py minify .
 *
 * 对外暴露的全局符号（app.js 直接引用，勿改名）：
 *   · GRADES               8 级火烧云分级定义（等级 / 名称 / 分数区间 / 配色）
 *   · smoothSPenaltyCurve  平滑 S 型惩罚曲线（低云、光路阻断等通用压制系数）
 *   · evaluateGlowBalanced 主评分引擎：气象参数 → 0~100 分、等级、色谱与诊断
 * ---------------------------------------------------------------------------
 */

// ==================== 8级火烧云分级定义 ====================
const GRADES = [
  { level: 1, name: "不烧", min: 0, max: 14.9, hex: "#64748B", skyTop: "#0f172a", skyHorizon: "#334155" },
  { level: 2, name: "微烧", min: 15, max: 29.9, hex: "#C28B28", skyTop: "#1e293b", skyHorizon: "#b45309" },
  { level: 3, name: "小烧", min: 30, max: 44.9, hex: "#C8701A", skyTop: "#1e1b4b", skyHorizon: "#d97706" },
  { level: 4, name: "小到中烧", min: 45, max: 57.9, hex: "#C85A1E", skyTop: "#1e1b4b", skyHorizon: "#ea580c" },
  { level: 5, name: "中烧", min: 58, max: 69.9, hex: "#B84314", skyTop: "#2e1065", skyHorizon: "#ea580c" },
  { level: 6, name: "中到大烧", min: 70, max: 81.9, hex: "#A82424", skyTop: "#3b0764", skyHorizon: "#dc2626" },
  { level: 7, name: "大烧", min: 82, max: 91.9, hex: "#9E1C3E", skyTop: "#4a044e", skyHorizon: "#e11d48" },
  { level: 8, name: "世纪大烧", min: 92, max: 100.0, hex: "#6B2896", skyTop: "#2e1065", skyHorizon: "#ec4899" }
];

// ==================== 黄金平衡校准版火烧云物理量化引擎 ====================
function smoothSPenaltyCurve(val, freeLimit, severeLimit, freeKeep = 0.90, minFloor = 0.06) {
  if (val <= freeLimit) {
    return 1.0 - (val / freeLimit) * (1.0 - freeKeep);
  } else if (val <= severeLimit) {
    const t = (val - freeLimit) / (severeLimit - freeLimit);
    const cosDrop = 0.5 * (1 + Math.cos(Math.PI * t));
    return minFloor + (freeKeep - minFloor) * cosDrop;
  } else {
    return Math.max(0.03, minFloor - (val - severeLimit) * 0.002);
  }
}

function evaluateGlowBalanced(p, slotType = "pm") {
  const highC = 0.6 * p.ec_h + 0.4 * p.gfs_h;
  const midC  = 0.6 * p.ec_m + 0.4 * p.gfs_m;
  const lowC  = 0.6 * p.ec_l + 0.4 * p.gfs_l;

  const midBlockHighRatio = midC <= 65
    ? 1.0 - (midC / 65) * 0.18
    : Math.max(0.25, 0.82 - ((midC - 65) / 35) * 0.55);

  const usableHigh = highC * midBlockHighRatio;
  const usableMid  = midC <= 70 ? midC * 0.92 : Math.max(25, 70 * 0.92 - (midC - 70) * 0.85);

  const effCover = Math.min(100, Math.max(usableHigh, usableMid) + Math.min(usableHigh, usableMid) * 0.55);

  let canvasBase = 0;
  if (effCover <= 5) {
    canvasBase = effCover * 1.4;
  } else if (effCover <= 20) {
    canvasBase = 7 + (effCover - 5) * 1.9;
  } else if (effCover <= 42) {
    canvasBase = 35.5 + (effCover - 20) * 2.15;
  } else if (effCover <= 74) {
    canvasBase = 82.8 + (effCover - 42) * 0.53;
  } else {
    canvasBase = Math.max(45, 99.8 - (effCover - 74) * 1.6);
  }

  const localLowFactor = smoothSPenaltyCurve(lowC, 25, 68, 0.88, 0.06);

  const weightedRem = 0.35 * p.rem_100 + 0.40 * p.rem_250 + 0.25 * p.rem_400;
  const maxWall = Math.max(p.rem_100, p.rem_250, p.rem_400 * 0.90);
  const effectiveRemBlock = Math.min(100, 0.62 * weightedRem + 0.38 * maxWall);
  const rayFactor = smoothSPenaltyCurve(effectiveRemBlock, 28, 72, 0.88, 0.08);

  let thicknessFactor = 1.0;
  if (midC > 72) {
    thicknessFactor *= (1.0 - ((midC - 72) / 28) * 0.32);
  }
  if (p.rh > 78 && (midC + lowC) > 85) {
    thicknessFactor *= (1.0 - ((p.rh - 78) / 22) * 0.40);
  }

  let aodFactor = 1.0;
  const optMax = slotType === "am" ? 0.40 : 0.45;
  if (p.aod < 0.06) {
    aodFactor = 0.96;
  } else if (p.aod <= optMax) {
    aodFactor = 1.00;
  } else {
    aodFactor = Math.max(0.20, Math.exp(-1.25 * (p.aod - optMax)));
  }
  const envFactor = Math.max(0.20, thicknessFactor * aodFactor);

  const fMin  = Math.min(localLowFactor, rayFactor, envFactor);
  const fMean = (localLowFactor + rayFactor + envFactor) / 3.0;
  const worstTwoProduct = (localLowFactor * rayFactor * envFactor) / Math.max(localLowFactor, rayFactor, envFactor);
  const combinedTrans = Math.max(0.03, fMin * (0.68 + 0.32 * fMean) * (0.35 + 0.65 * Math.sqrt(worstTwoProduct)));

  const rawScore = canvasBase * combinedTrans;
  let score = Number(Math.max(0, Math.min(100, rawScore)).toFixed(1));

  // ==================== 降水 / 强对流「一票否决」熔断 ====================
  // 只看云量与 AOD 会在暴雨 / 雷暴天气误判：中高云往往满格，但地面根本抬不起头。
  // weather_code 为 WMO 天气现象码（95–99 雷暴冰雹、63/65 中到大雨、66/67 冻雨、
  // 81/82 强阵雨、45/48 浓雾、51–57/61/80 小到中雨），pop 为降水概率百分数。
  const pop = Number.isFinite(p.pop) ? p.pop : null;
  const wx  = Number.isFinite(p.wx) ? p.wx : null;
  let vetoCap = 100;
  let vetoMsg = "";
  if (wx !== null && wx >= 95) {
    vetoCap = 8;
    vetoMsg = `【强对流熔断】本地天气码 ${wx}（雷暴/冰雹），正处强对流云团中心，雨幕与大风完全遮蔽霞光，不建议外出观测。`;
  } else if (wx !== null && (wx === 63 || wx === 65 || wx === 66 || wx === 67 || wx === 81 || wx === 82 || wx === 45 || wx === 48)) {
    vetoCap = 22;
    vetoMsg = `【降水熔断】本地天气码 ${wx}（中到大雨/冻雨/强阵雨/浓雾），降水云团压境，霞光被雨幕遮挡。`;
  } else if (pop !== null && pop >= 85) {
    vetoCap = 45;
    vetoMsg = `【降水概率熔断】本地降水概率高达 ${pop}%，云系厚实且大概率落雨，可观赏窗口极小。`;
  } else if (wx !== null && ((wx >= 51 && wx <= 57) || wx === 61 || wx === 80) && pop !== null && pop >= 60) {
    vetoCap = 40;
    vetoMsg = `【降水概率熔断】本地为小到中雨天气（天气码 ${wx}）且降水概率 ${pop}%，霞光将被明显削弱。`;
  }
  if (score > vetoCap) score = Number(vetoCap.toFixed(1));

  let grade = GRADES[0];
  for (const g of GRADES) {
    if ((score >= g.min && score <= g.max) || (g.level === 8 && score >= 92)) {
      grade = g;
      break;
    }
  }

  let colorBias = "";
  let gradientCSS = "";
  const prefix = slotType === "am" ? "[朝霞] " : "[晚霞] ";
  if (grade.level === 1) {
    colorBias = prefix + "无明显霞光 (灰白/冷蓝天际)";
    gradientCSS = "linear-gradient(90deg, #475569, #64748b, #94a3b8)";
  } else if (p.aod > 0.58) {
    colorBias = prefix + "暗红偏灰褐 (高气溶胶消光衰减)";
    gradientCSS = "linear-gradient(90deg, #5c2c16, #8c2d19, #78716c)";
  } else if (highC >= 40 && p.aod >= 0.16 && p.aod <= 0.48 && p.rh >= 48) {
    colorBias = prefix + (slotType === "am" ? "玫瑰金/紫粉流霞 (清晨冰晶卷云折射)" : "梦幻紫红/洋红 (高层冰晶云+米氏散射叠加)");
    gradientCSS = "linear-gradient(90deg, #d97706, #dc2626, #db2777, #7e22ce)";
  } else if (p.aod >= 0.14 && p.aod <= 0.45) {
    colorBias = prefix + (slotType === "am" ? "赤金/亮橘红 (高饱和日出朝霞色谱)" : "浓郁橘红/绯红 (标准高饱和晚霞色谱)");
    gradientCSS = "linear-gradient(90deg, #d97706, #ea580c, #b91c1c, #7f1d1d)";
  } else {
    colorBias = prefix + "通透亮金/暖黄 (低气溶胶洁净大气色谱)";
    gradientCSS = "linear-gradient(90deg, #eab308, #d97706, #ea580c)";
  }

  let diag = "";
  if (effCover < 14) {
    diag = `【云幕不足】本地有效中高云幕仅 ${Math.round(effCover)}%，天空过于晴朗少云，缺乏承接霞光的“画布”。`;
  } else if (localLowFactor < 0.45) {
    diag = `【本地低云封堵】本地低云达 ${Math.round(lowC)}%（超出 25% 宽容阈值，透视率仅 ${(localLowFactor*100).toFixed(0)}%），低空浓云严重阻挡观测视线。`;
  } else if (rayFactor < 0.45) {
    const worstDist = p.rem_250 >= p.rem_100 && p.rem_250 >= p.rem_400 ? "250km中端" : (p.rem_100 >= p.rem_400 ? "100km近端" : "400km远端");
    diag = `【光路低云截断】${slotType === "am" ? "东向" : "西向"} ${worstDist}处存在浓密中低云墙（有效阻断 ${effectiveRemBlock.toFixed(0)}%），低角度阳光在半途被截断。`;
  } else if (envFactor < 0.68) {
    diag = `【大气消光/阴天厚云】高湿厚云或高气溶胶 (AOD=${p.aod}) 导致光线在传输中发生明显衰减（环境保留率 ${(envFactor*100).toFixed(0)}%）。`;
  } else {
    diag = `【气象条件优良】有效中高云幕充沛 (${Math.round(effCover)}%)，本地低云 (${Math.round(lowC)}%) 与远端光路阻断 (${effectiveRemBlock.toFixed(0)}%) 均在云隙透光宽容区内，适宜观赏拍摄！`;
  }

  // 降水 / 强对流熔断时，诊断文案优先说明真实原因（比云量诊断更贴近地面实况）
  if (vetoMsg) diag = vetoMsg;

  return {
    score, grade, colorBias, gradientCSS,
    highC, midC, lowC, effCover, effectiveRemBlock,
    canvasBase, localLowFactor, rayFactor, envFactor, combinedTrans, diag,
    pop, wx, veto: vetoMsg !== "", vetoReason: vetoMsg
  };
}

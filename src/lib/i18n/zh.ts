import { Translations } from './types';

export const zh: Translations = {
  langName: '繁體中文',
  langCode: 'zh',

  common: {
    continue: '繼續',
    back: '返回',
    submit: '提交',
    share: '分享',
    copied: '已複製！',
    newSurvey: '新建評估',
    totalScore: '總分',
    criteria: '項標準',
    minutes: '分鐘',
    skip: '跳過',
    startSurvey: '開始評估',
    loading: '載入中...',
    perMonth: '月',
    perYear: '年',
  },

  home: {
    systemTitle: '加盟店鋪選址評估系統',
    heroTitle: '🏆 選對店鋪 = 成功一半',
    heroDescription:
      '優質的選址可以將成功率提升50%，並節省數百萬營運成本。Phúc Tea的20項標準評估系統幫助您科學、準確、專業地評估店鋪位置。',
    badge20: '20項評估標準',
    badgeInstant: '即時結果',
    badgeShare: '分享結果',
    step1: '輸入地址',
    step2: '評分20項標準',
    step3: '獲取結果',
    startButton: '🚀 立即開始評估',
    historyButton: '評估歷史',
  },

  header: {
    subtitle: '店鋪選址評估',
  },

  modal: {
    title: '店鋪評估標準體系',
    step1Hint: '輸入地點和評估人員資訊。',
    step2Hint: '補充資訊（非必填）。',
    addressSection: '店鋪地址',
    required: '*必填',
    gpsButton: '獲取當前位置（GPS）',
    gpsLoading: '正在獲取位置...',
    streetPlaceholder: '門牌號、街道名 *',
    wardPlaceholder: '社區/鄉鎮（非必填）',
    districtPlaceholder: '區/縣 *',
    cityPlaceholder: '省/市 *',
    surveyorSection: '評估人員',
    surveyorPlaceholder: '評估人員姓名 *',
    landlordPlaceholder: '房東姓名',
    phonePlaceholder: '房東電話',
    rentPlaceholder: '租金（越南盾）',
    areaPlaceholder: '面積',
    competitorLabel: '競爭對手備註',
    competitorPlaceholder:
      '例如：50米外有貢茶，對面有Highland Coffee，附近有3家奶茶店...',
    additionalInfo: '補充資訊',
    optional: '（可選）',
    addressEntered: '已輸入地址',
    surveyorLabel: '評估人',
    notFound: '未找到',
    errorStreet: '請輸入街道地址',
    errorDistrict: '必填',
    errorCity: '必填',
    errorSurveyor: '請輸入評估人員姓名',
    errorGPS: '無法獲取位置，請允許GPS存取權限。',
    errorGPSNotSupported: '瀏覽器不支援GPS',
    fileTooLarge: '檔案過大（最大',
  },

  evaluate: {
    surveying: '正在評估',
    reviewAndSubmit: '審核並提交',
    reviewTitle: '📋 審核評分',
    reviewHint: '點擊評分可在提交前修改。',
    uploadTitle: '📸 店鋪照片和影片',
    uploadHint: '拍攝店面、室內及周邊區域照片。此步驟非必填。',
    uploadButton: '點擊選擇照片或影片',
    uploadLimit: '已達到10個檔案上限',
    uploadMaxSize: '照片最大10MB，影片最大50MB，最多10個檔案。',
    filesSelected: '個檔案已選',
    remainingCriteria: '項標準待評',
    viewResults: '查看評估結果',
    uploading: '正在上傳照片...',
    processing: '處理中...',
  },

  result: {
    notFound: '未找到評估結果',
    locationInfo: '📍 店鋪資訊',
    address: '地址',
    landlord: '房東',
    phone: '電話',
    rentPrice: '租金',
    area: '面積',
    surveyor: '評估人',
    surveyDate: '評估日期',
    competitor: '🏪 競爭對手',
    scoreByGroup: '📊 分類評分',
    quickReview: '📋 快速評估',
    strengths: '✅ 優勢',
    warnings: '⚠️ 需要注意',
    suggestions: '💡 建議',
    allAverage: '所有標準均為中等水準（3/5）。',
    images: '📸 店鋪照片',
    exportError: '無法匯出PDF，請重試。',
    smartSummaryFeasible:
      '店鋪達到良好標準。「{best}」是突出優勢（{bestPct}%）。{worstNote}',
    smartSummaryPotential:
      '店鋪具有潛力，「{best}」得分{bestPct}%。需要改善「{worst}」（{worstPct}%）以進一步優化。',
    smartSummaryRisky:
      '店鋪存在較多限制。「{worst}」僅得{worstPct}%，決策前需特別關注。',
  },

  history: {
    title: '評估歷史',
    surveysCompleted: '次評估已完成',
    noSurveys: '暫無評估記錄',
    noSurveysHint: '開始您的第一次店鋪評估',
    startFirst: '開始評估',
    clearHistory: '清除歷史',
    clearConfirm: '確定要清除所有評估歷史嗎？',
    newButton: '+ 新建',
  },

  map: {
    searching: '搜尋位置中...',
    hint: '點擊或拖動圖釘調整位置',
  },

  categories: [
    { id: 1, name: '位置與交通', icon: '📍' },
    { id: 2, name: '場地與空間', icon: '🏠' },
    { id: 3, name: '環境與法律', icon: '📋' },
    { id: 4, name: '潛力與成本', icon: '💰' },
  ],

  criteriaList: [
    {
      id: 1,
      name: '交通流量',
      description: '每日行人和車輛通行量',
      hint: '在尖峰時段（早7-9點、午11-13點、晚17-19點）在該位置觀察15-30分鐘，統計步行人數和車流量。',
      options: [
        { score: 1, label: '非常低（死胡同、人煙稀少）' },
        { score: 2, label: '較低（行人稀少的道路）' },
        { score: 3, label: '中等（小路、普通住宅區）' },
        { score: 4, label: '較高（大路、人口密集區）' },
        { score: 5, label: '非常高（市中心、大型交叉路口）' },
      ],
    },
    {
      id: 2,
      name: '可見度',
      description: '從遠處看到店鋪的容易程度',
      hint: '從兩個主要方向步行50-100米觀察，能否清楚看到該位置？是否被樹木或其他招牌遮擋？',
      options: [
        { score: 1, label: '非常差（從路上很難看到）' },
        { score: 2, label: '較差（被樹木或其他建築遮擋）' },
        { score: 3, label: '中等（需要走近才能看清）' },
        { score: 4, label: '良好（中等距離可見）' },
        { score: 5, label: '優秀（寬敞門面、視野開闊、無遮擋）' },
      ],
    },
    {
      id: 3,
      name: '周邊設施',
      description: '滿足客戶需求的周邊配套設施',
      hint: '在200-500米範圍內步行考察。記錄：學校、辦公大樓、市場、超市、醫院、公園、住宅區等。',
      options: [
        { score: 1, label: '非常少（偏僻地區、設施稀缺）' },
        { score: 2, label: '較少（主要是住宅）' },
        { score: 3, label: '中等（住宅區、少量商鋪）' },
        { score: 4, label: '較多（便利商店、市場、公園等）' },
        { score: 5, label: '非常多（商業中心、辦公大樓、學校等）' },
      ],
    },
    {
      id: 4,
      name: '停車位',
      description: '顧客停車便利性',
      hint: '檢查：是否有專用停車場？人行道是否足夠停放機車？附近是否有公共停車場？道路是否禁止停車？',
      options: [
        { score: 1, label: '無停車位' },
        { score: 2, label: '停車位極少' },
        { score: 3, label: '停車困難' },
        { score: 4, label: '停車位充足' },
        { score: 5, label: '寬敞便利' },
      ],
    },
    {
      id: 5,
      name: '大眾運輸',
      description: '大眾運輸可達性',
      hint: '在Google地圖上查找最近的公車站、捷運站。300米內是否有站點？有多少條路線經過？',
      options: [
        { score: 1, label: '非常不便（遠離公車站點）' },
        { score: 2, label: '不太方便（距公車站較遠）' },
        { score: 3, label: '中等（需步行一段到公車站）' },
        { score: 4, label: '便利（500米內有公車站）' },
        { score: 5, label: '非常便利（靠近公車站、捷運站）' },
      ],
    },
    {
      id: 6,
      name: '面積',
      description: '是否適合經營模式',
      hint: '參考Phúc Tea模式：4-20㎡→推車 | 20-50㎡→外帶店 | 50-150㎡→標準店 | 150㎡以上→旗艦店。測量或估算實際可用面積，然後選擇適合您想開的模式。',
      options: [
        { score: 1, label: '過小（不適合任何模式）' },
        { score: 2, label: '較小（僅適合推車，4-20㎡）' },
        { score: 3, label: '中等（適合外帶店，20-50㎡）' },
        { score: 4, label: '合適（標準店模式，50-150㎡）' },
        { score: 5, label: '非常寬敞（旗艦店模式，150㎡以上）' },
      ],
    },
    {
      id: 7,
      name: '場地形狀',
      description: '商業空間佈局便利性',
      hint: '觀察形狀：方形還是狹長？有沒有中間柱子、台階、死角？想像一下吧台、座位和倉庫的佈局。',
      options: [
        { score: 1, label: '空間局促、不便利' },
        { score: 2, label: '多稜角、有柱子、空間受限' },
        { score: 3, label: '不規則形狀、難以佈局' },
        { score: 4, label: '長方形、較容易佈局' },
        { score: 5, label: '方正、容易佈局' },
      ],
    },
    {
      id: 8,
      name: '門面',
      description: '門面寬度和吸引力',
      hint: '測量門面寬度（米）。3米以下為窄，4-6米為好，6米以上為寬。能否安裝大型招牌和醒目裝飾？',
      options: [
        { score: 1, label: '非常窄，難以吸引顧客' },
        { score: 2, label: '較窄' },
        { score: 3, label: '一般' },
        { score: 4, label: '可用作戶外空間' },
        { score: 5, label: '寬敞明亮' },
      ],
    },
    {
      id: 9,
      name: '結構與設施',
      description: '建築品質和現有設施',
      hint: '檢查：牆壁是否有裂縫？天花板是否漏水？電力系統（是否能承載攪拌機、冰箱等的功率？）、水源、排水、衛生間。',
      options: [
        { score: 1, label: '嚴重老化' },
        { score: 2, label: '較差，需大量維修' },
        { score: 3, label: '中等，需要改造' },
        { score: 4, label: '較好，需少量維修' },
        { score: 5, label: '堅固完好，設施齊全' },
      ],
    },
    {
      id: 10,
      name: '採光與通風',
      description: '光線和空氣條件',
      hint: '白天進入室內查看。是否有自然光？是否有窗戶、天窗？空間是否悶熱潮濕？',
      options: [
        { score: 1, label: '非常暗、悶、缺少空氣' },
        { score: 2, label: '偏暗、悶' },
        { score: 3, label: '中等' },
        { score: 4, label: '光線充足、通風良好' },
        { score: 5, label: '自然採光、通風良好' },
      ],
    },
    {
      id: 11,
      name: '治安狀況',
      description: '區域安全程度',
      hint: '向周邊居民詢問治安情況。觀察：區域是否有監控攝影機？夜間是否有路燈？附近是否有治安隱患？',
      options: [
        { score: 1, label: '非常差（治安複雜區域）' },
        { score: 2, label: '較差（存在一些安全問題）' },
        { score: 3, label: '中等' },
        { score: 4, label: '良好（治安有保障）' },
        { score: 5, label: '非常好（安全區域、治安良好）' },
      ],
    },
    {
      id: 12,
      name: '環境衛生',
      description: '周邊衛生狀況',
      hint: '觀察：周圍是否有垃圾、積水、異味？排水系統是否完善？下雨是否會積水？',
      options: [
        { score: 1, label: '污染嚴重' },
        { score: 2, label: '較髒、垃圾較多' },
        { score: 3, label: '中等' },
        { score: 4, label: '比較乾淨' },
        { score: 5, label: '乾淨整潔' },
      ],
    },
    {
      id: 13,
      name: '周邊景觀',
      description: '區域美觀度',
      hint: '360度拍攝周邊景觀照片。是否有綠化、公園？周邊建築是否美觀整潔？',
      options: [
        { score: 1, label: '非常差、令顧客不適' },
        { score: 2, label: '較差、影響店鋪形象' },
        { score: 3, label: '一般' },
        { score: 4, label: '開闊通透' },
        { score: 5, label: '優美、綠化豐富' },
      ],
    },
    {
      id: 14,
      name: '法律文件',
      description: '店鋪法律文件狀態',
      hint: '需核實：(1)房東是否為產權所有人？(2)是否有產權證？(3)該店鋪是否允許經營餐飲？(4)是否有法律糾紛？另外，建議向周邊居民了解未來道路規劃等資訊。',
      options: [
        { score: 1, label: '不合法' },
        { score: 2, label: '不明確' },
        { score: 3, label: '缺少部分重要文件' },
        { score: 4, label: '合法、需補充部分文件' },
        { score: 5, label: '齊全合法' },
      ],
    },
    {
      id: 15,
      name: '房東',
      description: '房東的信譽和合作意願',
      hint: '透過會面評估：房東是否熱情？是否有良好的出租記錄？是否有不合理要求？詢問前租戶（如有）。',
      options: [
        { score: 1, label: '不可信賴' },
        { score: 2, label: '難以合作' },
        { score: 3, label: '中等' },
        { score: 4, label: '容易合作' },
        { score: 5, label: '信譽好、態度積極' },
      ],
    },
    {
      id: 16,
      name: '租金',
      description: '與市場水準對比的租金',
      hint: '參考Phúc Tea模式合理租金：推車5百萬/月以下 | 外帶店7百萬/月以下 | 標準店12百萬/月以下 | 旗艦店30百萬/月以下。如高於參考價，相應選擇較低分。同時與周邊租金對比。',
      options: [
        { score: 1, label: '非常高（遠超參考價格）' },
        { score: 2, label: '偏高（高於參考價格）' },
        { score: 3, label: '中等（接近參考價格）' },
        { score: 4, label: '合理（低於參考價格）' },
        { score: 5, label: '非常合理（遠低於參考價格）' },
      ],
    },
    {
      id: 17,
      name: '發展潛力',
      description: '區域未來發展潛力',
      hint: '觀察：是否有在建工程？是否有規劃公告、新基建項目？住宅區是否在擴張？',
      options: [
        { score: 1, label: '非常低（區域有衰退風險）' },
        { score: 2, label: '較低（區域已穩定）' },
        { score: 3, label: '中等' },
        { score: 4, label: '較高（有增長潛力）' },
        { score: 5, label: '非常高（區域正在發展中）' },
      ],
    },
    {
      id: 18,
      name: '競爭狀況',
      description: '區域競爭程度',
      hint: '在500米範圍內步行，統計奶茶店、咖啡店、飲品店數量。記錄名稱和距離。',
      options: [
        { score: 1, label: '競爭對手眾多且實力強' },
        { score: 2, label: '競爭激烈' },
        { score: 3, label: '中等競爭' },
        { score: 4, label: '可以創造差異化' },
        { score: 5, label: '直接競爭對手少' },
      ],
    },
    {
      id: 19,
      name: '合約條款',
      description: '租賃合約的有利程度',
      hint: '審查：租期（至少3年）、漲價條件、押金、轉讓權、合約終止條件。',
      options: [
        { score: 1, label: '非常不利' },
        { score: 2, label: '不太有利' },
        { score: 3, label: '不夠明確' },
        { score: 4, label: '明確、一般' },
        { score: 5, label: '明確、有利' },
      ],
    },
    {
      id: 20,
      name: '經營靈活性',
      description: '改造店鋪的可能性',
      hint: '詢問房東：是否允許拆牆、重新粉刷、安裝戶外招牌、改造門面？是否有營業時間限制？',
      options: [
        { score: 1, label: '不允許任何改動' },
        { score: 2, label: '很難改動' },
        { score: 3, label: '靈活性較低' },
        { score: 4, label: '比較靈活' },
        { score: 5, label: '允許改造和裝修' },
      ],
    },
  ],

  verdicts: {
    feasible: {
      label: '可行',
      description: '店鋪符合要求，可以開展業務',
    },
    potential: {
      label: '有潛力',
      description: '有潛力，但需要協商/調整',
    },
    risky: {
      label: '風險較高',
      description: '風險較多，建議進一步考察或尋找其他店鋪',
    },
  },

  analysisData: {
    1: {
      strengthNote:
        '位置交通流量大，有利於自然獲客和提升外帶銷售額',
      weaknessNote:
        '交通流量低，自然客流少，難以發展自然銷售額',
      suggestion:
        '加強線上行銷，入駐外送平台（如GrabFood、ShopeeFood），投放社群媒體廣告以彌補自然客流不足',
    },
    2: {
      strengthNote:
        '店鋪遠處可見，門面醒目，有助於首次經過的顧客注意到',
      weaknessNote:
        '店鋪被遮擋，從路上難以看到，降低吸引新顧客的能力',
      suggestion:
        '投資醒目的LED招牌、旗幟橫幅或在主路易見位置設置廣告牌以提升品牌辨識度',
    },
    3: {
      strengthNote:
        '周邊配套設施豐富（學校、辦公大樓、市場），提供穩定客源',
      weaknessNote:
        '周邊設施缺乏，人流量少，潛在客源有限',
      suggestion:
        '重點建設忠實客戶群體，推行會員卡制度和老顧客優惠計畫',
    },
    4: {
      strengthNote:
        '停車位充足便利，有利於內用顧客，增加停留時間和消費',
      weaknessNote:
        '停車位不足，對顧客造成不便，尤其是騎機車和開車的顧客',
      suggestion:
        '協商租用額外停車位或與附近停車場合作。如不可行，重點發展外帶和外送模式',
    },
    5: {
      strengthNote:
        '靠近公車站、捷運站，大眾運輸便利，擴大客群覆蓋',
      weaknessNote:
        '遠離大眾運輸，限制了無私人交通工具的顧客群體',
      suggestion:
        '針對1-2公里範圍內居民進行精準行銷，發展外送服務以擴大服務範圍',
    },
    6: {
      strengthNote:
        '面積寬敞，適合完整佈置製作區、服務區和舒適的座位區',
      weaknessNote:
        '面積過小，難以佈置奶茶店營運所需的必要區域',
      suggestion:
        '優化小面積佈局設計：精簡吧台、主打外帶模式、使用節省空間的傢俱',
    },
    7: {
      strengthNote:
        '場地方正，便於高效佈局吧台、服務區和座位區',
      weaknessNote:
        '場地形狀不規則（不方正、多稜角），設備和座位佈置困難',
      suggestion:
        '聘請建築師根據場地形狀訂製佈局方案，利用角落作為展示區或私密座位',
    },
    8: {
      strengthNote:
        '門面寬敞通透，給顧客留下深刻印象，有利於品牌展示',
      weaknessNote:
        '門面狹窄，限制了吸引過路顧客的能力和戶外空間',
      suggestion:
        '用LED燈、戶外菜單板裝飾門面，創造性利用店前空間以吸引注意力',
    },
    9: {
      strengthNote:
        '結構堅固，設施完善（水電、排水），減少初期改造成本',
      weaknessNote:
        '結構較差，需大量維修投入，顯著增加初期成本',
      suggestion:
        '簽約前詳細估算維修費用。與房東協商分擔改造成本或在初期減免租金',
    },
    10: {
      strengthNote:
        '自然採光好，空間通透舒適，提升顧客體驗',
      weaknessNote:
        '缺乏自然採光和通風，空間悶熱影響顧客體驗',
      suggestion:
        '安裝溫馨的照明系統、通風扇或空調改善空間環境。使用鏡面和反光材料增加亮度',
    },
    11: {
      strengthNote:
        '區域治安良好，保障顧客和員工安全，尤其是夜間',
      weaknessNote:
        '區域存在治安問題，影響顧客和員工的安全感',
      suggestion:
        '安裝安防攝影機、戶外照明燈，考慮夜間班次聘請保全。聯繫當地警察局了解治安情況',
    },
    12: {
      strengthNote:
        '周邊環境整潔，有利於Phúc Tea品牌形象',
      weaknessNote:
        '區域髒亂，對品牌形象和顧客體驗產生負面影響',
      suggestion:
        '定期清潔店鋪前區域。設置垃圾桶和綠化植物直接改善周邊環境',
    },
    13: {
      strengthNote:
        '景觀優美、綠化豐富，營造適合奶茶品牌的休閒氛圍',
      weaknessNote:
        '周邊景觀差，對品牌形象和顧客感受產生負面影響',
      suggestion:
        '重點打造精美的室內裝修和打卡點來彌補。使用窗簾、綠植和橫幅遮擋外部不佳景觀',
    },
    14: {
      strengthNote:
        '法律文件齊全合法，保障長期經營的法律安全',
      weaknessNote:
        '法律文件不明確或不完整，存在法律風險隱患',
      suggestion:
        '要求房東在簽約前補齊所有文件。請律師審查店鋪的法律合規性',
    },
    15: {
      strengthNote:
        '房東信譽好、態度積極，有利於長期合作經營',
      weaknessNote:
        '房東難以合作、缺乏誠意，可能在經營過程中造成困難',
      suggestion:
        '擬定詳細合約，明確雙方權利義務。提前協商改造和裝修條件',
    },
    16: {
      strengthNote:
        '租金合理，有利於優化營運成本和提升利潤率',
      weaknessNote:
        '租金偏高，造成較大財務壓力，降低經營利潤率',
      suggestion:
        '重新協商租金，提出簽訂長期合約以獲取折扣。如租金超過預期營業額的15-20%，考慮替代店鋪',
    },
    17: {
      strengthNote:
        '區域發展潛力大，人口增長中，為未來營收增長創造機會',
      weaknessNote:
        '區域發展潛力有限，未來營收增長預期不佳',
      suggestion:
        '研究區域規劃：如有新基建項目（道路、住宅區）則考慮提前投資。如區域走向衰退，建議尋找其他位置',
    },
    18: {
      strengthNote:
        '區域內直接競爭對手少，有較大的市場份額機會',
      weaknessNote:
        '區域內競爭對手眾多且實力強，難以差異化和吸引顧客',
      suggestion:
        '分析競品菜單和定價，打造Phúc Tea差異化獨特產品。注重服務品質和會員忠誠度計畫',
    },
    19: {
      strengthNote:
        '合約條款清晰有利，保障長期經營權益',
      weaknessNote:
        '合約條款不利或不夠明確，對承租方存在潛在風險',
      suggestion:
        '重新協商不利條款，尤其是租期（至少3-5年）、漲租條件和轉讓權',
    },
    20: {
      strengthNote:
        '房東允許靈活改造，便於按標準裝修和營運',
      weaknessNote:
        '改造和變更受限，按Phúc Tea標準裝修存在困難',
      suggestion:
        '簽約前以書面形式明確允許改造的範圍。提供詳細的改造需求清單供房東審批',
    },
  },

  analysisFallback: {
    allGood: [
      '店鋪達到良好標準。請進行簽約並按Phúc Tea標準開始裝修',
      '儘早制定開業行銷計畫，充分利用選址優勢',
      '培訓員工並準備原材料，爭取最短時間內開業',
    ],
    fillers: [
      '制定詳細財務計畫，包括改造費用、前3個月營運成本和風險準備金',
      '在不同時段（早、中、晚）進行補充考察，以獲得更準確的評估',
      '諮詢Phúc Tea團隊獲取專業意見，做出更明智的決策',
    ],
  },
};

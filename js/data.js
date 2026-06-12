// ============================================================
// data.js — all game content: goods, regions, ports, ships,
// discoveries, ranks, story, flavor. All names are original.
// Display strings are {en, zh} pairs resolved by L() in lang.js.
// ============================================================

const DATA = {};

// ---------- Calendar ----------
DATA.MONTHS = [
  { en:"Frosthold",  zh:"霜寒月" }, { en:"Thawmoon",   zh:"解冻月" },
  { en:"Seedrise",   zh:"播种月" }, { en:"Rainveil",   zh:"雨幕月" },
  { en:"Brightsail", zh:"明帆月" }, { en:"Highsun",    zh:"盛阳月" },
  { en:"Goldcrest",  zh:"金穗月" }, { en:"Emberwane",  zh:"余烬月" },
  { en:"Harvestide", zh:"丰收月" }, { en:"Mistfall",   zh:"雾落月" },
  { en:"Stormwatch", zh:"风暴月" }, { en:"Deepwinter", zh:"深冬月" },
];
DATA.START_YEAR = 712;

// ---------- Trade goods ----------
DATA.GOODS = [
  { id:"grain",     name:{en:"Grain",        zh:"谷物"},     cat:"food",   base:20  },
  { id:"fish",      name:{en:"Salted Fish",  zh:"咸鱼"},     cat:"food",   base:28  },
  { id:"ale",       name:{en:"Barley Ale",   zh:"麦芽啤酒"}, cat:"food",   base:35  },
  { id:"oil",       name:{en:"Olive Oil",    zh:"橄榄油"},   cat:"food",   base:55  },
  { id:"wine",      name:{en:"Cellar Wine",  zh:"窖藏葡萄酒"},cat:"food",  base:62  },
  { id:"timber",    name:{en:"Timber",       zh:"木材"},     cat:"raw",    base:30  },
  { id:"hides",     name:{en:"Hides",        zh:"兽皮"},     cat:"raw",    base:38  },
  { id:"wool",      name:{en:"Wool",         zh:"羊毛"},     cat:"raw",    base:42  },
  { id:"iron",      name:{en:"Iron Ore",     zh:"铁矿石"},   cat:"raw",    base:48  },
  { id:"linen",     name:{en:"Linen Cloth",  zh:"亚麻布"},   cat:"craft",  base:72  },
  { id:"copper",    name:{en:"Copperware",   zh:"铜器"},     cat:"craft",  base:95  },
  { id:"glass",     name:{en:"Glasswork",    zh:"玻璃器皿"}, cat:"craft",  base:125 },
  { id:"clock",     name:{en:"Clockworks",   zh:"钟表机械"}, cat:"craft",  base:230 },
  { id:"tea",       name:{en:"Jadeleaf Tea", zh:"翠叶茶"},   cat:"spice",  base:135 },
  { id:"coffee",    name:{en:"Ember Coffee", zh:"余烬咖啡"}, cat:"spice",  base:145 },
  { id:"cocoa",     name:{en:"Cocoa",        zh:"可可"},     cat:"spice",  base:160 },
  { id:"pepper",    name:{en:"Pepper",       zh:"胡椒"},     cat:"spice",  base:155 },
  { id:"cinnamon",  name:{en:"Cinnamon",     zh:"肉桂"},     cat:"spice",  base:175 },
  { id:"nutmeg",    name:{en:"Nutmeg",       zh:"肉豆蔻"},   cat:"spice",  base:245 },
  { id:"silk",      name:{en:"Cloudsilk",    zh:"云绸"},     cat:"luxury", base:185 },
  { id:"porcelain", name:{en:"Porcelain",    zh:"瓷器"},     cat:"luxury", base:205 },
  { id:"amber",     name:{en:"Sea Amber",    zh:"海琥珀"},   cat:"luxury", base:265 },
  { id:"pearls",    name:{en:"Pearls",       zh:"珍珠"},     cat:"luxury", base:330 },
  { id:"golddust",  name:{en:"Gold Dust",    zh:"金沙"},     cat:"luxury", base:410 },
];
DATA.GOOD = {}; DATA.GOODS.forEach(g => DATA.GOOD[g.id] = g);

// ---------- Regions ----------
DATA.REGIONS = {
  velmara:   { name:{en:"The Velmaran Coast",  zh:"维尔玛拉海岸"}, danger:0.7,
               blurb:{en:"Green hills, old kingdoms, and busy harbors.", zh:"青翠的丘陵、古老的王国与繁忙的港湾。"} },
  norvik:    { name:{en:"The Norvik Fjords",   zh:"诺尔维克峡湾"}, danger:0.9,
               blurb:{en:"Cold cliffs, amber, and hardy whalers.", zh:"寒冷的峭壁、琥珀与坚韧的捕鲸人。"} },
  saridia:   { name:{en:"The Saridian Reach",  zh:"萨里迪亚岸域"}, danger:1.1,
               blurb:{en:"Sun-baked shores rich in coffee, glass, and gold.", zh:"烈日炙烤的海岸，盛产咖啡、玻璃与黄金。"} },
  jade:      { name:{en:"The Jade Reaches",    zh:"翠玉之域"},     danger:1.0,
               blurb:{en:"Ancient eastern empires of silk and porcelain.", zh:"古老的东方帝国，丝绸与瓷器之乡。"} },
  coralspan: { name:{en:"The Coralspan Isles", zh:"珊蔓群岛"},     danger:1.3,
               blurb:{en:"Spice islands scattered across warm shallows.", zh:"散落在温暖浅海上的香料群岛。"} },
  emberveil: { name:{en:"The Emberveil",       zh:"余烬之幕"},     danger:1.4,
               blurb:{en:"A far western frontier of cocoa and legends.", zh:"遥远的西方边疆，可可与传说之地。"} },
  midsea:    { name:{en:"The Open Meridian",   zh:"子午公海"},     danger:1.0,
               blurb:{en:"The wide blue heart of the world.", zh:"世界辽阔湛蓝的心脏。"} },
};

// ---------- Ports ----------
DATA.PORT_SPECS = [
  { id:"avelar",     name:{en:"Avelar",       zh:"阿维拉"},     region:"velmara",  x:66,  y:40,  size:3,
    produces:["grain","wool","wine"],        demands:["pepper","silk","tea"],
    desc:{en:"Your home port. Slate roofs, gull-cries, and the smell of tar and fresh bread.",
          zh:"你的母港。石板屋顶、海鸥啼鸣，还有柏油与新出炉面包的味道。"} },
  { id:"brindlemark",name:{en:"Brindlemark",  zh:"布林德马克"}, region:"velmara",  x:50,  y:16,  size:3,
    produces:["timber","ale","iron"],        demands:["cocoa","porcelain","cinnamon"],
    desc:{en:"A timber-built trade city, seat of the Meridian Trade Guild's high hall.",
          zh:"一座木造的商贸大城，子午商会总堂的所在地。"} },
  { id:"caelhaven",  name:{en:"Caelhaven",    zh:"凯尔港"},     region:"velmara",  x:40,  y:58,  size:2,
    produces:["fish","oil","linen"],         demands:["nutmeg","amber","clock"],
    desc:{en:"A fishing port famous for storm-lanterns and stubborn sailors.",
          zh:"以风暴灯和倔强水手闻名的渔港。"} },
  { id:"skelligvard",name:{en:"Skellig Vard", zh:"斯凯瓦德"},   region:"norvik",   x:84,  y:14,  size:2,
    produces:["fish","hides","amber"],       demands:["wine","grain","copper"],
    desc:{en:"Whalebone arches guard this frozen harbor of fur-clad traders.",
          zh:"鲸骨拱门守护着这座冰封的港口，商人们都裹着厚厚的毛皮。"} },
  { id:"isenmoor",   name:{en:"Isenmoor",     zh:"伊森摩尔"},   region:"norvik",   x:124, y:18,  size:1,
    produces:["iron","timber","hides"],      demands:["ale","oil","glass"],
    desc:{en:"An iron-mining outpost clinging to the fjord cliffs.",
          zh:"紧贴峡湾峭壁的铁矿前哨。"} },
  { id:"renzhou",    name:{en:"Renzhou",      zh:"仁州"},       region:"jade",     x:182, y:42,  size:3,
    produces:["silk","tea","porcelain"],     demands:["golddust","amber","clock"],
    desc:{en:"Lantern-lit canals and silk markets beneath a jade-tiled palace.",
          zh:"灯笼映照的运河与丝绸市集，翠瓦宫殿俯瞰全城。"} },
  { id:"kotashi",    name:{en:"Kotashi",      zh:"科塔什"},     region:"jade",     x:188, y:68,  size:2,
    produces:["porcelain","tea","copper"],   demands:["wool","hides","coffee"],
    desc:{en:"Terraced gardens above a harbor of red-sailed junks.",
          zh:"层层梯园之下，是停满红帆戎克船的港湾。"} },
  { id:"qansari",    name:{en:"Qansari",      zh:"坎萨里"},     region:"saridia",  x:96,  y:78,  size:3,
    produces:["coffee","glass","oil"],       demands:["timber","iron","fish"],
    desc:{en:"A domed bazaar-city where coffee is poured thick as honey.",
          zh:"圆顶林立的巴扎之城，这里的咖啡浓稠如蜜。"} },
  { id:"zafriya",    name:{en:"Zafriya",      zh:"扎芙莉亚"},   region:"saridia",  x:118, y:94,  size:2,
    produces:["golddust","glass","hides"],   demands:["grain","linen","wine"],
    desc:{en:"Gold-dust caravans end their desert march at these white quays.",
          zh:"金沙驼队穿越沙漠的旅程，在这片雪白的码头画上句号。"} },
  { id:"mirzad",     name:{en:"Mirzad",       zh:"米尔扎德"},   region:"saridia",  x:136, y:72,  size:2,
    produces:["coffee","linen","copper"],    demands:["silk","pearls","ale"],
    desc:{en:"A river-mouth port of spice barges and singing boatmen.",
          zh:"河口之港，香料驳船往来如梭，船夫的歌声不绝于耳。"} },
  { id:"tessara",    name:{en:"Tessara",      zh:"泰萨拉"},     region:"coralspan",x:162, y:104, size:2,
    produces:["pepper","cinnamon","fish"],   demands:["iron","glass","wool"],
    desc:{en:"Stilt-houses over turquoise water, heavy with the scent of pepper.",
          zh:"高脚屋立在碧绿的海水之上，空气中弥漫着浓重的胡椒香。"} },
  { id:"okkaro",     name:{en:"Okkaro",       zh:"奥卡罗"},     region:"coralspan",x:178, y:112, size:1,
    produces:["nutmeg","pearls","cocoa"],    demands:["grain","copper","ale"],
    desc:{en:"The world's only nutmeg groves grow on this volcanic isle.",
          zh:"全世界唯一的肉豆蔻林就生长在这座火山岛上。"} },
  { id:"maluna",     name:{en:"Maluna",       zh:"玛露娜"},     region:"coralspan",x:146, y:116, size:1,
    produces:["pearls","fish","cinnamon"],   demands:["linen","oil","clock"],
    desc:{en:"Pearl-divers' canoes dot the lagoon from dawn to dusk.",
          zh:"从黎明到黄昏，采珠人的独木舟点缀着环礁湖。"} },
  { id:"itzalco",    name:{en:"Itzalco",      zh:"伊察科"},     region:"emberveil",x:24,  y:66,  size:2,
    produces:["cocoa","golddust","hides"],   demands:["iron","glass","wine"],
    desc:{en:"Stone terraces rise from the jungle; drums echo over the bay.",
          zh:"石砌的阶台从丛林中拔地而起，鼓声回荡在海湾上空。"} },
  { id:"yarapan",    name:{en:"Yarapan",      zh:"亚拉潘"},     region:"emberveil",x:20,  y:98,  size:1,
    produces:["cocoa","timber","pepper"],    demands:["copper","ale","linen"],
    desc:{en:"A frontier anchorage beneath cliffs of ember-red rock.",
          zh:"余烬色峭壁之下的边疆锚地。"} },
  { id:"lumenbay",   name:{en:"Lumen Bay",    zh:"流明湾"},     region:"midsea",   x:84,  y:56,  size:2,
    produces:["fish","ale","wool"],          demands:["coffee","cocoa","pearls"],
    desc:{en:"A free port on a lonely mid-ocean isle — every flag is welcome here.",
          zh:"大洋中央孤岛上的自由港——任何旗帜在这里都受欢迎。"} },
  { id:"aurevia",    name:{en:"Aurevia",      zh:"奥雷维亚"},   region:"midsea",   x:104, y:124, size:1, hidden:true,
    produces:[], demands:[],
    desc:{en:"The lost haven of the Radiant Isle, found again at last.",
          zh:"光辉之岛上失落的避风港，如今终于重见天日。"} },
];

// ---------- Ships ----------
DATA.SHIPS = [
  { id:"sloop",    name:{en:"Harbor Sloop", zh:"港湾单桅船"}, price:2500,   hold:30,  maxCrew:12,  hull:60,  speed:8,  maneuver:10, maxCannons:4,
    desc:{en:"A weathered little sloop. Maren loved her anyway.", zh:"一艘饱经风霜的小单桅船。玛伦却一直深爱着她。"} },
  { id:"cutter",   name:{en:"Gull Cutter", zh:"海鸥快艇"}, price:8000,   hold:55,  maxCrew:16,  hull:85,  speed:10, maneuver:11, maxCannons:6,
    desc:{en:"Quick and nimble — a smuggler's darling.", zh:"轻快灵活——走私客的心头好。"} },
  { id:"brig",     name:{en:"Brigantine", zh:"双桅帆船"}, price:21000,  hold:95,  maxCrew:32,  hull:125, speed:9,  maneuver:8,  maxCannons:12,
    desc:{en:"The workhorse of the Meridian trade lanes.", zh:"子午海贸易航线上的主力干将。"} },
  { id:"caravel",  name:{en:"Trade Caravel", zh:"商用卡拉维尔帆船"}, price:36000,  hold:145, maxCrew:38,  hull:145, speed:9,  maneuver:7,  maxCannons:12,
    desc:{en:"Broad-bellied and dependable on long hauls.", zh:"腹宽体阔，长途航行的可靠伙伴。"} },
  { id:"schooner", name:{en:"Tern Schooner", zh:"燕鸥纵帆船"}, price:52000,  hold:115, maxCrew:30,  hull:115, speed:13, maneuver:12, maxCannons:10,
    desc:{en:"Flies close to the wind. Pirates hate chasing her.", zh:"贴着风飞驰，海盗最恨追她。"} },
  { id:"carrack",  name:{en:"Merchant Carrack", zh:"商用克拉克帆船"}, price:85000,  hold:250, maxCrew:64,  hull:210, speed:7,  maneuver:5,  maxCannons:18,
    desc:{en:"A floating warehouse for serious fortunes.", zh:"漂浮的仓库，承载大宗财富。"} },
  { id:"frigate",  name:{en:"War Frigate", zh:"武装巡防舰"}, price:125000, hold:165, maxCrew:95,  hull:265, speed:10, maneuver:8,  maxCannons:28,
    desc:{en:"Two gun decks and a bad reputation.", zh:"双层炮甲板，恶名远扬。"} },
  { id:"clipper",  name:{en:"Stormchaser Clipper", zh:"追风快剪船"}, price:165000, hold:185, maxCrew:55, hull:175, speed:15, maneuver:11, maxCannons:14,
    desc:{en:"The fastest hull ever launched on the Meridian.", zh:"子午海上下水过的最快的船。"} },
  { id:"galleon",  name:{en:"Royal Galleon", zh:"皇家盖伦帆船"}, price:210000, hold:330, maxCrew:130, hull:330, speed:8,  maneuver:6,  maxCannons:32,
    desc:{en:"A castle under sail. Nations envy her owner.", zh:"扬帆的城堡。列国都嫉妒她的主人。"} },
];
DATA.SHIP = {}; DATA.SHIPS.forEach(s => DATA.SHIP[s.id] = s);

// ---------- Discoveries ----------
DATA.DISCOVERY_SPECS = [
  { id:"shatteredarch",  name:{en:"The Shattered Arch", zh:"碎裂石拱"}, x:58,  y:52,  fame:12, reward:600,
    desc:{en:"A natural stone arch split by some ancient cataclysm.", zh:"一座天然石拱，被某场远古浩劫从中劈开。"} },
  { id:"sunkenbell",     name:{en:"The Sunken Bell of Old Vel", zh:"旧维尔沉钟"}, x:34, y:34, fame:20, reward:1500,
    desc:{en:"On still nights, a drowned cathedral bell tolls beneath the waves.", zh:"风平浪静的夜里，沉没大教堂的钟声仍在波涛之下回响。"} },
  { id:"whalebone",      name:{en:"Whalebone Shoals", zh:"鲸骨浅滩"}, x:100, y:24,  fame:14, reward:800,
    desc:{en:"Shallows littered with the ribs of leviathans.", zh:"浅滩上散落着巨兽的肋骨。"} },
  { id:"aurorapillars",  name:{en:"The Aurora Pillars", zh:"极光石柱"}, x:142, y:10,  fame:25, reward:2200,
    desc:{en:"Basalt columns that glow beneath the northern lights.", zh:"在北极光下泛着微光的玄武岩石柱。"} },
  { id:"frostflower",    name:{en:"Frostflower Fjord", zh:"霜花峡湾"}, x:70,  y:8,   fame:18, reward:1200,
    desc:{en:"A hidden fjord where ice blooms like white roses.", zh:"一处隐秘的峡湾，冰凌绽放如白玫瑰。"} },
  { id:"glasscliffs",    name:{en:"The Glass Cliffs", zh:"玻璃断崖"}, x:108, y:64,  fame:15, reward:900,
    desc:{en:"Desert heat and old lightning fused these cliffs to glass.", zh:"沙漠的酷热与远古的闪电将这片断崖熔成了玻璃。"} },
  { id:"mirageoasis",    name:{en:"The Mirage Coast", zh:"蜃景海岸"}, x:90,  y:96,  fame:16, reward:1000,
    desc:{en:"A shoreline that appears on no two charts in the same place.", zh:"任何两张海图上的位置都不相同的海岸线。"} },
  { id:"jadesteps",      name:{en:"The Jade Steps", zh:"翠玉阶梯"}, x:196, y:54,  fame:22, reward:1800,
    desc:{en:"Giant green terraces descending into the sea — carved by whom?", zh:"巨大的翠绿阶台一路没入海中——究竟是谁雕凿的？"} },
  { id:"singingcaves",   name:{en:"The Singing Caves", zh:"歌唱洞窟"}, x:170, y:84,  fame:17, reward:1100,
    desc:{en:"Tide-driven flutes of stone that play at every moonrise.", zh:"潮汐吹奏的石笛，每逢月升便会鸣响。"} },
  { id:"greatreef",      name:{en:"The Coralspan Great Reef", zh:"珊蔓大堡礁"}, x:158, y:122, fame:24, reward:2000,
    desc:{en:"A living rampart of coral a hundred leagues long.", zh:"绵延百里格的活珊瑚壁垒。"} },
  { id:"saffronatoll",   name:{en:"Saffron Atoll", zh:"番红花环礁"}, x:138, y:104, fame:13, reward:700,
    desc:{en:"A ring of golden sand around a lagoon of impossible blue.", zh:"一圈金色沙洲，环抱着蓝得不可思议的潟湖。"} },
  { id:"blackpearl",     name:{en:"The Black Pearl Banks", zh:"黑珍珠滩"}, x:188, y:120, fame:21, reward:1700,
    desc:{en:"Oyster beds that yield pearls dark as a starless night.", zh:"这里的牡蛎产出的珍珠，黑如无星之夜。"} },
  { id:"leviathan",      name:{en:"The Leviathan Graveyard", zh:"利维坦墓场"}, x:60,  y:118, fame:26, reward:2400,
    desc:{en:"Where the great sea-beasts go to die. The water tastes of salt and sorrow.", zh:"巨大海兽前来赴死之地。海水里有盐，也有哀伤。"} },
  { id:"embergeysers",   name:{en:"The Ember Geysers", zh:"余烬喷泉"}, x:10,  y:84,  fame:23, reward:1900,
    desc:{en:"Boiling jets paint the western cliffs in copper and rust.", zh:"沸腾的喷流把西方的峭壁染成铜色与铁锈色。"} },
  { id:"starfall",       name:{en:"Starfall Crater Isle", zh:"星陨环岛"}, x:36,  y:110, fame:28, reward:2600,
    desc:{en:"A perfectly round island born of a fallen star.", zh:"一颗陨星造就的浑圆小岛。"} },
  { id:"maidenwreck",    name:{en:"Wreck of the 'Golden Tern'", zh:"“金燕鸥号”残骸"}, x:76, y:74, fame:15, reward:950,
    desc:{en:"A famous treasure-ship, mast still standing above the swell.", zh:"著名的宝船，桅杆至今仍挺立在涌浪之上。"} },
  { id:"whisperstrait",  name:{en:"Whisper Strait", zh:"低语海峡"}, x:148, y:34,  fame:14, reward:850,
    desc:{en:"A narrow passage where every word returns as someone else's voice.", zh:"狭窄的水道，每句话传回来都变成了别人的声音。"} },
  { id:"sirenmirror",    name:{en:"Siren's Mirror Lagoon", zh:"海妖镜湖"}, x:128, y:118, fame:19, reward:1400,
    desc:{en:"Water so still it shows not your face, but your heart's wish.", zh:"水面静得照不出你的脸，只照出你心底的愿望。"} },
  { id:"twinlights",     name:{en:"The Twin Lighthouses", zh:"双子灯塔"}, x:44,  y:76,  fame:12, reward:650,
    desc:{en:"Two ancient towers, dark for centuries, on facing headlands.", zh:"相对而立的两座古塔，已经熄灭了数百年。"} },
  { id:"drownedlibrary", name:{en:"The Drowned Library", zh:"沉没书馆"}, x:96,  y:108, fame:35, reward:3500,
    desc:{en:"Marble halls of a sunken academy, shelves of stone tablets intact.", zh:"沉没学院的大理石厅堂，石板书架完好如初。"} },
  { id:"radiantisle",    name:{en:"The Radiant Isle", zh:"光辉之岛"}, x:104, y:122, fame:120, reward:12000, hidden:true,
    desc:{en:"Aurevia's lost home. Its lighthouse still burns with golden fire.", zh:"奥雷维亚失落的家园。岛上的灯塔仍燃着金色的火焰。"} },
];

// ---------- Ranks ----------
DATA.RANKS = [
  { fame:0,    title:{en:"Deckhand", zh:"见习水手"} },
  { fame:80,   title:{en:"Skipper", zh:"船老大"} },
  { fame:250,  title:{en:"Captain", zh:"船长"} },
  { fame:600,  title:{en:"Renowned Captain", zh:"知名船长"} },
  { fame:1200, title:{en:"Admiral", zh:"提督"} },
  { fame:2500, title:{en:"Legend of the Meridian", zh:"子午海传奇"} },
];

// ---------- Pirates ----------
DATA.PIRATE_NAMES = [
  {en:"Saltjaw", zh:"盐颚"}, {en:"the Red Moray", zh:"红海鳗"}, {en:"Grim Halvar", zh:"冷面哈尔瓦"},
  {en:"Widow Kess", zh:"寡妇凯丝"}, {en:"Bonesplice", zh:"接骨手"}, {en:"the Laughing Eel", zh:"笑鳗"},
  {en:"Iron Petra", zh:"铁娘佩特拉"}, {en:"Old Threefingers", zh:"三指老头"},
  {en:"the Gallows Gull", zh:"绞架海鸥"}, {en:"Mad Vintner", zh:"疯酒匠"},
];
DATA.PIRATE_SHIPS = [
  {en:"a corsair sloop", zh:"一艘海盗单桅船"}, {en:"a black-sailed cutter", zh:"一艘黑帆快艇"},
  {en:"a raider brig", zh:"一艘掠袭双桅船"}, {en:"a pirate junk", zh:"一艘海盗戎克船"},
  {en:"a reaver galley", zh:"一艘劫掠桨帆船"},
];

// ---------- Story ----------
DATA.STORY = [
  { id:"ch1",
    title:{en:"Chapter I — The Letter", zh:"第一章 · 信"},
    objective:{en:"Deliver Maren's letter to Guildmaster Odessa at the Trade Guild in BRINDLEMARK.",
               zh:"把玛伦的信送到【布林德马克】商会的会长奥德莎手中。"},
    text:{en:`Aunt Maren's letter, sea-stained and brief:<br><br><em>"Rowan — if you are reading this, the sloop is
yours. Take my last letter to Odessa at the Brindlemark guild hall. She owes me a favor, and you will
need it. The sea remembers Aurevia, even if the maps have forgotten.<br><br>— M."</em>`,
          zh:`姑母玛伦的信，浸着海水的痕迹，写得很短：<br><br><em>“罗文——你读到这封信时，那条单桅船就是你的了。
把我最后这封信带给布林德马克商会的奥德莎。她欠我一个人情，而你会用得上。就算海图都忘了奥雷维亚，
大海也还记得。<br><br>——玛伦”</em>`},
    doneText:{en:`Guildmaster Odessa reads the letter twice, then laughs like a foghorn. <em>"So the old shark
finally beached. Maren spent thirty years chasing Aurevia — a golden haven that vanished from every
chart three centuries ago. Most call it a fairy tale. She didn't."</em><br><br>She slides a worn journal
page across the desk. <em>"Her first clue. Something about a bell that still rings under the sea, west
of your home coast. Prove you're her blood — find it."</em>`,
              zh:`会长奥德莎把信读了两遍，随即发出雾号般的大笑。<em>“老鲨鱼终究还是搁浅了。玛伦花了三十年追寻
奥雷维亚——三百年前从所有海图上消失的黄金港。人人都说那是童话，她偏不信。”</em><br><br>
她把一页磨旧的日志推过桌面。<em>“这是她的第一条线索：在你家乡海岸以西，有一口至今仍在海底鸣响的钟。
证明你流着她的血——去找到它。”</em>`},
    rewardGold:1000, rewardFame:20 },
  { id:"ch2",
    title:{en:"Chapter II — The Sunken Bell", zh:"第二章 · 沉钟"},
    objective:{en:"Find THE SUNKEN BELL OF OLD VEL — somewhere in the waters west of the Velmaran coast.",
               zh:"找到【旧维尔沉钟】——就在维尔玛拉海岸以西的某片海域。"},
    text:{en:`Maren's journal page shows a rough sketch: a drowned cathedral, a bell, and a compass rose pointing
west of Caelhaven. In the margin: <em>"The bell of Old Vel rang the night Aurevia vanished. Listen on
still water."</em>`,
          zh:`玛伦的日志上画着潦草的素描：一座沉没的大教堂、一口钟，还有一枚指向凯尔港以西的罗盘玫瑰。
页边写着：<em>“奥雷维亚消失的那一夜，旧维尔的钟响了。在风平浪静的水面上侧耳倾听。”</em>`},
    doneText:{en:`Your crew falls silent as the bell tolls beneath the hull — once, twice, three times. The lookout
swears the sound spells out numbers. Etched into the recovered bell-clapper, you find the words:
<em>"WE FLED THE FIRE. THE LIBRARY KEEPS OUR COURSE."</em><br><br>A drowned library... scholars in
Qansari speak of one, lost in the southern sea. But first — word in every tavern is that the pirate
Captain Redwake hunts anyone asking about Aurevia. He found Maren's other journal pages first.`,
              zh:`钟声在船底之下响起——一声、两声、三声，全体船员都屏住了呼吸。瞭望手发誓那声音像是在念数字。
打捞上来的钟舌上刻着一行字：<em>“我们逃离了大火。书馆记着我们的航向。”</em><br><br>
沉没的书馆……坎萨里的学者们提到过，它失落在南方的海域。但在那之前——所有酒馆都在传：海盗船长
红潮专门猎杀打听奥雷维亚的人。玛伦其余的日志，先落到了他的手里。`},
    rewardGold:2500, rewardFame:40 },
  { id:"ch3",
    title:{en:"Chapter III — Redwake", zh:"第三章 · 红潮"},
    objective:{en:"Hunt down CAPTAIN REDWAKE. He prowls the open Meridian — keep sailing and he will find you.",
               zh:"追猎【红潮船长】。他在子午公海上游弋——继续航行，他自会找上门来。"},
    text:{en:`Captain Redwake of the <em>Cinder Queen</em> has Maren's stolen journal pages — and a habit of
burning ships that carry questions about Aurevia. The guild has quietly doubled the bounty. He is out
there on the open sea, and he knows your name.`,
          zh:`“烬后号”的红潮船长抢走了玛伦的日志残页——他还有个习惯：烧掉一切打听奥雷维亚的船。
商会悄悄把悬赏翻了一倍。他就在公海上的某处，而且他知道你的名字。`},
    doneText:{en:`Redwake's strongbox holds Maren's stolen pages, charred at the edges. One sketch matches the
bell-clapper's words: a marble library beneath the waves, south of the Saridian coast, near drowned
ruins. The final page ends mid-sentence: <em>"—the Library holds the heading. Aurevia lies where the
light still burns, south of all"</em>`,
              zh:`红潮的保险箱里果然藏着玛伦被抢走的日志，纸边已被烧焦。其中一幅素描与钟舌上的话对上了：
一座大理石书馆沉在波涛之下，就在萨里迪亚海岸以南、沉没的废墟附近。最后一页的字句戛然而止：
<em>“——书馆藏着航向。奥雷维亚就在灯火仍燃之处，在一切以南……”</em>`},
    rewardGold:6000, rewardFame:80 },
  { id:"ch4",
    title:{en:"Chapter IV — The Drowned Library", zh:"第四章 · 沉没书馆"},
    objective:{en:"Find THE DROWNED LIBRARY in the southern sea between Saridia and the Coralspan Isles.",
               zh:"在萨里迪亚与珊蔓群岛之间的南方海域，找到【沉没书馆】。"},
    text:{en:`Somewhere south of Qansari's coast, marble halls wait beneath the swell. Maren believed the
scholars of Aurevia recorded their sanctuary's true position before the sea took their academy.`,
          zh:`在坎萨里海岸以南的某处，大理石的厅堂在涌浪之下静候。玛伦相信，在大海吞没学院之前，
奥雷维亚的学者们记下了避风港真正的位置。`},
    doneText:{en:`Divers bring up a stone tablet, its carving sharp as the day it was cut: a lighthouse on a round
isle, and a single line of old script — <em>"South of the desert's gold, beyond the singing water,
our light endures."</em><br><br>The crew plots it at once: the far southern sea, below Zafriya's
latitude. The lighthouse of Aurevia still burns. Go and find it.`,
              zh:`潜水员捞起一块石板，刻痕锋利如新：一座圆岛上的灯塔，和一行古老的铭文——
<em>“在沙漠之金以南，越过歌唱之水，我们的灯火长明。”</em><br><br>
船员们立刻推算出方位：遥远的南方海域，在扎芙莉亚的纬度以南。奥雷维亚的灯塔仍在燃烧。去找到它。`},
    rewardGold:9000, rewardFame:120 },
  { id:"ch5",
    title:{en:"Chapter V — The Radiant Isle", zh:"第五章 · 光辉之岛"},
    objective:{en:"Sail the far southern Meridian and find THE RADIANT ISLE.",
               zh:"航向子午海最南端，找到【光辉之岛】。"},
    text:{en:`Every clue points to the deep south of the Meridian Sea. Somewhere past the trade lanes, past the
last charted reefs, a golden light has burned for three hundred years, waiting for someone to follow it home.`,
          zh:`所有线索都指向子午海的最南端。在贸易航线之外、最后一道有标注的暗礁之外，
一盏金色的灯火已经燃烧了三百年，等着有人循光归家。`},
    doneText:{en:`The horizon glows long before landfall — a lighthouse of white stone crowned in golden fire,
just as the tablet promised. Aurevia. The lost haven is real, its harbor intact, its light tended all
these years by the descendants of those who fled.<br><br>They open their harbor to the world — and name
you its first Honorary Harbormaster. Maren's thirty-year chase is finished by her own blood.<br><br>
<strong>You have found Aurevia. The Meridian Sea will sing your name for a hundred years.</strong><br><br>
<em>The voyage continues — the sea is still wide, and you are free to sail it.</em>`,
              zh:`远未靠岸，地平线已经亮起——一座白石灯塔顶着金色的火焰，与石板上的铭文分毫不差。
奥雷维亚。失落的避风港是真的：港湾完好无损，灯火三百年来一直由当年逃亡者的后人守护。<br><br>
他们向世界敞开了港口——并尊你为首任名誉港务长。玛伦三十年的追寻，由她的血脉画上了句号。<br><br>
<strong>你找到了奥雷维亚。子午海将传唱你的名字一百年。</strong><br><br>
<em>航程仍在继续——大海依旧辽阔，任你扬帆。</em>`},
    rewardGold:25000, rewardFame:500 },
];

// ---------- Flavor ----------
DATA.SEA_FLAVOR = [
  {en:"Dolphins race the bow wave, laughing in their own tongue.", zh:"海豚追逐着船头浪，用它们自己的语言大笑。"},
  {en:"A lone albatross circles the mast three times, then heads north.", zh:"一只孤独的信天翁绕着桅杆盘旋三圈，然后向北飞去。"},
  {en:"The cook's stew is, against all odds, excellent today.", zh:"厨子的炖菜今天出乎所有人意料地好吃。"},
  {en:"Flying fish skitter across the deck. The cat is delighted.", zh:"飞鱼掠过甲板，船上的猫高兴坏了。"},
  {en:"Someone carves a tiny lighthouse from a whale's tooth.", zh:"有人用鲸牙雕了一座小小的灯塔。"},
  {en:"The night sky is so clear the crew falls silent at the rail.", zh:"夜空清澈得让船员们倚着船舷说不出话来。"},
  {en:"An old hand teaches the cabin kid to splice rope.", zh:"一位老水手在教船舱小子接绳结。"},
  {en:"Phosphorescent algae turn the wake into a river of stars.", zh:"发光的海藻把尾流变成了一条星河。"},
];
DATA.TAVERN_NAMES = [
  {en:"The Drowned Anchor", zh:"沉锚酒馆"}, {en:"The Gilded Gull", zh:"镀金海鸥"},
  {en:"The Wandering Tide", zh:"流浪潮汐"}, {en:"The Salt & Candle", zh:"盐与烛"},
  {en:"The Mermaid's Purse", zh:"美人鱼的钱袋"}, {en:"The Rusty Sextant", zh:"锈蚀六分仪"},
  {en:"The Last Lantern", zh:"最后一盏灯"}, {en:"The Crow's Rest", zh:"鸦栖居"},
];

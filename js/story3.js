// 《走进天津》第三章剧本数据：C3 中奖 → C4 相声茶馆 → C5 多结局
const CHAPTER3 = {
  achievements: {
    penggen: '天降捧哏',
    cold: '冷场王',
  },

  nodes: {
    // ================= C3 中奖环节 =================
    c3_in: {
      type: 'narrate', bg: 'counter',
      text: '「结账，一共 298。」你扫码的手在抖。就在这时，服务员从围裙里掏出一张红纸，神秘一笑：「先生，消费满二百——抽个奖！」',
      next: 'c3_scratch',
    },
    c3_scratch: {
      type: 'scratch', bg: 'counter',
      prompt: '刮刮乐的涂层闪闪发光，像在嘲笑你的余额。用鼠标刮开它。',
      next: 'c3_win',
    },
    c3_win: {
      type: 'narrate', bg: 'counter', sfx: 'win',
      text: '全场广播：恭—喜—您—中—奖—啦！服务员带头鼓掌，两个顾客也跟着鼓掌，气氛虚假又热烈。',
      effects: { luck: 1 },
      next: 'c3_roll',
    },
    c3_roll: {
      type: 'route',
      rules: [
        { when: G => G.luck >= 5, next: 'c3_p1' },
        { when: G => G.luck >= 2, next: 'c3_p3' },
        { when: G => G.luck >= 0, next: 'c3_pm' },
      ],
      fallback: { next: 'c3_none' },
    },
    c3_p1: {
      type: 'narrate', bg: 'counter',
      text: '一等奖：相声茶馆 VIP 门票两张，外加花篮一个！服务员把花篮塞进你怀里：「先生，一会儿去茶馆，记得戴帽子。」',
      effects: { flag: 'vip' },
      next: 'c4_in',
    },
    c3_p3: {
      type: 'narrate', bg: 'counter',
      text: '三等奖：相声茶馆门票一张。服务员真诚地说：「好运气！」你也真诚地信了。',
      next: 'c4_in',
    },
    c3_pm: {
      type: 'narrate', bg: 'counter',
      text: '纪念奖：相声茶馆门票一张。包装上印着小字：「其实就想要你来听相声。」',
      next: 'c4_in',
    },
    c3_none: {
      type: 'narrate', bg: 'counter',
      text: '谢谢惠顾。三个字长得像你这趟旅程的总结。服务员挠挠头：「介……要不，门口现买一张？一块钱。」',
      next: 'c3_buy',
    },
    c3_buy: {
      type: 'choice', bg: 'counter',
      prompt: '茶馆门票特价：1.00 元',
      warn: '注意：玩家您的余额不足，如要继续游戏，请充值',
      options: [
        { label: '充值 1 元买票', cls: 'money', effects: { achieve: 'sucker' }, next: 'c3_bought' },
        { label: '算了，回家', cls: 'danger', next: 'c3_leave' },
      ],
    },
    c3_bought: {
      type: 'narrate', bg: 'counter',
      text: '充值成功。系统感谢你对哏都文化事业的支持。（本游戏所有充值均为 1 元，童叟无欺）',
      next: 'c4_in',
    },
    c3_leave: {
      type: 'narrate', bg: 'black',
      text: '你把没中的奖券叠好放进口袋。海河的风从身后吹过来，像是在说：下次再来。',
      next: 'e2',
    },

    // ================= C4 相声茶馆 =================
    c4_in: {
      type: 'narrate', bg: 'teahouse',
      text: G => G.flags.vip
        ? '茶馆经理看到你怀里的花篮，肃然起敬，把你领到第一排正中的茶桌。邻座大爷主动给你挪了挪瓜子盘。'
        : '验票，入座。盖碗茶、瓜子碟、惊堂木，三件套齐活。红幕布后头，演员正在垫活儿。',
      next: 'seat1',
    },
    seat1: {
      type: 'choice', bg: 'teahouse',
      prompt: '台上正说到热闹处。你面前有几件事可做——',
      options: [
        { label: '嗑瓜子', effects: { count: 'gua' }, next: 'gua_gate' },
        { label: '举手点段子', effects: { count: 'dian' }, next: 'dian_gate' },
        { label: '上台捧哏（贯口 QTE）', next: 'qte1' },
        { label: '茶凉了，散场回家', next: 'c4_out' },
      ],
    },

    // ---------- 嗑瓜子 ----------
    gua_gate: {                                       // 每人限嗑十把，第十一把起茶馆没货了
      type: 'route',
      rules: [{ when: G => (G.counts.gua || 0) <= 10, next: 'gua_rnd' }],
      fallback: { next: 'gua_full' },
    },
    gua_full: {
      type: 'narrate', bg: 'teahouse',
      text: () => [
        '你伸手往碟里一抓——空的。跑堂大爷拎着空簸箕看你：「介客，整个茶馆的瓜子，让您一个人造完了。」',
        '瓜子碟见了底。后厨传来一声脆响，据说是库房保管员看到记账单时拍碎了自己的茶杯。',
        '跑堂的小哥委婉地表示：本茶馆的瓜子供应链，已被您凭一己之力打崩。建议您改行收瓜子皮，转手还能赚一笔。',
        '您又伸手，邻桌默默把自己的碟往边挪了三公分，护住。全茶馆的碟都在往中间聚——远离您。',
        '大爷递给您一撮茶叶末子：「瓜子是真没了，高末儿管够。您明儿请早吧。」',
      ][Math.floor(Math.random() * 5)],
      next: 'seat1',
    },
    gua_rnd: {
      type: 'random',
      branches: [
        { next: 'gua_a' },
        { next: 'gua_b' },
      ],
    },
    gua_a: {
      type: 'narrate', bg: 'teahouse', sfx: 'guazi',
      text: '你嗑得正香，邻桌大爷的话匣子开了盖：从三个孩子的婚事讲到天津卫的早点摊，讲到激动处一拍大腿，瓜子都震跳了。相声一段没听完，大爷神清气爽，起身抱拳：「介孩子，实在！回见您呐！」',
      next: 'seat1',
    },
    gua_b: {
      type: 'narrate', bg: 'teahouse', sfx: 'guazi',
      text: '你安静地嗑完一把瓜子，壳全留在自己碟里。隔壁桌大姐多看了你一眼：「介孩子，讲究。」',
      effects: { luck: 1 },
      next: 'seat1',
    },

    // ---------- 点段子 ----------
    dian_gate: {                                      // 条子递了十张，演员记住你了
      type: 'route',
      rules: [{ when: G => (G.counts.dian || 0) <= 10, next: 'dian1' }],
      fallback: { next: 'dian_full' },
    },
    dian_full: {
      type: 'narrate', bg: 'teahouse',
      text: () => [
        '你刚举手，跑堂的小哥一个箭步过来按住：「这位客，您点的段子，够说明年一整场专场了。让别的客人也说说呗。」',
        '你举手举到一半——满厅的手齐刷刷按下来，邻座大妈低声道：「行了行了，让他歇歇，也让你歇歇。」',
        '演员看见你的胳膊抬起来，当场在台上给大伙儿鞠了一躬：「介位客人，点了十个段子了。再说，就成他的专场了。」全场哄笑，掌声比说相声时还响。',
        '经理亲自过来添茶：「客官，您点的段子累计四十七分钟，已超过本茶馆单人额度。要不……您上来自己说？」',
        '递条子的手被你默默收回来。桌上不知何时多了一张小卡片：「点段子服务·今日已售罄」。背面是演员的亲笔：「高抬贵手。」',
      ][Math.floor(Math.random() * 5)],
      next: 'seat1',
    },
    dian1: {
      type: 'input', bg: 'teahouse',
      prompt: '你举手递了条子。演员接过来，眯眼一看：「这位客人，点了个——」',
      placeholder: '写下你的关键词',
      capture: true,
      next: 'dian2',
    },
    dian2: {
      type: 'narrate', bg: 'teahouse',
      text: G => `「${G.input || '随便'}」？介词儿新鲜！演员当场现挂了三分钟，句句绕着它走，满堂彩。邻座大妈冲你竖大拇指：「介孩子，有词儿！」`,
      effects: { luck: 2 },
      next: 'seat1',
    },

    // ---------- 捧哏 QTE ----------
    qte1: {
      type: 'qte', bg: 'teahouse',
      prompt: '捧哏演员一个话头甩下台，正砸你脑门上：「您说——」接！在节奏断掉之前接上！',
      ms: 5200, step: 9,
      win: 'c4_win', fail: 'c4_lose',
    },
    c4_win: {
      type: 'narrate', bg: 'teahouse',
      text: '你接得严丝合缝！台柱子一愣，随即冲你招手：「介位客人，替我捧！」你被请上台，一段贯口下来，满堂炸开。有人喊：「留他说相声！」（成就：天降捧哏）',
      effects: { luck: 3, achieve: 'penggen', flag: 'stage' },
      next: 'c4_out',
    },
    c4_lose: {
      type: 'narrate', bg: 'teahouse',
      text: '你张嘴慢了半拍。全场安静了三秒——那三秒里，你回顾了自己的一生。台柱子淡定圆场：「介客人，捧得含蓄。」（成就：冷场王）',
      effects: { luck: -1, achieve: 'cold' },
      next: 'seat1',
    },

    // ---------- 散场 → C5 结局判定 ----------
    c4_out: {
      type: 'narrate', bg: 'teahouse',
      text: '散场。台柱子携全体演员鞠躬：「天津卫，欢迎再来！」宫灯晃了晃，像是整座城在跟你点头。',
      next: 'c5_route',
    },
    c5_route: {
      type: 'route',
      rules: [
        { when: G => G.achievements.length >= 7 && G.flags.takeout, next: 'e3' },
        { when: G => G.luck >= 8 || G.flags.stage, next: 'e1' },
      ],
      fallback: { next: 'e2' },
    },

    // ================= C5 结局 =================
    e1: {
      type: 'summary', bg: 'haihe',
      title: '结局 E1 ·「天津，真好玩」',
      text: '海河夜风，解放桥亮灯，游船的汽笛像一声悠长的「好——嘞——」。你把这座城吃明白了，也听明白了。下次还来，带朋友来。',
      options: [
        { label: '重新来过', restart: true },
      ],
    },
    e2: {
      type: 'summary', bg: 'station',
      title: '结局 E2 ·「下次再来」',
      text: '高铁站，人山人海。你挥手告别，像告别一个没嗑完的瓜子。天津接过你刷的那张身份证，说：下次再来。',
      options: [
        { label: '重新来过', restart: true },
      ],
    },
    e3: {
      type: 'summary', bg: 'waitang',
      title: '隐藏结局 E3 ·「留在天津」',
      text: '那个打包的塑料袋，你第二天没舍得扔。茶馆老板看见它，盯了你三秒：「介孩子，实在。」当晚，你穿上了跑堂褂子，端茶、递瓜子、挨大爷教育——你留在了哏都。（隐藏结局达成）',
      options: [
        { label: '重新来过', restart: true },
      ],
    },
  },
};

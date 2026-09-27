// 《走进天津》第一章剧本数据
const CHAPTER1 = {
  start: 'title',

  achievements: {
    undecided: '犹豫不决',
    mouthpiece: '天津嘴替',
    host: '反客为主',
    sucker: '冤大头',
    serendipity: '无心插柳',
    ironlegs: '铁腿',
    nohands: '动手能力为负',
    reincarnation: '轮回',
    overslept: '坐过站',
  },

  nodes: {
    // ================= 序章 =================
    title: {
      type: 'title', bg: 'black',
      text: '走进天津',
      next: 'name',
    },
    name: {
      type: 'input', bg: 'black',
      prompt: '系统：请输入玩家昵称',
      placeholder: '不填就叫「游客」',
      default: '游客',
      next: 'tutorial',
    },
    tutorial: {
      type: 'narrate', bg: 'black',
      text: '系统提示：本游戏包含【成就】与【幸运值】系统。你的每一个选择都将被记录。（大概）',
      next: 'c1',
    },

    // ================= C1 出行方式 =================
    c1: {
      type: 'choice', bg: 'black',
      prompt: '请选择您的出行方式',
      warn: '注意：该选择将影响后续剧情，请谨慎决定',
      hover: { ms: 10000, achieve: 'undecided' },
      options: [
        { label: '坐地铁', next: 'sub1' },
        { label: '打车', next: 'tax1' },
        { label: '步行', next: 'walk1' },
        { label: '骑行', next: 'bike1' },
      ],
    },

    // ---------- 1A 地铁 ----------
    sub1: {
      type: 'narrate', bg: 'subway',
      text: '1号线，财经大学上车，刘园方向。车厢晃晃悠悠，像这座城市的节奏。',
      next: 'sub2',
    },
    sub2: {
      type: 'choice', bg: 'subway',
      prompt: '旁边一位天津大爷打开了话匣子：「您猜怎么着——介天津卫，倍儿棒！」他看着你。',
      oneCol: true,
      options: [
        { label: '接话：「那是真棒！」', effects: { luck: 1, achieve: 'mouthpiece' }, next: 'sub_yes' },
        { label: '戴上耳机装睡', effects: { luck: -1 }, next: 'sub_no' },
      ],
    },
    sub_yes: {
      type: 'narrate', bg: 'subway',
      text: '大爷眼睛一亮：「介小伙子，会聊天！」于是大爷跟你从煎饼馃子聊到海河跳水，全程未停。',
      effects: { flag: 'chat_uncle' },
      next: 'sub_s1',
    },
    sub_no: {
      type: 'narrate', bg: 'subway',
      text: '你闭上眼。大爷转头跟前排乘客聊了一路。你错过了天津的一半热情。',
      next: 'sub_s1',
    },

    // ---------- 1A-2 报站链（1号线真实站序，财经大学上车往刘园：华山里→复兴门→陈塘庄→土城→南楼→…→刘园） ----------
    sub_s1: {
      type: 'choice', bg: 'subway', announce: '华山里', oneCol: true,
      prompt: '广播响了。大爷一拍大腿：「华山里！介站下，走两步就是饭馆！」',
      options: [
        { label: '听人劝，下车', next: 'arrive' },
        { label: '摇头：「还没到睡着的程度」', next: 'sub_s2' },
      ],
    },
    sub_s2: {
      type: 'choice', bg: 'subway', announce: '复兴门', oneCol: true,
      prompt: '「复兴门到了。」大爷眯着眼打量你：「好嘛，介孩子是要在车上过夜。」',
      options: [
        { label: '赶紧下车', next: 'arrive' },
        { label: '稳如泰山', next: 'sub_s3' },
      ],
    },
    sub_s3: {
      type: 'choice', bg: 'subway', announce: '陈塘庄', oneCol: true,
      prompt: '「陈塘庄到了。」大爷掏出保温杯喝了口茶：「行，介是考验谁呢。」',
      options: [
        { label: '见好就收', next: 'arrive' },
        { label: '继续坐', next: 'sub_s4' },
      ],
    },
    sub_s4: {
      type: 'choice', bg: 'subway', announce: '土城', oneCol: true,
      prompt: '「土城到了。」大爷已经开始跟邻座介绍你：「介哥们儿，从财经大学坐到现在，一站没下。」',
      options: [
        { label: '社死，夺门而逃', next: 'arrive' },
        { label: '面不改色', next: 'sub_s5' },
      ],
    },
    sub_s5: {
      type: 'choice', bg: 'subway', announce: '南楼', oneCol: true,
      prompt: '「南楼到了。」大爷起身拎包：「我到了。再往刘园可就坐过站了，您慢些玩。」',
      options: [
        { label: '跟大爷一起下车', next: 'arrive' },
        { label: '坐到终点', effects: { luck: 1, achieve: 'overslept' }, next: 'sub_end' },
      ],
    },
    sub_end: {
      type: 'narrate', bg: 'subway', announce: '刘园',
      text: '再睁眼时，广播响了。刘园，1号线北终点，出了站只剩公交总站和风。风一吹，你彻底清醒了——饭，还没吃。',
      next: 'sub_back',
    },
    sub_back: {
      type: 'narrate', bg: 'subway',
      text: '倒回程地铁，原路返回。一个钟头后，你总算回到了这一带，浑身上下写着一个字：饿。',
      next: 'arrive',
    },

    // ---------- 1B 打车 ----------
    tax1: {
      type: 'narrate', bg: 'taxi',
      text: '出租车司机一脚油门：「介儿哪儿去啊？您说个地儿！」',
      next: 'tax2',
    },
    tax2: {
      type: 'choice', bg: 'taxi',
      prompt: '你决定——',
      options: [
        { label: '报出饭馆名', next: 'tax_normal' },
        { label: '「随便溜达溜达」', next: 'tax_tour' },
        { label: '反问：「您说呢？」', effects: { achieve: 'host' }, next: 'tax_host' },
      ],
    },
    tax_normal: {
      type: 'narrate', bg: 'taxi',
      text: '「得嘞！」的哥一摆手，一路给你科普天津卫。到地方，计价器跳到 58 元。',
      next: 'pay',
    },
    tax_tour: {
      type: 'narrate', bg: 'taxi',
      text: '的哥真带你绕了五大道、海河、天津之眼……风景很好，表跳到了 198 元。',
      next: 'pay',
    },
    tax_host: {
      type: 'narrate', bg: 'taxi',
      text: '的哥愣了两秒，放声大笑：「介客人，有活儿！今儿免单！」',
      next: 'arrive',
    },
    pay: {
      type: 'choice', bg: 'taxi',
      prompt: '扫码支付：58.00 元',
      warn: '注意：玩家您的余额不足，如要继续游戏，请充值',
      options: [
        { label: '充值 1 元', cls: 'money', effects: { achieve: 'sucker' }, next: 'pay_done' },
        { label: '不充了，走路去', cls: 'danger', effects: { flag: 'walk_from_taxi' }, next: 'walk1' },
      ],
    },
    pay_done: {
      type: 'narrate', bg: 'taxi',
      text: '充值成功。系统感谢您的消费。（本游戏所有充值均为 1 元，童叟无欺）',
      next: 'arrive',
    },

    // ---------- 1C 步行 ----------
    walk1: {
      type: 'narrate', bg: 'street',
      text: '系统：距离饭馆 128 公里。祝您顺利。',
      next: 'walk_run',
    },
    walk_run: {
      type: 'stamina', bg: 'street',
      prompt: '128 公里，全靠两条腿。进度过半路过小馆，走满到底直达餐馆！',
      event: { at: 50, next: 'walk_door' },
      arrive: { at: 100, next: 'walk_arrive' },
      fail: 'walk_collapse',
    },
    walk_arrive: {
      type: 'narrate', bg: 'door',
      text: '你居然真的靠两条腿走完了 128 公里。老板看着你沉默了三秒，默默多上了一盘独面筋：「介客人，是条汉子。」',
      effects: { luck: 2, achieve: 'ironlegs' },
      next: 'arrive',
    },
    walk_door: {
      type: 'choice', bg: 'door',
      prompt: '随机事件：路过一家贴着春联的餐馆——「生意兴隆通四海，财源茂盛达八方」',
      options: [
        { label: '进去！', effects: { achieve: 'serendipity' }, next: 'walk_in' },
        { label: '继续走', next: 'walk_run' },
      ],
    },
    walk_in: {
      type: 'narrate', bg: 'door',
      text: '你记下了这家的门脸。肚子替你解决了行程问题。',
      next: 'arrive',
    },
    walk_collapse: {
      type: 'choice', bg: 'street',
      prompt: '你瘫坐在马路牙子上，灵魂已经开始出窍。',
      warn: '注意：该选择将影响您的健康状况，请谨慎决定',
      options: [
        { label: '扫码叫辆车', effects: { flag: 'walk_taxi' }, next: 'pay' },
        { label: '不叫了，继续躺', cls: 'danger', next: 'e4' },
      ],
    },

    // ---------- 1D 骑行 ----------
    bike1: {
      type: 'narrate', bg: 'bike', sfx: 'bikebell',
      text: '你扫了一辆共享单车。它看起来比你先到天津。',
      next: 'bike2',
    },
    bike2: {
      type: 'choice', bg: 'bike', sfx: 'chain',
      prompt: '骑到一半，链条掉了。它对你提出了灵魂拷问。',
      options: [
        { label: '换一辆', next: 'bike_none' },
        { label: '自己修', next: 'bike_fix' },
      ],
    },
    bike_none: {
      type: 'narrate', bg: 'bike',
      text: '系统：附近 0 米内有 0 辆可用单车。命运让你走路。',
      effects: { flag: 'bike_to_walk' },
      next: 'walk1',
    },
    bike_fix: {
      type: 'narrate', bg: 'bike',
      text: '你蹲下摆弄半天，链条没修好，倒引来一位遛弯大爷。大爷三下五除二修好了：「介孩子，动手能力得练啊。」',
      effects: { luck: 1, achieve: 'nohands' },
      next: 'bike3',
    },
    bike3: {
      type: 'choice', bg: 'door',
      prompt: '继续骑行，你路过一家贴着春联的餐馆——「生意兴隆通四海，财源茂盛达八方」',
      oneCol: true,
      options: [
        { label: '停车，进去！', effects: { achieve: 'serendipity' }, next: 'walk_in' },
      ],
    },

    // ================= E4 失败结局 =================
    e4: {
      type: 'choice', bg: 'black',
      prompt: '结局：未半而中道崩殂',
      warn: '注意：玩家您的余额不足，如要继续游戏，请充值',
      options: [
        { label: '充值 1 元复活', cls: 'money', effects: { achieve: 'reincarnation' }, next: 'revive' },
        { label: '告辞', next: 'title' },
      ],
    },
    revive: {
      type: 'narrate', bg: 'black',
      text: '充值成功。系统大度地把你塞回了出发的那一刻。（成就：轮回）',
      effects: { flag: 'revived' },
      next: 'c1_reset',
    },
    c1_reset: {
      type: 'narrate', bg: 'black',
      text: '呼～ 你又到了。这次，换个活法。',
      next: 'c1',
    },

    // ================= 章节结算 =================
    arrive: {
      type: 'summary', bg: 'black',
      title: '第一章 · 完',
      text: '人还没站稳，肚子先叫了。下一章：《吃饭，是门学问》',
      options: [
        { label: '先去哪呢', next: 'eat_pick' },
      ],
    },
    eat_pick: {
      type: 'choice', bg: 'black',
      prompt: '呼～ 终于到了！先吃饭吧，您选择：',
      hover: { ms: 5000, achieve: 'undecided', next: 'eat_auto' },
      options: [
        { label: '天津菜', next: 'c2_door' },
        { label: '天津菜', next: 'c2_door' },
        { label: '天津菜', next: 'c2_door' },
        { label: '天津菜', next: 'c2_door' },
      ],
    },
    eat_auto: {
      type: 'narrate', bg: 'black',
      text: '由于您犹豫时间过长，系统已为您自动选择：天津菜。反正四个选项也一样。（成就：犹豫不决）',
      next: 'c2_door',
    },
    c2_door: {
      type: 'narrate', bg: 'door', sfx: 'pushdoor',
      text: '打定主意，你抬头——就是这儿：红门脸，厚门帘，八珍豆腐的香味从帘子缝里往外拱。',
      next: 'c2_intro',
    },
  },
};

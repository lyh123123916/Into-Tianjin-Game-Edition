// 《走进天津》第二章剧本数据：吃饭，是门学问
const CHAPTER2 = {
  achievements: {
    thrifty: '会过日子',
    harsh: '毒舌评委',
    silence: '此时无声胜有声',
    cleanplate: '光盘行动',
  },

  nodes: {
    // ================= C2 饭馆 =================
    c2_intro: {
      type: 'narrate', bg: 'shop',
      text: '你推门进去。堂内人声鼎沸，服务员端着盘子从蒸汽里穿进穿出。老板娘把你让进包间，菜单拍在你面前：「介儿都是招牌，随便点！」',
      next: 'menu1',
    },
    menu1: {
      type: 'choice', bg: 'shop',
      prompt: '点菜环节。菜单厚得像本书，点出了高考报名的感觉。',
      warn: '注意：该选择将影响您的钱包，请谨慎决定',
      options: [
        { label: '土豪点法：全来一份', next: 'rich1' },
        { label: '省钱点法：来俩菜', effects: { luck: 1, achieve: 'thrifty' }, next: 'cheap1' },
        { label: '闭眼乱点', next: 'rnd1' },
      ],
    },

    // ---------- 三条点菜线 ----------
    rich1: {
      type: 'narrate', bg: 'shop',
      text: '老板娘笔尖一转：「全来一份？介客人，敞亮！」后厨的锅气瞬间浓了三度。',
      next: 'd_tofu',
    },
    cheap1: {
      type: 'narrate', bg: 'shop',
      text: '「就俩？行，介儿叫会吃。」老板娘冲后厨喊了一声，语气里居然带着敬意。',
      next: 'd_tofu',
    },
    rnd1: {
      type: 'random',
      branches: [
        { next: 'rnd_normal' },
        { next: 'rnd_goubu' },
      ],
    },
    rnd_normal: {
      type: 'narrate', bg: 'shop',
      text: '你闭眼戳了三下。睁眼一看——居然全戳在招牌上。老板娘：「介叫运气，学不来。」',
      effects: { luck: 1 },
      next: 'd_tofu',
    },
    rnd_goubu: {
      type: 'narrate', bg: 'shop',
      text: '你闭眼戳中了一道菜。睁眼一看：狗不理包子。全桌安静了两秒。那两秒里，你们四个人的友谊走了个来回。',
      effects: { flag: 'goubuli' },
      next: 'd_baozi',
    },

    // ---------- 菜品巡礼 ----------
    d_tofu: {
      type: 'narrate', bg: 'd_tofu', sfx: 'serve',
      text: '八珍豆腐。豆腐盖着八种珍馐，像期末考试盖着八道大题。',
      next: 'd_eggplant',
    },
    d_eggplant: {
      type: 'narrate', bg: 'd_eggplant', sfx: 'serve',
      text: '鲜虾茄盒。茄子夹着虾，虾夹着鲜，层层夹击，防不胜防。',
      next: 'd_mianjin',
    },
    d_mianjin: {
      type: 'narrate', bg: 'd_mianjin', sfx: 'serve',
      text: '独面筋。面筋在卤汁里咕嘟到吸饱，筷子一夹直颤。天津人的白月光，素菜做出了肉的排面。',
      next: 'd_fish',
    },
    d_fish: {
      type: 'narrate', bg: 'd_fish', sfx: 'serve',
      text: '罾蹦鲤鱼。鱼是炸过的，尾巴还翘着，保持着生前最后一条朋友圈。',
      next: 'd_combo',
    },
    d_combo: {
      type: 'narrate', bg: 'd_combo', sfx: 'serve',
      text: '炒合菜。春饼一卷，万物合一。天津人管这叫「把年卷起来吃」。',
      next: 'eval1',
    },
    d_baozi: {
      type: 'narrate', bg: 'd_baozi', sfx: 'serve',
      text: '狗不理包子端上来了。九个包子，九个沉默。老板娘远处观望，随时准备收回这份菜单。',
      next: 'eval1',
    },

    // ---------- 您的评价是 ----------
    eval1: {
      type: 'input', bg: 'shop', amb: 'black',
      prompt: '菜过三巡，老板娘端着果盘进来：「客人，给咱留个评价？」',
      placeholder: '说点什么（也可以不说）',
      routes: [
        { empty: true, effects: { achieve: 'silence' }, next: 'ev_silent' },
        { has: ['不错', '不赖'], next: 'ev_praise', effects: { luck: 1 } },                     // 「不错」是夸，别被后面的「不」误判
        { has: ['不好', '不咋地', '不咋样'], next: 'ev_bad', effects: { achieve: 'harsh' } },  // 「不好吃」含「好吃」，先按否定拦下
        { has: ['好吃', '绝', '香', '赞', '棒', '美味', '地道', '正宗', '好'], next: 'ev_praise', effects: { luck: 1 } },
        { has: ['难吃', '一般', '不行', '差', '齁', '咸', '腻', '贵', '不'], next: 'ev_bad', effects: { achieve: 'harsh' } },
      ],
      fallback: { next: 'ev_other' },
    },
    ev_praise: {
      type: 'narrate', bg: 'shop', amb: 'black',
      text: '后厨当即出来一位戴高帽的大师傅，端着一壶茶敬你：「介客人，懂行！」全桌鼓掌，厨子比你还激动。',
      next: 'final1',
    },
    ev_bad: {
      type: 'narrate', bg: 'shop', amb: 'black',
      text: '服务员微笑接过小票，收走了你面前的果盘。笑容没变，果盘没了。（成就：毒舌评委）',
      next: 'final1',
    },
    ev_silent: {
      type: 'narrate', bg: 'shop', amb: 'black',
      text: '你搁下笔，一言不发。老板娘若有所思：「介客人，深沉。」（成就：此时无声胜有声）',
      next: 'final1',
    },
    ev_other: {
      type: 'narrate', bg: 'shop', amb: 'black',
      text: '老板娘看了看你的评价，评价看了看老板娘。双方都从对方眼中看到了不解。',
      next: 'final1',
    },

    // ---------- 收尾 ----------
    final1: {
      type: 'choice', bg: 'shop', amb: 'black',
      prompt: '最后一道工序：盘子里还剩一点。',
      options: [
        { label: '光盘！', effects: { achieve: 'cleanplate' }, next: 'final_clean' },
        { label: '打包', effects: { flag: 'takeout' }, next: 'final_pack' },
      ],
    },
    final_clean: {
      type: 'narrate', bg: 'shop', amb: 'black',
      text: '你把盘子吃得干干净净。路过服务员看了一眼空盘，回头对后厨喊：「介单成了！」（成就：光盘行动）',
      next: 'c2_end',
    },
    final_pack: {
      type: 'narrate', bg: 'shop', amb: 'black',
      text: '「打包！」老板娘熟练地掏出一个塑料袋。塑料袋在风中鼓起，像一座小小的奖杯。（获得道具：塑料袋）',
      next: 'c2_end',
    },

    c2_end: {
      type: 'summary', bg: 'shop', amb: 'black',
      title: '第二章 · 完',
      text: '你放下最后一次筷子。就在这时，服务员捏着一张红纸飘然而至：「先生，结账，顺手抽个奖！」下一章：《天上掉馅饼》',
      options: [
        { label: '去结账', next: 'c3_in' },
      ],
    },
  },
};

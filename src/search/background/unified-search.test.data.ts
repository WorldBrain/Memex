export const PAGE_ID_1 = 'en.wikipedia.org/wiki/Canopy_(biology)'
export const PAGE_ID_2 = 'wikipedia.org/wiki/Genus'
export const PAGE_ID_3 = 'lu.ma/test-1'
export const PAGE_ID_4 = 'x.com/test_acc_1/status/12345678'
export const PAGE_ID_5 = 'twitter.com/test_acc_2/status/12345678'
export const PAGE_ID_6 = 'memex.cloud/ct/test-fingerprint-2.pdf'
export const PAGE_ID_7 = 'vimeo.com/test-1'
export const PAGE_ID_8 = 'eventbrite.com/events/test-1'
export const PAGE_ID_9 = 'en.test-2.com/wiki/Phylum'
export const PAGE_ID_10 = 'test.com/wiki/Organism'
export const PAGE_ID_11 = 'youtube.com/watch?v=test-1'
export const PAGE_ID_12 = 'memex.cloud/ct/test-fingerprint-1.pdf'
export const PAGE_ID_13 = 'blogec.blogchina.com/501108926.html'

export const LIST_ID_1 = 111
export const LIST_ID_2 = 112
export const LIST_ID_3 = 113

export const LISTS = {
    [LIST_ID_1]: {
        id: LIST_ID_1,
        name: 'test a',
        searchableName: 'test a',
        createdAt: new Date('2024-03-20T04:00'),
    },
    [LIST_ID_2]: {
        id: LIST_ID_2,
        name: 'test b',
        searchableName: 'test b',
        createdAt: new Date('2024-03-20T05:00'),
    },
    [LIST_ID_3]: {
        id: LIST_ID_3,
        name: 'test c',
        searchableName: 'test c',
        createdAt: new Date('2024-03-20T05:30'),
    },
}

// These may have a `listIds` prop, which will be used to add them to lists if so
export const PAGES = {
    [PAGE_ID_1]: {
        listIds: [LIST_ID_1, LIST_ID_3],
        url: PAGE_ID_1,
        fullUrl: 'https://' + PAGE_ID_1,
        domain: 'wikipedia.org',
        hostname: 'en.wikipedia.org',
        fullTitle: 'dog breeds',
        text: 'test text about poodles, ridgebacks',
    },
    [PAGE_ID_2]: {
        listIds: [LIST_ID_3],
        url: PAGE_ID_2,
        fullUrl: 'https://' + PAGE_ID_2,
        domain: 'wikipedia.org',
        hostname: 'wikipedia.org',
        fullTitle: 'fruit types',
        text: 'text about apples, oranges, etc.',
    },
    [PAGE_ID_3]: {
        url: PAGE_ID_3,
        fullUrl: 'https://' + PAGE_ID_3,
        domain: 'luma.com',
        hostname: 'luma.com',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_4]: {
        listIds: [LIST_ID_2],
        url: PAGE_ID_4,
        fullUrl: 'https://' + PAGE_ID_4,
        domain: 'x.com',
        hostname: 'x.com',
        fullTitle: 'title',
        text: 'some nonsense test text',
    },
    [PAGE_ID_5]: {
        url: PAGE_ID_5,
        fullUrl: 'https://' + PAGE_ID_5,
        domain: 'twitter.com',
        hostname: 'twitter.com',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_6]: {
        url: PAGE_ID_6,
        fullUrl: 'https://' + PAGE_ID_6,
        domain: 'arxiv.org',
        hostname: 'arxiv.org',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_7]: {
        url: PAGE_ID_7,
        fullUrl: 'https://' + PAGE_ID_7,
        domain: 'vimeo.com',
        hostname: 'vimeo.com',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_8]: {
        url: PAGE_ID_8,
        fullUrl: 'https://' + PAGE_ID_8,
        domain: 'eventbrite.org',
        hostname: 'eventbrite.org',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_9]: {
        url: PAGE_ID_9,
        fullUrl: 'https://' + PAGE_ID_9,
        domain: 'test2.com',
        hostname: 'en.test2.com',
        fullTitle: '',
        text: '',
    },
    [PAGE_ID_10]: {
        url: PAGE_ID_10,
        fullUrl: 'https://' + PAGE_ID_10,
        domain: 'wikipedia.org',
        hostname: 'en.wikipedia.org',
        fullTitle: '',
        text: '',
    },
    [PAGE_ID_11]: {
        url: PAGE_ID_11,
        fullUrl: 'https://' + PAGE_ID_11,
        domain: 'youtube.com',
        hostname: 'youtube.com',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_12]: {
        url: PAGE_ID_12,
        fullUrl: 'https://' + PAGE_ID_12,
        domain: 'cool-pdfs.org',
        hostname: 'en.cool-pdfs.org',
        fullTitle: 'test',
        text: 'text text text',
    },
    [PAGE_ID_13]: {
        url: PAGE_ID_13,
        fullUrl: 'https://' + PAGE_ID_13,
        domain: 'cblogchina.com',
        hostname: '/blogec.blogchina.com',
        fullTitle:
            '微软Q3业绩会实录：有信心将投资转化为未来的第二次成功-经济观察的专栏 - 博客中国',
        text:
            '经济观察 \n登录 / 注册\n经济观察的专栏\n经\n添加关注\n专栏首页\n全部文章\n粉丝关注\n微软Q3业绩会实录：有信心将投资转化为未来的第二次成功\n2024-04-28 19:15:34栏目：默认栏目 IP属地：IP未知\n5276 0 0\n\n新浪科技\n\n\n微软(406.32, 7.28, 1.82%)发布了2024财年第三财季财报：营收为618.58亿美元，同比增长17%，不计入汇率变动的影响同样为同比增长17%；净利润为219.39亿美元，同比增长20%，不计入汇率变动的影响同样为同比增长20%（注：微软财年与自然年不同步）。\n\n　　微软第三财季营收和每股收益均超出华尔街分析师此前预期，从而推动其盘后股价大幅上涨逾4%。与此同时，微软对第四财季营收作出的展望未能达到分析师预期，但对第四财季运营利润率的展望则超出预期。\n\n　　详见：微软第三财季营收618.58亿美元 净利润同比增长20%\n\n　　财报发布后，微软CEO萨提亚·纳德拉（Satya Nadella）、执行副总裁兼CFO艾米·胡德（Amy Hood）、首席会计官爱丽丝·卓拉（Alice Jolla）和副总法律顾问基斯·多利弗（Keith Dolliver）等公司高管出席了随后举行的财报电话会议，解读财报要点，并回答分析师提问。\n\n　　以下是电话会议实录：\n\n　　摩根士丹利(92.83, 0.27, 0.29%)分析师Keith Weiss：市场上围绕生成式人工智能及其技术潜力有很多令人振奋的消息，背后也有大量投资的支持。微软貌似今年有望将资本支出同比增加50%以上，其数额可能达到500多亿美元，而且有媒体猜测未来还会有更多支出，一些报道称公司在数据中心领域的投资可能达到1000亿美元。显然，投资方面的增速远远领先于收入贡献。管理层如何量化这些投资背后的潜在机会，比如是否真的存在媒体所指的1000亿美元数据中心的投资潜力？\n\n　　萨提亚·纳德拉：让我回答你的部分问题，对于从更高的层面来理解问题或许有帮助。管理团队会从两个方面看待人工智能问题，一个是训练，另一个是推理。公司致力于在技术的重大代际更替和范式转变过程中成为行业领导者，这是在训练方面的情况。我们希望资本上有必要的投入，本质上讲，主要用于训练这些大型基础模型，并保持我们在这个领域的领先地位。这方面我们一直做得比较成功，大家也能从公司的损益表中看到了这一点，这种趋势会持续向前发展。\n\n　　然后，艾米也提到了我们在推理方面所做的工作，首先，我们创新性地打造产品，公司的基础设施业务依赖于众多独立软件开发商在微软基础设施上的产品运行，都是以需求驱动的方式进行的。另外，我们也非常密切地跟踪观察推理方面的需求情况，正如艾米在她的发言中所说，我们会非常专注地管理好这一点。所以我们觉得一直以来团队都在这样做，过去好多年皆如此，只是某些媒体报道刚刚注意到而已，第三财季更是如此。如果大家有时间仔细观察，就能够发现其实微软多年来从本质上讲一直在做的一件事就是资本配置，致力于成为人工智能领域的领导者，未来仍会继续向前推进。\n\n　　艾米·胡德：关于规划周期方面的思考对我们而言的确是很重要的。我们谈到了逐步增加支出，希望能够持续建设基础设施以不断满足市场需求。你的提问还谈到了在抓住市场机会方面可能潜在的投资规模，我认为我们需要思考每一个可以受到影响的业务流程，以及每一个业务流程所代表的机会，这是非常重要的。这样考虑的话，我认为机会是巨大的，我们的投资其实是为了下一波我们所说的“云基础设施”提供动力，这一点非常重要，因为公司在过去十年，云端转型的过程中一直处于这个行业的领先地位。我们也有信心将投资转化为未来的第二次成功，这应该是如何思考资本支出的最佳方式，就像我们过去十年来处理这件事的方式一样。\n\n　　关注市场信号，投资筑牢技术基础，实现行业领先地位，然后始终如一地执行，为客户增加价值。机会就体现在我们能够为客户提供的附加价值量上，我们期待持续履行对于客户的承诺。\n\n　　杰弗瑞分析师Brent Thill：萨提亚，你如何看待目前的市场需求环境？一方面，第三季度预订量和Azure云服务都出现同比加速增长，但另一方面，公司很多的合作伙伴对于未来都有比较多的担忧和犹豫。大家可能都想了解你对于客户今年预算健康度状况的看法。\n\n　　萨提亚·纳德拉：非常不错的问题，我可以从几个方面谈谈。就Azure而言，这是你特别问到的，我们对于该业务的进展非常满意。从我们的角度来看，微软基本上一直在增加市场份额，事实上，Azure已经成为几乎所有人在考虑实施人工智能云项目时的一个停靠点，所以这对我们获得新客户有很大的帮助，我也在发言中提到了一些对于Azure客户而言比较新鲜的情况。\n\n　　第二，人工智能不是独立存在的，人工智能项目始于对人工智能模型的调用，也会使用向量数据库，事实上，Azure搜索也会被用于ChatGPT问答，这是我们增长最快的服务之一，我们与Azure人工智能进行了结构集成，Cosmos DB（完全托管的NoSQL关系数据库和向量数据库）集成，这是数据层面的情况，Dev工具也有不错的增长。\n\n　　最后，我想谈谈数据迁移到Azure的问题，这不仅是一个人工智能的问题，主要涉及还是客户服务方面的情况，每家公司都有一个优化周期，优化就意味着支出，新项目开始、增长，然后他们会优化，这是一个持续的过程。这些就是在Azure上我们从需求方面看到的三个趋势。\n\n　　伯恩斯坦分析师Mark Moerdler：根据我在人工智能领域的考察，一些公司正在将其信息技术支出转向投资和了解人工智能，而非为人工智能获得额外预算，而支出的增加可能进一步推动人工智能更具变革性力量。萨提亚，请问你认为人工智能何时会达到比较成熟水平？投资会来自信息技术支出的净增长还是信息技术支出以外的支出？成熟的主要指标是什么？艾米，某些与Azure相关的项目被推迟，是否意味着部分项目从Azure核心业务转移到Azure人工智能云上来了？\n\n　　萨提亚·纳德拉：关于你的问题，一个比较好观察点就是软件工具存在的一些基本问题。大家可以仔细想一下，客户在过去主要是购买软件工具，而现在购买的是软件工具加上微软Copilot，我们甚至可以这样理解，客户将运营支出转移到实际上的工具支出上，因为他们今天所花费的所有运营支出提供了运营杠杆，我认为这是一个很好的例子，未来会出现在各个领域。客户服务、销售、营销等行业都出现了这种情况，只要是有运营的地方。\n\n　　另外一个有趣的需求来源是公司文化的改变，文化上的转变意味着流程上的变革。我在回答第一个问题时也提到了这一点，普遍来讲，公司的内部组织操作都是采用一个流程，简化该流程，实现流程的自动化，并应用这些解决方案。因此，他们不仅需要技术，还需要努力进行文化的调整，通过技术推动实现运营杠杆，这也是不同公司在绩效层面出现差异的地方。我们也在自己身上应用这一点，应用于每一个流程，这不仅仅是关乎技术，还关乎能够拥有与之配套的方法。我们在软件开发中看到了这一情况，在客户服务行业看到了这一情况，甚至在Copilot的水平应用中看到了这一情况，大家每天都能够发现新的、可以进行优化的工作流程。\n\n　　我能想到的最接近的类比就是，目前的情况同个人电脑在90年代早期成为标准配置时一样。人工智能的应用需要时间在各行各业的进一步渗透，而且，相比以往的任何情况，人工智能技术的扩散都要更快，采用步伐更大，比我们过去销售的任何软件套件都要快，但这些都需要工作流程和程序的改变。\n\n　　艾米·胡德：关于你提到的项目从Azure核心服务消费转向人工智能项目的明显转变，相反，如萨提亚所言，我们看到了云迁移方面业务的增长，数据测试领域的工作也在增加，同时人工智能项目也在启动。我认为这就是为什么微软的增长可能与其他公司不同，当然，从预算支出的角度来看，这是因为公司市场份额有所提高，而且我们的确是专注于萨提亚所说的获取其他领域的预算支出，这些领域可能不属于传统的信息技术，包括例如首席投资官所负责的预算，客户服务或者营销部门负责人的预算等。未来我们在考虑业务增长机会时，这些新情况也将非常重要。\n\n　　瑞银(27.38, -0.11, -0.40%)分析师Karl Keirstead：恭喜公司在亚洲市场取得了如此出色的业绩。我想深入了解一下，微软在亚洲市场实现了7%的增长，主要缘于人工智能服务业务的出色表现，但与之前一个财季6%的增长相比，好像变化不大，请问供应能力方面的问题在多大程度上影响了公司亚洲的增长？跟季节性因素有关吗？虽然我个人不这么认为，或者还有哪些其他因素？\n\n　　艾米·胡德：你说的没错，没有季节性因素的影响。思考这个问题的角度，更多的可能还是有多少产能在发挥作用，特别是在推理服务方面我们有多少产能可供销售。这也是大家看到的公司资本投资呈现目前这种状态的原因之一，目前市场的需求确实是略高于我们的供应，可能对第三财季的增速数字产生了影响，并也将对第四财季的数字产生一点影响。\n\n　　巴克莱分析师Raimo Lenschow：我有一个更为抽象的，概念性的问题要问萨提亚。公司Copilot业务似乎对很多不同行业和企业都产生了影响，增长机会似乎非常广泛。管理层如何看待目前在行业其他公司跟进模仿推出类似产品的情况，对于公司未来的经营计划有何影响？对公司未来的合作伙伴战略有什么影响？\n\n　　萨提亚·纳德拉：这是一个很好的问题。我们看到的情况是，Office软件被广泛用于与知识相关的工作，其实是为了服务业务流程，所以，当客户进行相关的工作时，他们并不仅仅是在做与知识相关的事情，他们是为了促成销售、支持客户服务、推动收入增长、让运营更为顺畅、优化供应链来进行的知识性工作的，使用电子邮件、Teams、Excel、PowerPoint、Word等工具中进行这些工作。\n\n　　而现在，我们有能力从根本上将这些知识工作者工具中的工作、工作成果、工作流程、业务流程及业务流程数据联系起来。微软Copilot就具备这种整合的能力，无论是与ServiceNow（云IT服务桌面软件提供商）的整合，还是与SAP(186.18, 1.09, 0.59%)，Salesforce(274.29, 1.15, 0.42%)，Dynamics的整合。\n\n　　大家也会听到我们在开发者大会上经常谈论Extensibility和Copilot工作室，从产品角度而言，他们真的非常出色，能够助力企业数据数据与Copilot服务的融合。Copilot工作室就是能够帮助他们实现这些目标的工具，微软Copilot具有协调所有其他类似Copilot服务的功能，对我们而言，这些其他Copilot看起来像是我们服务的扩展。一部分用户还在使用我们的知识性工作工具，比如前面提到的Teams，这样的一场在Teams上举行的会议肯定是关于某个业务流程的，例如它可能是一个供应链会议，比如与会者想要了解应该选择哪些供应商，合作条件有哪些。\n\n　　Copilot能够帮助客户在Teams场景下了解所有相关数据，这意味着我们打造了横向工具，公司的这些工具在服务业务流程上的工作量被低估了，这些工作在商业应用程序和知识工作者工具之间横向地架起了桥梁。\n\n　　富国银行(59.91, -0.02, -0.03%)分析师Michael Turrin：我想跟进一个关于Azure业务的问题。过去几个季度，管理层一直暗示该业务的稳定增长，我非常高兴能够看到这种平衡增长。可否详细谈谈商业预订量方面的情况，以及订单可见度方面的情况。另外，可否介绍一些关于成本优化和核心工作载荷增长等方面的情况？\n\n　　艾米·胡德：我可能会倒过来谈这些问题，这样处理起来会稍微容易一些。我们一直在谈论稳定增长的问题，大家也注意到了第三财季的增长情况，如果把Azure增长的数字分解来看，其中有7个百分点来自人工智能的贡献，而来自Azure核心业务的贡献有24个百分点，其中存在着差异。消费端的增长也比较稳定，并且我们在整个云转型过程中也看到了这种平衡增长。\n\n　　我们关注到新工作负载的启动和优化，这些优化创造了新的预算，并不断加以应用，整个循环实际上是相当正常的，这种平衡增长也在第三财季持续。相比第二财季，第三财季核心业务所出现的一定幅度的加速情况，很大程度上与新项目的启动有关，许多公司仍在从本地迁移到云的过程，对于人工智能 的反应可能不如你我这么强烈。\n\n　　这些都是我们努力为客户能够实现成本节约方面所做的非常基础的工作，所以他们的总成本仍然可以保持非常理想(25.04, 1.57, 6.69%)的情况。另外，我觉得在行业或地区之间没有太大的差异。关于未来的稳定趋势问题，我实际上关注的还是各个不同工作载荷的情况，包括启动、优化过程是否如常，我们鼓励客户尽可能高效地运行工作负载，这对于客户取得增长并从我们的服务中获得价值至关重要。\n\n　　Evercore ASI分析师Kirk Materne：萨提亚，我想问一个投资者经常讨论的问题。市场上存在一些数据质量问题，影响了对生成式AI新技术的利用。在解决这一问题方面，微软是否有所进展？这个问题会不会在某种程度上会抑制人工智能产业的发展？\n\n　　萨提亚·纳德拉：成功部署人工智能技术需要考虑两个方面。一方面是自然语言带来全新的用户体验；另一方面是推理引擎功能。良好的推理引擎需要优质的数据作为基础，人们提出了“检索增强生(146.14, -0.68, -0.46%)成”的概念，这种背景下，我认为优质的基础数据对推理有很大的帮助。\n\n　　当然，人们也在寻求某种微调或基于人类反馈的强化学习（RLHF），或者采用大模型并进一步完善，这些就是现在可以利用的工具。企业正将这些模型越来越深度性地部署到各种业务流程当中，包括对数据和模型的调整，系统集成商和其他开发者也在帮助企业更广泛地应用这些技术。一切都在日趋成熟，对于这方面我们很乐观。\n\n　　从商业角度来看，这些问题对于广大消费者来说更难解决，我们的模型还需要一些重大改进才能够支持更为复杂的、开放式消费场景。而对于企业客户而言，这些都是我们可以解决的问题。这里我想提一下GitHub，它不仅是一个人工智能模型，更是一个完整的系统。用户体验、搭建、编辑器、聊天、解释器和调试器与模型续体共同协作，在根本上帮助创建这些推理痕迹，从而支持整个系统的运作。\n\n　　实际上，我们目前用Copilot、Copilot Studio和连接器所做的，可以理解成在为每个业务系统创建类似GitHub Copilot的场景。我认为这兼顾了艾米之前提到的商业价值和更好数据融合。你说的没错，我们在Fabric、Cosmos、PostgreS或SQL上所做的很多工作都是为了准备数据以用于人工智能项目集成。\n\n　　Wolfe研究分析师Alex Zukin：我想从微软365 Copilot的角度提一个关于人工智能的问题。您提到从本季度开始公司看到了对于办公业务的一些积极影响。艾米在前面的发言中提到了供应不足的问题，可否展开说明一下？在公司增加资本支出并提高供应的情况下，能够在多大程度上释放了Azure AI和微软365 Copilot的服务能力？\n\n　　艾米·胡德：我在这里澄清一下，Copilot没有供应不足的问题，我们的当务之急是确保优化我们的供应分配，以确保公司按用户人数付费的业务能够持续增长。这意味着如果我们出现供应不足的情况，这种情况可能出现在Azure基础架构方面，而从消费层面理解可能获得更好的思考角度。（完）\n\n\n\n\n0\n0\n \n阅读前一篇\n越来越贵的李宁，终于跌落神坛？\n阅读后一篇\n吉比特是否迈进衰退期？核心产品经营数据持续恶化\n最新文章\n义乌电商，追爆品的人\n吉比特是否迈进衰退期？核心产品经营数据持续恶\n微软Q3业绩会实录：有信心将投资转化为未来的\n越来越贵的李宁，终于跌落神坛？\n周鸿祎抖音卖二手迈巴赫：宇宙尽头，为什么是带\n相关阅读\n铁打的运营商，流水的互联网\n第四范式再递表：亏损逐年递增 三年多狂亏33\n上市一年，市值暴跌80%，蘑菇街危险了？\n陈煜波：为什么硅谷巨头来中国大都失败了\nGDP！广东11万亿，江苏破10万亿，已经超\n登录  \n    \n© Copyright 2001 - 2024 blogchina.com, All Rights Reserved\n京ICP备12023361号-1　京公网安备 11010802020321号\n声明：文章内容纯属作者个人观点，不代表博客中国立场\n违法和不良信息举报（涉未成年、网络暴力、历史虚无主义、有害信息举报）电话：15110263473\n违法和不良信息举报（涉未成年、网络暴力、历史虚无主义、有害信息举报）邮箱：help@blogchina.com\n客户服务热线：15110263473　客服邮箱：help@blogchina.com',
    },
}

export const BOOKMARKS = {
    [PAGE_ID_11]: [
        {
            url: PAGE_ID_11,
            time: new Date('2024-03-25T06:19').valueOf(),
        },
    ],
    [PAGE_ID_2]: [
        {
            url: PAGE_ID_2,
            time: new Date('2024-03-21T06:00').valueOf(),
        },
    ],
    [PAGE_ID_12]: [
        {
            url: PAGE_ID_12,
            time: new Date('2024-02-25T06:00').valueOf(), // Much older page which has new annotations
        },
    ],
}

export const VISITS = {
    [PAGE_ID_1]: [
        {
            url: PAGE_ID_1,
            time: new Date('2024-03-20T06:00').valueOf(),
        },
    ],
    [PAGE_ID_3]: [
        {
            url: PAGE_ID_3,
            time: new Date('2024-03-21T06:10').valueOf(),
        },
    ],
    [PAGE_ID_4]: [
        {
            url: PAGE_ID_4,
            time: new Date('2024-03-21T06:20').valueOf(),
        },
    ],
    [PAGE_ID_5]: [
        {
            url: PAGE_ID_5,
            time: new Date('2024-03-22T06:00').valueOf(),
        },
    ],
    [PAGE_ID_6]: [
        {
            url: PAGE_ID_6,
            time: new Date('2024-03-22T06:10').valueOf(),
        },
    ],
    [PAGE_ID_7]: [
        {
            url: PAGE_ID_7,
            time: new Date('2024-03-23T06:00').valueOf(),
        },
    ],
    [PAGE_ID_8]: [
        {
            url: PAGE_ID_8,
            time: new Date('2024-03-23T06:10').valueOf(),
        },
        {
            url: PAGE_ID_8,
            time: new Date('2024-03-25T06:15').valueOf(),
        },
    ],
    [PAGE_ID_9]: [
        {
            url: PAGE_ID_9,
            time: new Date('2024-03-23T06:20').valueOf(),
        },
    ],
    [PAGE_ID_10]: [
        {
            url: PAGE_ID_10,
            time: new Date('2024-03-25T06:10').valueOf(),
        },
    ],
    [PAGE_ID_11]: [
        {
            url: PAGE_ID_11,
            time: new Date('2024-03-25T06:20').valueOf(),
        },
    ],
    [PAGE_ID_13]: [
        {
            url: PAGE_ID_13,
            time: new Date('2024-03-25T06:20').valueOf(),
        },
    ],
}

// These may have a `listIds` prop, which will be used to add them to lists if so
export const ANNOTATIONS = {
    [PAGE_ID_4]: [
        {
            url: `${PAGE_ID_4}/#1711067684199`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>division</div>',
            comment:
                'comment with completely different text to the parent page - cheese',
            color: 'default',
            selector: {
                quote: '<div>division</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-23T06:21'), // UPDATED
            createdWhen: new Date('2024-03-21T06:21'),
        },
        {
            listIds: [LIST_ID_1],
            url: `${PAGE_ID_4}/#1711067799676`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Honshu cheese test</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Honshu</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:22'),
            createdWhen: new Date('2024-03-21T06:22'),
        },
        {
            listIds: [LIST_ID_3],
            url: `${PAGE_ID_4}/#1711067799679`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Good highlight test honshu</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Honshu</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:23'),
            createdWhen: new Date('2024-03-21T06:23'),
        },
        {
            url: `${PAGE_ID_4}/#1711067799680`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Honshu</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Honshu</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:24'),
            createdWhen: new Date('2024-03-22T06:24'),
        },
        {
            url: `${PAGE_ID_4}/#1711067799681`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Honshu</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Honshu</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:25'),
            createdWhen: new Date('2024-03-22T06:25'),
        },
        {
            url: `${PAGE_ID_4}/#1711067812450`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Mindanao</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Mindanao</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:26'),
            createdWhen: new Date('2024-03-22T06:26'),
        },
        {
            url: `${PAGE_ID_4}/#1711067812452`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Mindanao</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Mindanao</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:27'),
            createdWhen: new Date('2024-03-22T06:27'),
        },
        {
            url: `${PAGE_ID_4}/#1711067904471`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>megablock</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>megablock</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:28'),
            createdWhen: new Date('2024-03-22T06:28'),
        },
        {
            url: `${PAGE_ID_4}/#1711067924596`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>test</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>test</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:29'),
            createdWhen: new Date('2024-03-22T06:29'),
        },
        {
            url: `${PAGE_ID_4}/#1711067924597`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Pakistan</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Pakistan</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:30'),
            createdWhen: new Date('2024-03-22T06:30'),
        },
    ],
    [PAGE_ID_2]: [
        {
            url: `${PAGE_ID_2}/#1711067346089`,
            pageTitle: 'Genus - Wikipedia',
            pageUrl: PAGE_ID_2,
            body:
                '<div><p><b>Genus</b> (<span><span lang="en-fonipa"><a href="https://en.wikipedia.org/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="/dʒ/: \'j\' in \'jam\'">dʒ</span><span title="/iː/: \'ee\' in \'fleece\'">iː</span><span title="\'n\' in \'nigh\'">n</span><span title="/ə/: \'a\' in \'about\'">ə</span><span title="\'s\' in \'sigh\'">s</span></span>/</a></span></span> <abbr title="plural form">pl.</abbr>: <b>genera</b> <span><span lang="en-fonipa"><a href="https://en.wikipedia.org/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="/dʒ/: \'j\' in \'jam\'">dʒ</span><span title="/ɛ/: \'e\' in \'dress\'">ɛ</span><span title="\'n\' in \'nigh\'">n</span><span title="/ər/: \'er\' in \'letter\'">ər</span><span title="/ə/: \'a\' in \'about\'">ə</span></span>/</a></span></span>) is a <a href="https://en.wikipedia.org/wiki/Taxonomic_rank" title="Taxonomic rank">taxonomic rank</a> used in the <a href="https://en.wikipedia.org/wiki/Biological_classification" title="Biological classification">biological classification</a> of <a href="https://en.wikipedia.org/wiki/Extant_taxon" title="Extant taxon">living</a> and <a href="https://en.wikipedia.org/wiki/Fossil" title="Fossil">fossil</a> organisms as well as <a href="https://en.wikipedia.org/wiki/Virus_classification#ICTV_classification" title="Virus classification">viruses</a>.<sup><a href="#cite_note-ICTV-1">[1]</a></sup> In the hierarchy of biological classification, genus comes above <a href="https://en.wikipedia.org/wiki/Species" title="Species">species</a> and below <a href="https://en.wikipedia.org/wiki/Family_(taxonomy)" title="Family (taxonomy)">family</a>. In <a href="https://en.wikipedia.org/wiki/Binomial_nomenclature" title="Binomial nomenclature">binomial nomenclature</a>, the genus name forms the first part of the binomial species name for each species within the genus.\n</p>\n</div>',
            comment: '',
            color: 'default',
            selector: {
                quote:
                    '<div><p><b>Genus</b> (<span><span lang="en-fonipa"><a href="/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="/dʒ/: \'j\' in \'jam\'">dʒ</span><span title="/iː/: \'ee\' in \'fleece\'">iː</span><span title="\'n\' in \'nigh\'">n</span><span title="/ə/: \'a\' in \'about\'">ə</span><span title="\'s\' in \'sigh\'">s</span></span>/</a></span></span> <abbr title="plural form">pl.</abbr>: <b>genera</b> <span><span lang="en-fonipa"><a href="/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="/dʒ/: \'j\' in \'jam\'">dʒ</span><span title="/ɛ/: \'e\' in \'dress\'">ɛ</span><span title="\'n\' in \'nigh\'">n</span><span title="/ər/: \'er\' in \'letter\'">ər</span><span title="/ə/: \'a\' in \'about\'">ə</span></span>/</a></span></span>) is a <a href="/wiki/Taxonomic_rank" title="Taxonomic rank">taxonomic rank</a> used in the <a href="/wiki/Biological_classification" title="Biological classification">biological classification</a> of <a href="/wiki/Extant_taxon" title="Extant taxon">living</a> and <a href="/wiki/Fossil" title="Fossil">fossil</a> organisms as well as <a href="/wiki/Virus_classification#ICTV_classification" title="Virus classification">viruses</a>.<sup><a href="#cite_note-ICTV-1">[1]</a></sup> In the hierarchy of biological classification, genus comes above <a href="/wiki/Species" title="Species">species</a> and below <a href="/wiki/Family_(taxonomy)" title="Family (taxonomy)">family</a>. In <a href="/wiki/Binomial_nomenclature" title="Binomial nomenclature">binomial nomenclature</a>, the genus name forms the first part of the binomial species name for each species within the genus.\n</p>\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-25T06:01'),
            createdWhen: new Date('2024-03-25T06:01'),
        },
        {
            url: `${PAGE_ID_2}/#1711333412292`,
            pageTitle: 'Genus - Wikipedia',
            pageUrl: PAGE_ID_2,
            body:
                '<div><p>The term "genus" comes from <a href="https://en.wikipedia.org/wiki/Latin" title="Latin">Latin</a> <i lang="la"><a href="https://en.wiktionary.org/wiki/genus#Latin" title="wikt:genus">genus</a></i>, a noun form <a href="https://en.wikipedia.org/wiki/Cognate" title="Cognate">cognate</a> with <i><span title="Latin-language text"><i lang="la"><a href="https://en.wiktionary.org/wiki/gigno" title="wikt:gigno">gignere</a></i></span></i> (\'to bear; to give birth to\'). The Swedish taxonomist <a href="https://en.wikipedia.org/wiki/Carl_Linnaeus" title="Carl Linnaeus">Carl Linnaeus</a> popularized its use in his 1753 <i><a href="https://en.wikipedia.org/wiki/Species_Plantarum" title="Species Plantarum">Species Plantarum</a></i>, but the French botanist <a href="https://en.wikipedia.org/wiki/Joseph_Pitton_de_Tournefort" title="Joseph Pitton de Tournefort">Joseph Pitton de Tournefort</a> (1656–1708) is considered "the founder of the modern concept of genera".<sup><a href="#cite_note-5">[5]</a></sup>\n</p>\n</div>',
            comment: '',
            selector: {
                quote:
                    '<div><p>The term "genus" comes from <a href="/wiki/Latin" title="Latin">Latin</a> <i lang="la"><a href="https://en.wiktionary.org/wiki/genus#Latin" title="wikt:genus">genus</a></i>, a noun form <a href="/wiki/Cognate" title="Cognate">cognate</a> with <i><span title="Latin-language text"><i lang="la"><a href="https://en.wiktionary.org/wiki/gigno" title="wikt:gigno">gignere</a></i></span></i> (\'to bear; to give birth to\'). The Swedish taxonomist <a href="/wiki/Carl_Linnaeus" title="Carl Linnaeus">Carl Linnaeus</a> popularized its use in his 1753 <i><a href="/wiki/Species_Plantarum" title="Species Plantarum">Species Plantarum</a></i>, but the French botanist <a href="/wiki/Joseph_Pitton_de_Tournefort" title="Joseph Pitton de Tournefort">Joseph Pitton de Tournefort</a> (1656–1708) is considered "the founder of the modern concept of genera".<sup><a href="#cite_note-5">[5]</a></sup>\n</p>\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-25T06:02'),
            lastEdited: new Date('2024-03-25T06:02'),
        },
        {
            url: `${PAGE_ID_2}/#1711333405403`,
            pageTitle: 'Genus - Wikipedia',
            pageUrl: PAGE_ID_2,
            body:
                '<ul><li><a href="https://en.wikipedia.org/wiki/Monophyly" title="Monophyly">monophyly</a> – all descendants of an ancestral <a href="https://en.wikipedia.org/wiki/Taxon" title="Taxon">taxon</a> are grouped together (i.e. <a href="https://en.wikipedia.org/wiki/Phylogenetics" title="Phylogenetics">phylogenetic</a> analysis should clearly demonstrate both monophyly and validity as a separate lineage).</li>\n</ul>',
            comment: '',
            selector: {
                quote:
                    '<ul><li><a href="/wiki/Monophyly" title="Monophyly">monophyly</a> – all descendants of an ancestral <a href="/wiki/Taxon" title="Taxon">taxon</a> are grouped together (i.e. <a href="/wiki/Phylogenetics" title="Phylogenetics">phylogenetic</a> analysis should clearly demonstrate both monophyly and validity as a separate lineage).</li>\n</ul>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-25T06:03'),
            lastEdited: new Date('2024-03-25T06:03'),
        },
    ],
    [PAGE_ID_5]: [
        {
            url: `${PAGE_ID_5}/#1711068383658`,

            pageTitle: 'Insect - Wikipedia',
            pageUrl: PAGE_ID_5,
            body:
                '<div><p><b>Insects</b> (from <a href="https://en.wikipedia.org/wiki/Latin" title="Latin">Latin</a> <i><span title="Latin-language text"><i lang="la">insectum</i></span></i>) are <a href="https://en.wikipedia.org/wiki/Hexapoda" title="Hexapoda">hexapod</a> <a href="https://en.wikipedia.org/wiki/Invertebrate" title="Invertebrate">invertebrates</a> of the <a href="https://en.wikipedia.org/wiki/Class_(biology)" title="Class (biology)">class</a> <b>Insecta</b>. They are the largest group within the <a href="https://en.wikipedia.org/wiki/Arthropod" title="Arthropod">arthropod</a> <a href="https://en.wikipedia.org/wiki/Phylum" title="Phylum">phylum</a>. Insects have a <a href="https://en.wikipedia.org/wiki/Chitin" title="Chitin">chitinous</a> <a href="https://en.wikipedia.org/wiki/Exoskeleton" title="Exoskeleton">exoskeleton</a>, a three-part body (<a href="https://en.wikipedia.org/wiki/Insect_morphology#Head" title="Insect morphology">head</a>, <a href="https://en.wikipedia.org/wiki/Thorax_(insect_anatomy)" title="Thorax (insect anatomy)">thorax</a> and <a href="https://en.wikipedia.org/wiki/Abdomen_(insect_anatomy)" title="Abdomen (insect anatomy)">abdomen</a>), three pairs of jointed <a href="https://en.wikipedia.org/wiki/Arthropod_leg" title="Arthropod leg">legs</a>, <a href="https://en.wikipedia.org/wiki/Compound_eye" title="Compound eye">compound eyes</a>, and a pair of <a href="https://en.wikipedia.org/wiki/Antenna_(biology)" title="Antenna (biology)">antennae</a>. Insects are the most diverse group of animals, with more than a million described <a href="https://en.wikipedia.org/wiki/Species" title="Species">species</a>; they represent more than half of all animal species. \n</p></div>',
            comment: '',
            color: 'default',
            selector: {
                quote:
                    '<div><p><b>Insects</b> (from <a href="/wiki/Latin" title="Latin">Latin</a> <i><span title="Latin-language text"><i lang="la">insectum</i></span></i>) are <a href="/wiki/Hexapoda" title="Hexapoda">hexapod</a> <a href="/wiki/Invertebrate" title="Invertebrate">invertebrates</a> of the <a href="/wiki/Class_(biology)" title="Class (biology)">class</a> <b>Insecta</b>. They are the largest group within the <a href="/wiki/Arthropod" title="Arthropod">arthropod</a> <a href="/wiki/Phylum" title="Phylum">phylum</a>. Insects have a <a href="/wiki/Chitin" title="Chitin">chitinous</a> <a href="/wiki/Exoskeleton" title="Exoskeleton">exoskeleton</a>, a three-part body (<a href="/wiki/Insect_morphology#Head" title="Insect morphology">head</a>, <a href="/wiki/Thorax_(insect_anatomy)" title="Thorax (insect anatomy)">thorax</a> and <a href="/wiki/Abdomen_(insect_anatomy)" title="Abdomen (insect anatomy)">abdomen</a>), three pairs of jointed <a href="/wiki/Arthropod_leg" title="Arthropod leg">legs</a>, <a href="/wiki/Compound_eye" title="Compound eye">compound eyes</a>, and a pair of <a href="/wiki/Antenna_(biology)" title="Antenna (biology)">antennae</a>. Insects are the most diverse group of animals, with more than a million described <a href="/wiki/Species" title="Species">species</a>; they represent more than half of all animal species. \n</p></div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-25T05:01'), // UPDATED
            createdWhen: new Date('2024-03-22T06:01'),
        },
        {
            url: `${PAGE_ID_5}/#1711068409798`,

            pageTitle: 'Insect - Wikipedia',
            pageUrl: PAGE_ID_5,
            body: '<div>and</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>and</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:02'),
            createdWhen: new Date('2024-03-22T06:02'),
        },
        {
            url: `${PAGE_ID_5}/#1711068426352`,

            pageTitle: 'Insect - Wikipedia',
            pageUrl: PAGE_ID_5,
            body: '<div>about</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>about</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:03'),
            createdWhen: new Date('2024-03-22T06:03'),
        },
    ],
    [PAGE_ID_3]: [
        {
            url: `${PAGE_ID_3}/#1711067362844`,
            pageTitle: 'Jaguar - Wikipedia',
            pageUrl: PAGE_ID_3,
            body: '<div>directly</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>directly</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:11'),
            createdWhen: new Date('2024-03-21T06:11'),
        },
        {
            url: `${PAGE_ID_3}/#1711067368552`,
            pageTitle: 'Jaguar - Wikipedia',
            pageUrl: PAGE_ID_3,
            body: '<div>encyclopedia</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>encyclopedia</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:12'),
            createdWhen: new Date('2024-03-21T06:12'),
        },
        {
            url: `${PAGE_ID_3}/#1711067387492`,
            pageTitle: 'Jaguar - Wikipedia',
            pageUrl: PAGE_ID_3,
            body: '<div>unusual</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>unusual</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:13'),
            createdWhen: new Date('2024-03-21T06:13'),
        },
        {
            url: `${PAGE_ID_3}/#1711067399717`,
            pageTitle: 'Jaguar - Wikipedia',
            pageUrl: PAGE_ID_3,
            body: '<div>terrains</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>terrains</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:14'),
            createdWhen: new Date('2024-03-21T06:14'),
        },
    ],
    [PAGE_ID_10]: [
        {
            pageTitle: 'Organism - test.com',
            pageUrl: PAGE_ID_10,
            body: '<div><p>The term "organism"</p></div>',
            comment: '',
            selector: {
                quote:
                    '<div><p>The term "organism" (from <a href="/wiki/Greek_language" title="Greek language">Greek</a> ὀργανισμός, <i>organismos</i>, from ὄργανον, <i>organon</i>, i.e. "instrument, implement, tool, organ of sense or apprehension")<sup><a href="#cite_note-LSJ-6">[6]</a></sup><sup><a href="#cite_note-OnlineEtDict-7">[7]</a></sup> first appeared in the English language in 1703 and took on its current definition by 1834 (<i><a href="/wiki/Oxford_English_Dictionary" title="Oxford English Dictionary">Oxford English Dictionary</a></i>). It is directly related to the term "organization". There is a long tradition of defining organisms as self-organizing beings, going back at least to <a href="/wiki/Immanuel_Kant" title="Immanuel Kant">Immanuel Kant</a>\'s 1790 <i><a href="/wiki/Critique_of_Judgment" title="Critique of Judgment">Critique of Judgment</a></i>.<sup><a href="#cite_note-8">[8]</a></sup>\n</p>\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-25T06:11'),
            lastEdited: new Date('2024-03-25T06:11'),
            url: `${PAGE_ID_10}/#1711333408332`,
        },
    ],
    [PAGE_ID_9]: [
        {
            pageTitle: 'Phylum - test2.com',
            pageUrl: PAGE_ID_9,
            body:
                '<div><p>In <a href="https://en.wikipedia.org/wiki/Biology" title="Biology">biology</a>, a <b>phylum</b> (<span><span lang="en-fonipa"><a href="https://en.wikipedia.org/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="\'f\' in \'find\'">f</span><span title="/aɪ/: \'i\' in \'tide\'">aɪ</span><span title="\'l\' in \'lie\'">l</span><span title="/əm/: \'m\' in \'rhythm\'">əm</span></span>/</a></span></span>; <abbr title="plural form">pl.</abbr>: <b>phyla</b>) is a level of classification or <a href="https://en.wikipedia.org/wiki/Taxonomic_rank" title="Taxonomic rank">taxonomic rank</a> below <a href="https://en.wikipedia.org/wiki/Kingdom_(biology)" title="Kingdom (biology)">kingdom</a> and above <a href="https://en.wikipedia.org/wiki/Class_(biology)" title="Class (biology)">class</a>. Traditionally, in <a href="https://en.wikipedia.org/wiki/Botany" title="Botany">botany</a> the term <a href="https://en.wikipedia.org/wiki/Division_(biology)" title="Division (biology)">division</a> has been used instead of phylum, although the <a href="https://en.wikipedia.org/wiki/International_Code_of_Nomenclature_for_algae,_fungi,_and_plants" title="International Code of Nomenclature for algae, fungi, and plants">International Code of Nomenclature for algae, fungi, and plants</a> accepts the terms as equivalent.<sup><a href="#cite_note-ICN-1">[1]</a></sup><sup><a href="#cite_note-2">[2]</a></sup><sup><a href="#cite_note-Berg2007-3">[3]</a></sup> Depending on definitions, the animal kingdom <a href="https://en.wikipedia.org/wiki/Animalia" title="Animalia">Animalia</a> contains about 31 phyla, the plant kingdom <a href="https://en.wikipedia.org/wiki/Plantae" title="Plantae">Plantae</a> contains about 14 phyla, and the fungus kingdom <a href="https://en.wikipedia.org/wiki/Fungi" title="Fungi">Fungi</a> contains about 8 phyla. Current research in <a href="https://en.wikipedia.org/wiki/Phylogenetics" title="Phylogenetics">phylogenetics</a> is uncovering the relationships among phyla within larger <a href="https://en.wikipedia.org/wiki/Clades" title="Clades">clades</a> like <a href="https://en.wikipedia.org/wiki/Ecdysozoa" title="Ecdysozoa">Ecdysozoa</a> and <a href="https://en.wikipedia.org/wiki/Embryophyta" title="Embryophyta">Embryophyta</a>.\n</p>\n\n</div>',
            comment: '',
            selector: {
                quote:
                    '<div><p>In <a href="/wiki/Biology" title="Biology">biology</a>, a <b>phylum</b> (<span><span lang="en-fonipa"><a href="/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="\'f\' in \'find\'">f</span><span title="/aɪ/: \'i\' in \'tide\'">aɪ</span><span title="\'l\' in \'lie\'">l</span><span title="/əm/: \'m\' in \'rhythm\'">əm</span></span>/</a></span></span>; <abbr title="plural form">pl.</abbr>: <b>phyla</b>) is a level of classification or <a href="/wiki/Taxonomic_rank" title="Taxonomic rank">taxonomic rank</a> below <a href="/wiki/Kingdom_(biology)" title="Kingdom (biology)">kingdom</a> and above <a href="/wiki/Class_(biology)" title="Class (biology)">class</a>. Traditionally, in <a href="/wiki/Botany" title="Botany">botany</a> the term <a href="/wiki/Division_(biology)" title="Division (biology)">division</a> has been used instead of phylum, although the <a href="/wiki/International_Code_of_Nomenclature_for_algae,_fungi,_and_plants" title="International Code of Nomenclature for algae, fungi, and plants">International Code of Nomenclature for algae, fungi, and plants</a> accepts the terms as equivalent.<sup><a href="#cite_note-ICN-1">[1]</a></sup><sup><a href="#cite_note-2">[2]</a></sup><sup><a href="#cite_note-Berg2007-3">[3]</a></sup> Depending on definitions, the animal kingdom <a href="/wiki/Animalia" title="Animalia">Animalia</a> contains about 31 phyla, the plant kingdom <a href="/wiki/Plantae" title="Plantae">Plantae</a> contains about 14 phyla, and the fungus kingdom <a href="/wiki/Fungi" title="Fungi">Fungi</a> contains about 8 phyla. Current research in <a href="/wiki/Phylogenetics" title="Phylogenetics">phylogenetics</a> is uncovering the relationships among phyla within larger <a href="/wiki/Clades" title="Clades">clades</a> like <a href="/wiki/Ecdysozoa" title="Ecdysozoa">Ecdysozoa</a> and <a href="/wiki/Embryophyta" title="Embryophyta">Embryophyta</a>.\n</p>\n\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-23T06:21'),
            lastEdited: new Date('2024-03-23T06:21'),
            url: `${PAGE_ID_9}/#1711333382313`,
        },
        {
            pageTitle: 'Phylum - test2.com',
            pageUrl: PAGE_ID_9,
            body:
                '<div><p>The term phylum was coined in 1866 by <a href="https://en.wikipedia.org/wiki/Ernst_Haeckel" title="Ernst Haeckel">Ernst Haeckel</a> from the Greek <span title="Ancient Greek (to 1453)-language romanization"><i lang="grc-Latn">phylon</i></span> (<span lang="grc"><a href="https://en.wiktionary.org/wiki/%CF%86%E1%BF%A6%CE%BB%CE%BF%CE%BD#Ancient_Greek" title="wikt:φῦλον">φῦλον</a></span>, "race, stock"), related to <span title="Ancient Greek (to 1453)-language romanization"><i lang="grc-Latn">phyle</i></span> (<span lang="grc"><a href="https://en.wiktionary.org/wiki/%CF%86%CF%85%CE%BB%CE%AE#Ancient_Greek" title="wikt:φυλή">φυλή</a></span>, "tribe, clan").<sup><a href="#cite_note-FOOTNOTEValentine20048-4">[4]</a></sup><sup><a href="#cite_note-5">[5]</a></sup> Haeckel noted that species constantly evolved into new species that seemed to retain few consistent features among themselves and therefore few features that distinguished them as a group ("a self-contained unity"): "perhaps such a real and completely self-contained unity is the aggregate of all species which have gradually evolved from one and the same common original form, as, for example, all vertebrates. We name this aggregate [a] <span title="German-language text"><i lang="de">Stamm</i></span> [i.e., stock] (<span title="German-language text"><i lang="de">Phylon</i></span>)."<sup><a href="#cite_note-6">[a]</a></sup> In <a href="https://en.wikipedia.org/wiki/Plant_taxonomy" title="Plant taxonomy">plant taxonomy</a>, <a href="https://en.wikipedia.org/wiki/August_W._Eichler" title="August W. Eichler">August W. Eichler</a> (1883) classified plants into <a href="https://en.wikipedia.org/wiki/Eichler_system" title="Eichler system">five groups</a> named divisions, a term that remains in use today for groups of plants, algae and fungi.<sup><a href="#cite_note-ICN-1">[1]</a></sup><sup><a href="#cite_note-7">[6]</a></sup>\nThe definitions of zoological phyla have changed from their origins in the six <a href="https://en.wikipedia.org/wiki/Linnaean_taxonomy" title="Linnaean taxonomy">Linnaean</a> classes and the four <span title="French-language text"><i lang="fr">embranchements</i></span> of <a href="https://en.wikipedia.org/wiki/Georges_Cuvier" title="Georges Cuvier">Georges Cuvier</a>.<sup><a href="#cite_note-8">[7]</a></sup>\n</p></div>',
            comment: 'test',
            selector: {
                quote:
                    '<div><p>The term phylum was coined in 1866 by <a href="/wiki/Ernst_Haeckel" title="Ernst Haeckel">Ernst Haeckel</a> from the Greek <span title="Ancient Greek (to 1453)-language romanization"><i lang="grc-Latn">phylon</i></span> (<span lang="grc"><a href="https://en.wiktionary.org/wiki/%CF%86%E1%BF%A6%CE%BB%CE%BF%CE%BD#Ancient_Greek" title="wikt:φῦλον">φῦλον</a></span>, "race, stock"), related to <span title="Ancient Greek (to 1453)-language romanization"><i lang="grc-Latn">phyle</i></span> (<span lang="grc"><a href="https://en.wiktionary.org/wiki/%CF%86%CF%85%CE%BB%CE%AE#Ancient_Greek" title="wikt:φυλή">φυλή</a></span>, "tribe, clan").<sup><a href="#cite_note-FOOTNOTEValentine20048-4">[4]</a></sup><sup><a href="#cite_note-5">[5]</a></sup> Haeckel noted that species constantly evolved into new species that seemed to retain few consistent features among themselves and therefore few features that distinguished them as a group ("a self-contained unity"): "perhaps such a real and completely self-contained unity is the aggregate of all species which have gradually evolved from one and the same common original form, as, for example, all vertebrates. We name this aggregate [a] <span title="German-language text"><i lang="de">Stamm</i></span> [i.e., stock] (<span title="German-language text"><i lang="de">Phylon</i></span>)."<sup><a href="#cite_note-6">[a]</a></sup> In <a href="/wiki/Plant_taxonomy" title="Plant taxonomy">plant taxonomy</a>, <a href="/wiki/August_W._Eichler" title="August W. Eichler">August W. Eichler</a> (1883) classified plants into <a href="/wiki/Eichler_system" title="Eichler system">five groups</a> named divisions, a term that remains in use today for groups of plants, algae and fungi.<sup><a href="#cite_note-ICN-1">[1]</a></sup><sup><a href="#cite_note-7">[6]</a></sup>\nThe definitions of zoological phyla have changed from their origins in the six <a href="/wiki/Linnaean_taxonomy" title="Linnaean taxonomy">Linnaean</a> classes and the four <span title="French-language text"><i lang="fr">embranchements</i></span> of <a href="/wiki/Georges_Cuvier" title="Georges Cuvier">Georges Cuvier</a>.<sup><a href="#cite_note-8">[7]</a></sup>\n</p></div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-23T06:22'),
            lastEdited: new Date('2024-03-23T06:22'),
            url: `${PAGE_ID_9}/#1711333384046`,
        },
        {
            pageTitle: 'Phylum - test2.com',
            pageUrl: PAGE_ID_9,
            body:
                '<div><p>Informally, phyla can be thought of as groupings of organisms based on general specialization of <a href="https://en.wikipedia.org/wiki/Body_plan" title="Body plan">body plan</a>.<sup><a href="#cite_note-9">[8]</a></sup> At its most basic, a phylum can be defined in two ways: as a group of organisms with a certain degree of morphological or developmental similarity (the <a href="https://en.wikipedia.org/wiki/Phenetic" title="Phenetic">phenetic</a> definition), or a group of organisms with a certain degree of evolutionary relatedness (the <a href="https://en.wikipedia.org/wiki/Phylogenetic" title="Phylogenetic">phylogenetic</a> definition).<sup><a href="#cite_note-Budd2000-10">[9]</a></sup> Attempting to define a level of the <a href="https://en.wikipedia.org/wiki/Linnaean_taxonomy" title="Linnaean taxonomy">Linnean hierarchy</a> without referring to (evolutionary) relatedness is unsatisfactory, but a phenetic definition is useful when addressing questions of a morphological nature—such as how successful different body plans were.<sup>[<i><a href="https://en.wikipedia.org/wiki/Wikipedia:Citation_needed" title="Wikipedia:Citation needed"><span title="This claim needs references to reliable sources. (May 2017)">citation needed</span></a></i>]</sup>\n</p>\n</div>',
            comment: '',
            selector: {
                quote:
                    '<div><p>Informally, phyla can be thought of as groupings of organisms based on general specialization of <a href="/wiki/Body_plan" title="Body plan">body plan</a>.<sup><a href="#cite_note-9">[8]</a></sup> At its most basic, a phylum can be defined in two ways: as a group of organisms with a certain degree of morphological or developmental similarity (the <a href="/wiki/Phenetic" title="Phenetic">phenetic</a> definition), or a group of organisms with a certain degree of evolutionary relatedness (the <a href="/wiki/Phylogenetic" title="Phylogenetic">phylogenetic</a> definition).<sup><a href="#cite_note-Budd2000-10">[9]</a></sup> Attempting to define a level of the <a href="/wiki/Linnaean_taxonomy" title="Linnaean taxonomy">Linnean hierarchy</a> without referring to (evolutionary) relatedness is unsatisfactory, but a phenetic definition is useful when addressing questions of a morphological nature—such as how successful different body plans were.<sup>[<i><a href="/wiki/Wikipedia:Citation_needed" title="Wikipedia:Citation needed"><span title="This claim needs references to reliable sources. (May 2017)">citation needed</span></a></i>]</sup>\n</p>\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-23T06:23'),
            lastEdited: new Date('2024-03-23T06:23'),
            url: `${PAGE_ID_9}/#1711333385412`,
        },
    ],
    [PAGE_ID_7]: [
        {
            url: `${PAGE_ID_7}/#1711074495092`,
            pageTitle: 'Tympanum (anatomy) - Wikipedia',
            pageUrl: PAGE_ID_7,
            body: '<div>anatomy</div>',
            comment: 'test',
            color: 'default',
            selector: {
                quote: '<div>anatomy</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-23T06:01'),
            createdWhen: new Date('2024-03-23T06:01'),
        },
        {
            url: `${PAGE_ID_7}/#1711074524064`,
            pageTitle: 'Tympanum (anatomy) - Wikipedia',
            pageUrl: PAGE_ID_7,
            body:
                '<div><p>In general, any animal that reacts to sounds or communicates by means of sound, needs to have an auditory mechanism. This typically consists of a membrane capable of vibration known as the tympanum, an air-filled chamber and sensory organs to detect the auditory stimuli.\n</p>\n</div>',
            comment: '',
            color: 'default',
            selector: {
                quote:
                    '<div><p>In general, any animal that reacts to sounds or communicates by means of sound, needs to have an auditory mechanism. This typically consists of a membrane capable of vibration known as the tympanum, an air-filled chamber and sensory organs to detect the auditory stimuli.\n</p>\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-23T06:02'),
            createdWhen: new Date('2024-03-23T06:02'),
        },
        {
            url: `${PAGE_ID_7}/#1711074612109`,
            pageTitle: 'Tympanum (anatomy) - Wikipedia',
            pageUrl: PAGE_ID_7,
            body: '<div>and</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>and</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-23T06:03'),
            createdWhen: new Date('2024-03-23T06:03'),
        },
        {
            url: `${PAGE_ID_7}/#1711179221253`,
            pageTitle: 'Tympanum (anatomy) - Wikipedia',
            pageUrl: PAGE_ID_7,
            comment: '<div><p>test today</p></div>',
            createdWhen: new Date('2024-03-23T06:04'),
            lastEdited: new Date('2024-03-23T06:04'),
        },
    ],
    [PAGE_ID_12]: [
        {
            url: `${PAGE_ID_12}/#1711179221253`,
            pageTitle: 'Europe - Wikipedia',
            pageUrl: PAGE_ID_12,
            comment: '<div><p>test</p></div>',
            createdWhen: new Date('2024-03-23T07:04'),
            lastEdited: new Date('2024-03-23T07:04'),
        },
    ],
}

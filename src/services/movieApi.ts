import type { Movie, MovieDetail, SearchResult } from '../types/movie'

interface MovieTemplate {
  baseTitle: string
  genre: string
  director: string
  country: string
  language: string
  minYear: number
  maxYear: number
  plotTemplate: string
}

const movieTemplates: MovieTemplate[] = [
  { baseTitle: '追光者', genre: '剧情 / 爱情', director: '陈思诚', country: '中国', language: '汉语普通话', minYear: 2010, maxYear: 2024, plotTemplate: '一个关于{theme}的感人故事，主角在{setting}中经历了{emotion}的旅程。' },
  { baseTitle: '星际迷航', genre: '科幻 / 冒险', director: '郭帆', country: '中国', language: '汉语普通话', minYear: 2015, maxYear: 2024, plotTemplate: '在{setting}的未来世界，人类面临{challenge}的威胁，一群勇敢的{character}踏上了{journey}。' },
  { baseTitle: '暗影追踪', genre: '悬疑 / 犯罪', director: '文牧野', country: '中国', language: '汉语普通话', minYear: 2012, maxYear: 2024, plotTemplate: '一名{profession}在调查{crime}时，发现了隐藏在{setting}背后的惊天秘密。' },
  { baseTitle: '山海之间', genre: '剧情 / 文艺', director: '贾樟柯', country: '中国', language: '汉语普通话', minYear: 2005, maxYear: 2024, plotTemplate: '在{setting}的小镇上，{character}的生活因{event}而发生了翻天覆地的变化。' },
  { baseTitle: '暗夜骑士', genre: '动作 / 惊悚', director: '林超贤', country: '中国', language: '汉语普通话', minYear: 2010, maxYear: 2024, plotTemplate: '一位{profession}为了{goal}，必须在{time}内完成{mission}。' },
  { baseTitle: '梦回大唐', genre: '奇幻 / 古装', director: '陈凯歌', country: '中国', language: '汉语普通话', minYear: 2008, maxYear: 2024, plotTemplate: '穿越到{era}的{character}，在{setting}中展开了一段{adjective}的传奇。' },
  { baseTitle: '城市之光', genre: '剧情 / 社会', director: '张艺谋', country: '中国', language: '汉语普通话', minYear: 2000, maxYear: 2024, plotTemplate: '在{setting}的都市中，{character}用{method}改变了{group}的命运。' },
  { baseTitle: '江湖风云', genre: '动作 / 武侠', director: '徐克', country: '中国', language: '汉语普通话', minYear: 2005, maxYear: 2024, plotTemplate: '武林盟主{name}在{setting}遭遇{event}，不得不{action}。' },
  { baseTitle: '青春纪事', genre: '爱情 / 青春', director: '赵薇', country: '中国', language: '汉语普通话', minYear: 2010, maxYear: 2024, plotTemplate: '在{setting}的校园里，{character}与{lover}经历了{emotion}的青春。' },
  { baseTitle: '深海探秘', genre: '冒险 / 科幻', director: '陆川', country: '中国', language: '汉语普通话', minYear: 2012, maxYear: 2024, plotTemplate: '一支{team}在{setting}发现了{discovery}，这改变了人类对{topic}的认知。' },
]

const themes = ['梦想与现实', '爱与救赎', '成长与蜕变', '记忆与遗忘', '勇气与恐惧', '自由与束缚', '希望与绝望', '过去与未来']
const settings = ['繁华都市', '偏远小镇', '神秘岛屿', '未来都市', '古代皇宫', '深山老林', '沙漠绿洲', '北极冰原']
const emotions = ['刻骨铭心', '感人至深', '震撼人心', '温暖治愈', '惊心动魄', '发人深省', '令人唏嘘', '振奋人心']
const challenges = ['外星人入侵', '气候变化', '人工智能失控', '病毒爆发', '资源枯竭', '时间扭曲', '平行宇宙', '星际战争']
const characters = ['普通青年', '退休特工', '天才科学家', '神秘侠客', '落魄贵族', '叛逆少年', '坚毅母亲', '孤独旅人']
const journeys = ['拯救世界的旅程', '寻找真相的冒险', '自我救赎的道路', '穿越时空的探索', '守护家园的战斗', '追寻梦想的旅程']
const crimes = ['连环谋杀案', '金融诈骗案', '文物盗窃案', '毒品交易案', '绑架勒索案', '间谍渗透案']
const professions = ['刑警队长', '私家侦探', '法医专家', '检察官', '卧底警察', '犯罪心理学家']
const events = ['一场突如其来的车祸', '一封神秘来信', '一次偶然相遇', '一个惊天秘密', '一次命运转折', '一场生死考验']
const goals = ['拯救被绑架的女儿', '揭露腐败内幕', '为家人复仇', '守护国家机密', '找回失落的记忆', '证明自己的清白']
const times = ['24小时', '三天', '一周', '一个月', '最后期限']
const missions = ['看似不可能的任务', '危险重重的卧底', '穿越敌区的行动', '保护关键证人', '销毁致命武器']
const eras = ['唐朝盛世', '三国鼎立', '民国时期', '清朝末年', '宋朝乱世', '明朝风云']
const adjectives = ['波澜壮阔', '跌宕起伏', '惊心动魄', '荡气回肠', '凄美动人', '传奇励志']
const methods = ['智慧', '勇气', '坚持', '善良', '信念', '行动']
const groups = ['弱势群体', '被压迫的人民', '迷失的青年', '受苦的百姓', '无助的儿童']
const names = ['李云飞', '张伟', '王芳', '陈静', '刘洋', '赵磊', '孙丽', '周杰']
const actions = ['重出江湖', '隐姓埋名', '奋起反抗', '远走他乡', '调查真相', '守护秘密']
const teams = ['科考队', '救援队', '探险队', '特工小组', '军事小队', '科研团队']
const discoveries = ['失落的文明', '神秘生物', '远古遗迹', '外星信号', '时空裂缝', '深海基地']
const topics = ['生命起源', '宇宙奥秘', '人类未来', '地球历史', '自然法则', '意识本质']

const suffixes = ['', '', '', '：重生', '：觉醒', '：崛起', '：终章', '：前传', '：归来', '：新纪元', '：决战', '：黎明', '：救赎']
const prefixes = ['', '', '', '新', '超能', '极限', '逆', '暗', '光', '真', '大', '小']

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomRating(): string {
  return (Math.random() * 4 + 5.5).toFixed(1)
}

function randomRuntime(): string {
  return `${randomInt(85, 180)} min`
}

function randomDate(year: number): string {
  const month = randomInt(1, 12)
  const day = randomInt(1, 28)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day} ${months[month - 1]} ${year}`
}

function randomVotes(): string {
  const num = randomInt(50000, 500000)
  return num.toLocaleString()
}

function fillPlot(template: string): string {
  let result = template
  const placeholders: Record<string, () => string> = {
    '{theme}': () => randomChoice(themes),
    '{setting}': () => randomChoice(settings),
    '{emotion}': () => randomChoice(emotions),
    '{challenge}': () => randomChoice(challenges),
    '{character}': () => randomChoice(characters),
    '{journey}': () => randomChoice(journeys),
    '{crime}': () => randomChoice(crimes),
    '{profession}': () => randomChoice(professions),
    '{event}': () => randomChoice(events),
    '{goal}': () => randomChoice(goals),
    '{time}': () => randomChoice(times),
    '{mission}': () => randomChoice(missions),
    '{era}': () => randomChoice(eras),
    '{adjective}': () => randomChoice(adjectives),
    '{method}': () => randomChoice(methods),
    '{group}': () => randomChoice(groups),
    '{name}': () => randomChoice(names),
    '{action}': () => randomChoice(actions),
    '{team}': () => randomChoice(teams),
    '{discovery}': () => randomChoice(discoveries),
    '{topic}': () => randomChoice(topics),
  }

  for (const [key, fn] of Object.entries(placeholders)) {
    while (result.includes(key)) {
      result = result.replace(key, fn())
    }
  }
  return result
}

const posterPrompts = [
  'movie poster cinematic dramatic lighting',
  'movie poster epic adventure landscape',
  'movie poster romantic drama sunset',
  'movie poster sci-fi futuristic city',
  'movie poster action thriller dark',
  'movie poster mystery detective noir',
  'movie poster fantasy magical kingdom',
  'movie poster historical ancient times',
  'movie poster comedy colorful fun',
  'movie poster horror eerie atmosphere',
]

function getPosterUrl(index: number): string {
  const prompt = encodeURIComponent(posterPrompts[index % posterPrompts.length])
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=portrait_4_3`
}

function generateMovie(index: number): Movie {
  const template = movieTemplates[index % movieTemplates.length]
  const year = String(randomInt(template.minYear, template.maxYear))
  const prefix = randomChoice(prefixes)
  const suffix = randomChoice(suffixes)
  const titleNumber = Math.floor(index / movieTemplates.length) + 1
  const title = `${prefix}${template.baseTitle}${suffix}${titleNumber > 1 ? ' ' + titleNumber : ''}`

  return {
    id: `tt${String(1000000 + index).padStart(7, '0')}`,
    title: title.trim(),
    year,
    type: 'movie',
    poster: getPosterUrl(index),
    rating: randomRating(),
    released: randomDate(parseInt(year)),
    runtime: randomRuntime(),
    genre: template.genre,
    director: template.director,
    writer: `${template.director} / ${randomChoice(['原创剧本', '改编自小说', '联合编剧'])}`,
    actors: `${randomChoice(['刘德华', '梁朝伟', '章子怡', '周迅', '陈坤', '李冰冰', '黄晓明', '孙俪'])} / ${randomChoice(['张震', '舒淇', '刘昊然', '周冬雨', '易烊千玺', '张子枫'])} / ${randomChoice(['王景春', '咏梅', '段奕宏', '廖凡', '桂纶镁'])}`,
    plot: fillPlot(template.plotTemplate),
    language: template.language,
    country: template.country,
    awards: `${randomChoice(['获得', '提名', '荣获'])}${randomInt(1, 5)}项${randomChoice(['金鸡奖', '金像奖', '金马奖', '百花奖', '华表奖'])}`,
    imdbRating: randomRating(),
    imdbVotes: randomVotes(),
  }
}

function generateMockMovies(count: number): Movie[] {
  const movies: Movie[] = []
  for (let i = 0; i < count; i++) {
    movies.push(generateMovie(i))
  }
  return movies
}

const mockMovies: Movie[] = generateMockMovies(1000)
const mockSeries: Movie[] = generateMockMovies(1000).map((m, i) => ({
  ...m,
  id: `tt${String(2000000 + i).padStart(7, '0')}`,
  type: 'series',
  title: m.title.replace('电影', '剧集')
}))

const mockHotMovies = mockMovies.slice(0, 10)
const mockHotSeries = mockSeries.slice(0, 10)
const mockTopRated = [...mockMovies, ...mockSeries]
  .sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))
  .slice(0, 10)

export interface FilterOptions {
  genre?: string
  yearRange?: '1year' | '3years' | 'all'
  minRating?: '8' | '7' | 'all'
  category?: 'movie' | 'series' | 'all'
}

export function getHotMoviesList(): Promise<Movie[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockHotMovies)
    }, 300)
  })
}

export function getHotSeriesList(): Promise<Movie[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockHotSeries)
    }, 300)
  })
}

export function getTopRatedList(): Promise<Movie[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockTopRated)
    }, 300)
  })
}

export function filterMovies(options: FilterOptions, page: number = 1): Promise<SearchResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allItems = [...mockMovies, ...mockSeries]
      const currentYear = new Date().getFullYear()
      
      let filtered = allItems.filter(movie => {
        if (options.category && options.category !== 'all') {
          if (options.category === 'movie' && movie.type !== 'movie') return false
          if (options.category === 'series' && movie.type !== 'series') return false
        }
        
        if (options.genre && options.genre !== 'all') {
          if (!movie.genre?.toLowerCase().includes(options.genre.toLowerCase())) return false
        }
        
        if (options.yearRange && options.yearRange !== 'all') {
          const movieYear = parseInt(movie.year)
          const years = options.yearRange === '1year' ? 1 : 3
          if (currentYear - movieYear > years) return false
        }
        
        if (options.minRating && options.minRating !== 'all') {
          const rating = parseFloat(movie.rating || '0')
          if (rating < parseFloat(options.minRating)) return false
        }
        
        return true
      })

      const pageSize = 20
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedResults = filtered.slice(start, end)

      resolve({
        Search: paginatedResults,
        totalResults: String(filtered.length),
        Response: filtered.length > 0 ? 'True' : 'False'
      })
    }, 300)
  })
}

export function searchMovies(keyword: string, page: number = 1): Promise<SearchResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = keyword
        ? mockMovies.filter(movie =>
            movie.title.toLowerCase().includes(keyword.toLowerCase()) ||
            movie.genre?.toLowerCase().includes(keyword.toLowerCase()) ||
            movie.year.includes(keyword) ||
            movie.director?.toLowerCase().includes(keyword.toLowerCase())
          )
        : mockMovies

      const pageSize = 20
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedResults = filtered.slice(start, end)

      resolve({
        Search: paginatedResults,
        totalResults: String(filtered.length),
        Response: filtered.length > 0 ? 'True' : 'False'
      })
    }, 300)
  })
}

export function getHotMovies(): Promise<Movie[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockHotMovies)
    }, 300)
  })
}

export function getMovieDetail(id: string): Promise<MovieDetail | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const movie = mockMovies.find(m => m.id === id)
      if (movie) {
        resolve({
          ...movie,
          Rated: ['G', 'PG', 'PG-13', 'R', 'NC-17'][randomInt(0, 4)],
          Released: movie.released || 'N/A',
          Runtime: movie.runtime || 'N/A',
          Genre: movie.genre || 'N/A',
          Director: movie.director || 'N/A',
          Writer: movie.writer || 'N/A',
          Actors: movie.actors || 'N/A',
          Plot: movie.plot || '暂无简介',
          Language: movie.language || 'N/A',
          Country: movie.country || 'N/A',
          Awards: movie.awards || 'N/A',
          imdbRating: movie.imdbRating || movie.rating || 'N/A',
          imdbVotes: movie.imdbVotes || 'N/A'
        } as MovieDetail)
      } else {
        resolve(null)
      }
    }, 200)
  })
}

export { mockMovies, mockHotMovies }

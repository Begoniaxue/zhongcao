interface Showtime {
  id: string
  cinemaId: string
  cinemaName: string
  date: string
  startTime: string
  endTime: string
  hallName: string
  hallType: 'IMAX' | 'Dolby' | 'Normal'
  remainingSeats: number
  price: number
}

function filterShowtimes(
  showtimes: Showtime[],
  isToday: boolean,
  currentHour: number,
  currentMin: number,
  timeFilter: string = 'all',
  hallTypeFilter: string = 'all'
): Showtime[] {
  return showtimes.filter(st => {
    if (isToday) {
      const [endH, endM] = st.endTime.split(':').map(Number)
      if (endH < currentHour || (endH === currentHour && endM <= currentMin)) return false
    }
    if (timeFilter !== 'all') {
      const hour = parseInt(st.startTime.split(':')[0])
      if (timeFilter === 'morning' && (hour < 9 || hour >= 12)) return false
      if (timeFilter === 'afternoon' && (hour < 12 || hour >= 18)) return false
      if (timeFilter === 'evening' && (hour < 18 || hour >= 24)) return false
    }
    if (hallTypeFilter !== 'all' && st.hallType !== hallTypeFilter) return false
    return true
  })
}

const mockShowtimes: Showtime[] = [
  { id: '1', cinemaId: 'c1', cinemaName: '万达影城', date: '5月29日 今天', startTime: '09:30', endTime: '11:38', hallName: '1号厅', hallType: 'IMAX', remainingSeats: 120, price: 89 },
  { id: '2', cinemaId: 'c1', cinemaName: '万达影城', date: '5月29日 今天', startTime: '11:20', endTime: '13:28', hallName: '2号厅', hallType: 'Dolby', remainingSeats: 80, price: 69 },
  { id: '3', cinemaId: 'c1', cinemaName: '万达影城', date: '5月29日 今天', startTime: '13:10', endTime: '15:18', hallName: '3号厅', hallType: 'Normal', remainingSeats: 100, price: 49 },
  { id: '4', cinemaId: 'c1', cinemaName: '万达影城', date: '5月29日 今天', startTime: '15:00', endTime: '17:08', hallName: '4号厅', hallType: 'Normal', remainingSeats: 90, price: 49 },
  { id: '5', cinemaId: 'c1', cinemaName: '万达影城', date: '5月29日 今天', startTime: '17:20', endTime: '19:28', hallName: '5号厅', hallType: 'IMAX', remainingSeats: 70, price: 89 },
  { id: '6', cinemaId: 'c1', cinemaName: '万达影城', date: '5月29日 今天', startTime: '19:10', endTime: '21:18', hallName: '6号厅', hallType: 'Dolby', remainingSeats: 110, price: 69 },
  { id: '7', cinemaId: 'c1', cinemaName: '万达影城', date: '5月29日 今天', startTime: '21:00', endTime: '23:08', hallName: '7号厅', hallType: 'Normal', remainingSeats: 130, price: 49 },
  { id: '8', cinemaId: 'c1', cinemaName: '万达影城', date: '5月29日 今天', startTime: '22:30', endTime: '00:38', hallName: '8号厅', hallType: 'Normal', remainingSeats: 150, price: 49 },
]

function runTests() {
  console.log('\n=== 🎬 场次过滤逻辑测试 ===\n')

  console.log('原始场次列表（按结束时间排序）：')
  mockShowtimes.forEach(st => {
    console.log(`  ${st.startTime}-${st.endTime} | ${st.hallType} | ¥${st.price}`)
  })
  console.log('')

  // 测试场景1：上午 10:00
  console.log('📌 场景1：当前时间 10:00（上午）')
  const result1 = filterShowtimes(mockShowtimes, true, 10, 0)
  console.log(`  保留 ${result1.length} 场，过滤掉 ${mockShowtimes.length - result1.length} 场`)
  result1.forEach(st => console.log(`    ✅ ${st.startTime}-${st.endTime} (结束时间11:38及以后保留)`))
  console.log('  被过滤的场次（结束时间 <= 10:00）：')
  mockShowtimes.filter(st => !result1.includes(st)).forEach(st => console.log(`    ❌ ${st.startTime}-${st.endTime}`))
  console.log('')

  // 测试场景2：下午 14:30
  console.log('📌 场景2：当前时间 14:30（下午）')
  const result2 = filterShowtimes(mockShowtimes, true, 14, 30)
  console.log(`  保留 ${result2.length} 场，过滤掉 ${mockShowtimes.length - result2.length} 场`)
  result2.forEach(st => console.log(`    ✅ ${st.startTime}-${st.endTime}`))
  console.log('  被过滤的场次（结束时间 <= 14:30）：')
  mockShowtimes.filter(st => !result2.includes(st)).forEach(st => console.log(`    ❌ ${st.startTime}-${st.endTime}`))
  console.log('')

  // 测试场景3：晚上 20:00
  console.log('📌 场景3：当前时间 20:00（晚上）')
  const result3 = filterShowtimes(mockShowtimes, true, 20, 0)
  console.log(`  保留 ${result3.length} 场，过滤掉 ${mockShowtimes.length - result3.length} 场`)
  result3.forEach(st => console.log(`    ✅ ${st.startTime}-${st.endTime}`))
  console.log('  被过滤的场次（结束时间 <= 20:00）：')
  mockShowtimes.filter(st => !result3.includes(st)).forEach(st => console.log(`    ❌ ${st.startTime}-${st.endTime}`))
  console.log('')

  // 测试场景4：午夜 23:30
  console.log('📌 场景4：当前时间 23:30（午夜）')
  const result4 = filterShowtimes(mockShowtimes, true, 23, 30)
  console.log(`  保留 ${result4.length} 场，过滤掉 ${mockShowtimes.length - result4.length} 场`)
  result4.forEach(st => console.log(`    ✅ ${st.startTime}-${st.endTime}`))
  mockShowtimes.filter(st => !result4.includes(st)).forEach(st => console.log(`    ❌ ${st.startTime}-${st.endTime}`))
  console.log('')

  // 测试场景5：非今天（明天）
  console.log('📌 场景5：选中明天（非今天），不过滤')
  const result5 = filterShowtimes(mockShowtimes, false, 20, 0)
  console.log(`  保留 ${result5.length} 场（全部保留）`)
  console.log('')

  // 测试场景6：晚上时段筛选 + 非今天
  console.log('📌 场景6：晚上时段筛选 + 明天')
  const result6 = filterShowtimes(mockShowtimes, false, 20, 0, 'evening', 'all')
  console.log(`  筛选 [晚上时段] 结果：${result6.length} 场`)
  result6.forEach(st => console.log(`    ✅ ${st.startTime}-${st.endTime} (开始时间 >= 18:00)`))
  console.log('')

  // 测试场景7：巨幕厅筛选
  console.log('📌 场景7：巨幕厅筛选')
  const result7 = filterShowtimes(mockShowtimes, false, 0, 0, 'all', 'IMAX')
  console.log(`  筛选 [IMAX厅] 结果：${result7.length} 场`)
  result7.forEach(st => console.log(`    ✅ ${st.startTime}-${st.endTime} | ${st.hallType}`))
  console.log('')

  console.log('=== ✅ 测试完成 ===\n')
}

runTests()

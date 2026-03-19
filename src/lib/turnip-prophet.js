// Turnip Prophet 核心预测逻辑（改写自 mikebryant/ac-nh-turnip-prices）
// 来源: https://github.com/mikebryant/ac-nh-turnip-prices
// 说明: 保持算法结构，提供简洁的 ESM 导出供 Vue 页面调用

const PATTERN = {
  FLUCTUATING: 0,
  LARGE_SPIKE: 1,
  DECREASING: 2,
  SMALL_SPIKE: 3
}

const PROBABILITY_MATRIX = {
  [PATTERN.FLUCTUATING]: {
    [PATTERN.FLUCTUATING]: 0.2,
    [PATTERN.LARGE_SPIKE]: 0.3,
    [PATTERN.DECREASING]: 0.15,
    [PATTERN.SMALL_SPIKE]: 0.35
  },
  [PATTERN.LARGE_SPIKE]: {
    [PATTERN.FLUCTUATING]: 0.5,
    [PATTERN.LARGE_SPIKE]: 0.05,
    [PATTERN.DECREASING]: 0.2,
    [PATTERN.SMALL_SPIKE]: 0.25
  },
  [PATTERN.DECREASING]: {
    [PATTERN.FLUCTUATING]: 0.25,
    [PATTERN.LARGE_SPIKE]: 0.45,
    [PATTERN.DECREASING]: 0.05,
    [PATTERN.SMALL_SPIKE]: 0.25
  },
  [PATTERN.SMALL_SPIKE]: {
    [PATTERN.FLUCTUATING]: 0.45,
    [PATTERN.LARGE_SPIKE]: 0.25,
    [PATTERN.DECREASING]: 0.15,
    [PATTERN.SMALL_SPIKE]: 0.15
  }
}

const RATE_MULTIPLIER = 10000

function range_length(range) {
  return range[1] - range[0]
}

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max)
}

function range_intersect(range1, range2) {
  if (range1[0] > range2[1] || range1[1] < range2[0]) return null
  return [Math.max(range1[0], range2[0]), Math.min(range1[1], range2[1])]
}

function range_intersect_length(range1, range2) {
  if (range1[0] > range2[1] || range1[1] < range2[0]) return 0
  return range_length(range_intersect(range1, range2))
}

// 改写自原项目：Neumaier 版本 Kahan 求和
function float_sum(input) {
  let sum = 0
  let c = 0
  for (let i = 0; i < input.length; i++) {
    const cur = input[i]
    const t = sum + cur
    if (Math.abs(sum) >= Math.abs(cur)) c += (sum - t) + cur
    else c += (cur - t) + sum
    sum = t
  }
  return sum + c
}

function prefix_float_sum(input) {
  const prefix_sum = [[0, 0]]
  let sum = 0
  let c = 0
  for (let i = 0; i < input.length; i++) {
    const cur = input[i]
    const t = sum + cur
    if (Math.abs(sum) >= Math.abs(cur)) c += (sum - t) + cur
    else c += (cur - t) + sum
    sum = t
    prefix_sum.push([sum, c])
  }
  return prefix_sum
}

class PDF {
  constructor(a, b, uniform = true) {
    this.value_start = Math.floor(a)
    this.value_end = Math.ceil(b)
    const range = [a, b]
    const total_length = range_length(range)
    this.prob = Array(this.value_end - this.value_start)
    if (uniform) {
      for (let i = 0; i < this.prob.length; i++) {
        this.prob[i] = range_intersect_length(this.range_of(i), range) / total_length
      }
    } else {
      for (let i = 0; i < this.prob.length; i++) this.prob[i] = 0
    }
  }

  range_of(idx) {
    return [this.value_start + idx, this.value_start + idx + 1]
  }

  min_value() {
    return this.value_start
  }

  max_value() {
    return this.value_end
  }

  normalize() {
    const total_probability = float_sum(this.prob)
    for (let i = 0; i < this.prob.length; i++) this.prob[i] /= total_probability
    return total_probability
  }

  range_limit(range) {
    let [start, end] = range
    start = Math.max(start, this.min_value())
    end = Math.min(end, this.max_value())
    if (start >= end) {
      this.value_start = this.value_end = 0
      this.prob = []
      return 0
    }
    start = Math.floor(start)
    end = Math.ceil(end)

    const start_idx = start - this.value_start
    const end_idx = end - this.value_start
    for (let i = start_idx; i < end_idx; i++) {
      this.prob[i] *= range_intersect_length(this.range_of(i), range)
    }

    this.prob = this.prob.slice(start_idx, end_idx)
    this.value_start = start
    this.value_end = end
    return this.normalize()
  }

  decay(rate_decay_min, rate_decay_max) {
    rate_decay_min = Math.round(rate_decay_min)
    rate_decay_max = Math.round(rate_decay_max)
    const prefix = prefix_float_sum(this.prob)
    const max_X = this.prob.length
    const max_Y = rate_decay_max - rate_decay_min
    const newProb = Array(this.prob.length + max_Y)
    for (let i = 0; i < newProb.length; i++) {
      const left = Math.max(0, i - max_Y)
      const right = Math.min(max_X - 1, i)
      let sum = prefix[right + 1][0] - prefix[left][0]
      let c = prefix[right + 1][1] - prefix[left][1]
      if (left === i - max_Y && left >= 0 && left < max_X) {
        sum -= this.prob[left] * 0.5
        c -= 0
      }
      if (right === i && right >= 0 && right < max_X) {
        sum -= this.prob[right] * 0.5
        c -= 0
      }
      newProb[i] = (sum + c) / max_Y
    }
    this.prob = newProb
    this.value_start -= rate_decay_max
    this.value_end -= rate_decay_min
  }
}

class Predictor {
  constructor(prices, first_buy, previous_pattern) {
    this.fudge_factor = 0
    this.prices = prices
    this.first_buy = first_buy
    this.previous_pattern = previous_pattern
  }

  intceil(val) {
    return Math.trunc(val + 0.99999)
  }

  minimum_rate_from_given_and_base(given_price, buy_price) {
    return RATE_MULTIPLIER * (given_price - 0.99999) / buy_price
  }

  maximum_rate_from_given_and_base(given_price, buy_price) {
    return RATE_MULTIPLIER * (given_price + 0.00001) / buy_price
  }

  rate_range_from_given_and_base(given_price, buy_price) {
    return [
      this.minimum_rate_from_given_and_base(given_price, buy_price),
      this.maximum_rate_from_given_and_base(given_price, buy_price)
    ]
  }

  get_price(rate, basePrice) {
    return this.intceil(rate * basePrice / RATE_MULTIPLIER)
  }

  *multiply_generator_probability(generator, probability) {
    for (const it of generator) yield { ...it, probability: it.probability * probability }
  }

  generate_individual_random_price(given_prices, predicted_prices, start, length, rate_min, rate_max) {
    rate_min *= RATE_MULTIPLIER
    rate_max *= RATE_MULTIPLIER
    const buy_price = given_prices[0]
    const rate_range = [rate_min, rate_max]
    let prob = 1
    for (let i = start; i < start + length; i++) {
      let min_pred = this.get_price(rate_min, buy_price)
      let max_pred = this.get_price(rate_max, buy_price)
      if (!Number.isNaN(given_prices[i])) {
        if (given_prices[i] < min_pred - this.fudge_factor || given_prices[i] > max_pred + this.fudge_factor) return 0
        const real_rate_range = this.rate_range_from_given_and_base(clamp(given_prices[i], min_pred, max_pred), buy_price)
        prob *= range_intersect_length(rate_range, real_rate_range) / range_length(rate_range)
        min_pred = given_prices[i]
        max_pred = given_prices[i]
      }
      predicted_prices.push({ min: min_pred, max: max_pred })
    }
    return prob
  }

  generate_decreasing_random_price(given_prices, predicted_prices, start, length, start_rate_min, start_rate_max, rate_decay_min, rate_decay_max) {
    start_rate_min *= RATE_MULTIPLIER
    start_rate_max *= RATE_MULTIPLIER
    rate_decay_min *= RATE_MULTIPLIER
    rate_decay_max *= RATE_MULTIPLIER

    const buy_price = given_prices[0]
    let rate_pdf = new PDF(start_rate_min, start_rate_max)
    let prob = 1

    for (let i = start; i < start + length; i++) {
      const min_pred = this.get_price(rate_pdf.min_value(), buy_price)
      const max_pred = this.get_price(rate_pdf.max_value(), buy_price)
      if (!Number.isNaN(given_prices[i])) {
        if (given_prices[i] < min_pred - this.fudge_factor || given_prices[i] > max_pred + this.fudge_factor) return 0
        const real_rate_range = this.rate_range_from_given_and_base(clamp(given_prices[i], min_pred, max_pred), buy_price)
        prob *= rate_pdf.range_limit(real_rate_range)
        predicted_prices.push({ min: given_prices[i], max: given_prices[i] })
      } else {
        predicted_prices.push({ min: min_pred, max: max_pred })
      }
      rate_pdf.decay(rate_decay_min, rate_decay_max)
    }
    return prob
  }

  generate_peak_price(given_prices, predicted_prices, start, rate_min, rate_max) {
    rate_min *= RATE_MULTIPLIER
    rate_max *= RATE_MULTIPLIER
    const buy_price = given_prices[0]

    let min_pred = this.get_price(rate_min, buy_price)
    let max_pred = this.get_price(rate_max, buy_price)
    if (!Number.isNaN(given_prices[start])) {
      if (given_prices[start] < min_pred - this.fudge_factor || given_prices[start] > max_pred + this.fudge_factor) return 0
      const real_rate_range = this.rate_range_from_given_and_base(clamp(given_prices[start], min_pred, max_pred), buy_price)
      const prob = range_intersect_length([rate_min, rate_max], real_rate_range) / range_length([rate_min, rate_max])
      predicted_prices.push({ min: given_prices[start], max: given_prices[start] })
      return prob
    }

    // peak 是离散均匀分布（intceil），将 min/max 预估为闭区间
    predicted_prices.push({ min: min_pred, max: max_pred })
    return 1
  }

  *generate_pattern_0_with_lengths(given_prices, high_phase_1_len, dec_phase_1_len, high_phase_2_len, dec_phase_2_len, high_phase_3_len) {
    const predicted_prices = [{ min: given_prices[0], max: given_prices[0] }, { min: given_prices[1], max: given_prices[1] }]
    let probability = 1

    probability *= this.generate_individual_random_price(given_prices, predicted_prices, 2, high_phase_1_len, 0.9, 1.4)
    probability *= this.generate_decreasing_random_price(given_prices, predicted_prices, 2 + high_phase_1_len, dec_phase_1_len, 0.8, 0.9, 0.02, 0.05)
    probability *= this.generate_individual_random_price(given_prices, predicted_prices, 2 + high_phase_1_len + dec_phase_1_len, high_phase_2_len, 0.9, 1.4)
    probability *= this.generate_decreasing_random_price(given_prices, predicted_prices, 2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len, dec_phase_2_len, 0.8, 0.9, 0.02, 0.05)
    const prev_length = 2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len + dec_phase_2_len
    probability *= this.generate_individual_random_price(given_prices, predicted_prices, prev_length, 14 - prev_length, 0.9, 1.4)

    if (!probability) return
    yield { pattern_number: PATTERN.FLUCTUATING, prices: predicted_prices, probability }
  }

  *generate_pattern_0(given_prices) {
    for (let high_phase_1_len = 2; high_phase_1_len <= 3; high_phase_1_len++) {
      for (let dec_phase_1_len = 2; dec_phase_1_len <= 4; dec_phase_1_len++) {
        for (let high_phase_3_len = 2; high_phase_3_len <= 3; high_phase_3_len++) {
          const high_phase_2_len = 7 - high_phase_1_len - high_phase_3_len
          const dec_phase_2_len = 5 - dec_phase_1_len
          if (high_phase_2_len < 0 || dec_phase_2_len < 0) continue
          yield* this.generate_pattern_0_with_lengths(given_prices, high_phase_1_len, dec_phase_1_len, high_phase_2_len, dec_phase_2_len, high_phase_3_len)
        }
      }
    }
  }

  *generate_pattern_1_with_peak(given_prices, peak_start) {
    const predicted_prices = [{ min: given_prices[0], max: given_prices[0] }, { min: given_prices[1], max: given_prices[1] }]
    let probability = 1

    probability *= this.generate_decreasing_random_price(given_prices, predicted_prices, 2, peak_start - 2, 0.85, 0.9, 0.03, 0.05)
    if (!probability) return

    const min_randoms = [0.9, 1.4, 2.0, 1.4, 0.9]
    const max_randoms = [1.4, 2.0, 6.0, 2.0, 1.4]
    for (let i = peak_start; i < peak_start + 5; i++) {
      probability *= this.generate_individual_random_price(given_prices, predicted_prices, i, 1, min_randoms[i - peak_start], max_randoms[i - peak_start])
      if (!probability) return
    }

    probability *= this.generate_decreasing_random_price(given_prices, predicted_prices, peak_start + 5, 14 - (peak_start + 5), 0.4, 0.9, 0.03, 0.05)
    if (!probability) return
    yield { pattern_number: PATTERN.LARGE_SPIKE, prices: predicted_prices, probability }
  }

  *generate_pattern_1(given_prices) {
    for (let peak_start = 3; peak_start <= 9; peak_start++) {
      yield* this.multiply_generator_probability(this.generate_pattern_1_with_peak(given_prices, peak_start), 1 / (10 - 3))
    }
  }

  *generate_pattern_2(given_prices) {
    const predicted_prices = [{ min: given_prices[0], max: given_prices[0] }, { min: given_prices[1], max: given_prices[1] }]
    let probability = 1
    probability *= this.generate_decreasing_random_price(given_prices, predicted_prices, 2, 14 - 2, 0.85, 0.9, 0.03, 0.05)
    if (!probability) return
    yield { pattern_number: PATTERN.DECREASING, prices: predicted_prices, probability }
  }

  *generate_pattern_3_with_peak(given_prices, peak_start) {
    const predicted_prices = [{ min: given_prices[0], max: given_prices[0] }, { min: given_prices[1], max: given_prices[1] }]
    let probability = 1
    probability *= this.generate_decreasing_random_price(given_prices, predicted_prices, 2, peak_start - 2, 0.4, 0.9, 0.03, 0.05)
    if (!probability) return
    probability *= this.generate_individual_random_price(given_prices, predicted_prices, peak_start, 2, 0.9, 1.4)
    if (!probability) return
    probability *= this.generate_peak_price(given_prices, predicted_prices, peak_start + 2, 1.4, 2.0)
    if (!probability) return
    probability *= this.generate_individual_random_price(given_prices, predicted_prices, peak_start + 3, 2, 0.9, 1.4)
    if (!probability) return
    probability *= this.generate_decreasing_random_price(given_prices, predicted_prices, peak_start + 5, 14 - (peak_start + 5), 0.4, 0.9, 0.03, 0.05)
    if (!probability) return
    yield { pattern_number: PATTERN.SMALL_SPIKE, prices: predicted_prices, probability }
  }

  *generate_pattern_3(given_prices) {
    for (let peak_start = 2; peak_start <= 9; peak_start++) {
      yield* this.multiply_generator_probability(this.generate_pattern_3_with_peak(given_prices, peak_start), 1 / (10 - 2))
    }
  }

  *generate_all_patterns(given_prices, previous_pattern) {
    const previous = previous_pattern
    if (previous == null || previous === -1) {
      yield* this.multiply_generator_probability(this.generate_pattern_0(given_prices), 0.25)
      yield* this.multiply_generator_probability(this.generate_pattern_1(given_prices), 0.25)
      yield* this.multiply_generator_probability(this.generate_pattern_2(given_prices), 0.25)
      yield* this.multiply_generator_probability(this.generate_pattern_3(given_prices), 0.25)
      return
    }
    const weights = PROBABILITY_MATRIX[previous]
    if (!weights) return
    yield* this.multiply_generator_probability(this.generate_pattern_0(given_prices), weights[PATTERN.FLUCTUATING] || 0)
    yield* this.multiply_generator_probability(this.generate_pattern_1(given_prices), weights[PATTERN.LARGE_SPIKE] || 0)
    yield* this.multiply_generator_probability(this.generate_pattern_2(given_prices), weights[PATTERN.DECREASING] || 0)
    yield* this.multiply_generator_probability(this.generate_pattern_3(given_prices), weights[PATTERN.SMALL_SPIKE] || 0)
  }

  *generate_possibilities(sell_prices, first_buy, previous_pattern) {
    if (Number.isNaN(sell_prices[0]) || Number.isNaN(sell_prices[1])) return
    if (sell_prices[0] !== sell_prices[1]) return
    if (sell_prices[0] < 90 || sell_prices[0] > 110) return
    yield* this.generate_all_patterns(sell_prices, previous_pattern)
  }

  analyze_possibilities() {
    const sell_prices = this.prices
    const first_buy = this.first_buy
    const previous_pattern = this.previous_pattern
    let generated_possibilities = []
    for (let i = 0; i < 6; i++) {
      this.fudge_factor = i
      generated_possibilities = Array.from(this.generate_possibilities(sell_prices, first_buy, previous_pattern))
      if (generated_possibilities.length > 0) break
    }

    const total_probability = generated_possibilities.reduce((acc, it) => acc + it.probability, 0)
    for (const it of generated_possibilities) it.probability /= total_probability || 1

    // 全局 min/max（与原项目一致，在头部塞一个 pattern_number=4 的聚合项）
    const global_min_max = []
    for (let day = 0; day < 14; day++) {
      const prices = { min: 999, max: 0 }
      for (const poss of generated_possibilities) {
        if (poss.prices[day].min < prices.min) prices.min = poss.prices[day].min
        if (poss.prices[day].max > prices.max) prices.max = poss.prices[day].max
      }
      global_min_max.push(prices)
    }

    generated_possibilities.unshift({ pattern_number: 4, prices: global_min_max, probability: 0 })
    return generated_possibilities
  }
}

export const TURNIP_PATTERNS = PATTERN

/**
 * Turnip Prophet 风格分析入口
 * @param {{ prices14: number[], previousPattern?: number|null }} args
 * - prices14: 长度 14 的数组，[buy,buy, mon_am..sat_pm]，未知用 NaN
 */
export function analyzeTurnipPossibilities({ prices14, previousPattern = null }) {
  const predictor = new Predictor(prices14, false, previousPattern == null ? -1 : previousPattern)
  return predictor.analyze_possibilities()
}


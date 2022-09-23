const maxDailyCardMealAllowance = 7.63
const maxDailyCashMealAllowance = 4.67
const taxes = require(`../data/2022/taxes.json`)

module.exports = function calculate(data) {
  let results = {}

  const {personal, categoryA} = data
  if (!personal || !categoryA) { data.results = {}; return data }

  results.yearly = {}
  results.yearly.incomes = {}
  results.yearly.incomes.gross = 0
  results.yearly.incomes.irs = 0
  results.yearly.incomes.ss = 0
  results.yearly.incomes.exempt = 0

  categoryA?.monthly?.incomes?.forEach(income => {
    results.yearly.incomes.gross += (income?.months * income?.value)
    if (income?.irs) {
      results.yearly.incomes.irs += (income?.months * income?.value)
    }
    if (income?.ss) {
      results.yearly.incomes.ss += (income?.months * income?.value)
    }
    if (!income?.irs && !income?.ss) {
      results.yearly.incomes.exempt += (income?.months * income?.value)
    }
  })

  // calculate meal allowances
  results.yearly.mealAllowances = {}
  results.yearly.mealAllowances.gross = 0
  results.yearly.mealAllowances.taxable = 0
  results.yearly.mealAllowances.exempt = 0

  categoryA?.monthly?.mealAllowances?.forEach(mealAllowance => {
    results.yearly.mealAllowances.gross += mealAllowance?.value * mealAllowance?.days * mealAllowance?.months
    if (mealAllowance?.type === "card") {

      if (mealAllowance?.value >= maxDailyCardMealAllowance) {
        const taxableDailyMealAllowance = mealAllowance?.value - maxDailyCardMealAllowance
        results.yearly.mealAllowances.taxable += (taxableDailyMealAllowance * mealAllowance?.days * mealAllowance?.months)
        results.yearly.mealAllowances.exempt += (maxDailyCardMealAllowance * mealAllowance?.days * mealAllowance?.months)
      } else {
        results.yearly.mealAllowances.taxable += 0
        results.yearly.mealAllowances.exempt += mealAllowance?.value * mealAllowance?.days * mealAllowance?.months
      }

    } else if (mealAllowance?.type === "cash") {

      if (mealAllowance?.value >= maxDailyCashMealAllowance) {
        const taxableDailyMealAllowance = mealAllowance?.value - maxDailyCashMealAllowance
        results.yearly.mealAllowances.taxable += taxableDailyMealAllowance * mealAllowance?.days * mealAllowance?.months
        results.yearly.mealAllowances.exempt += maxDailyCashMealAllowance * mealAllowance?.days * mealAllowance?.months
      } else {
        results.yearly.mealAllowances.taxable += 0
        results.yearly.mealAllowances.exempt += mealAllowance?.value * mealAllowance?.days * mealAllowance?.months
      }

    } else {
      results.yearly.mealAllowances.taxable += 0
      results.yearly.mealAllowances.exempt += 0
    }
  })

  // calculate combined
  results.yearly.gross = {}
  results.yearly.gross.irs = results.yearly.incomes.irs + results.yearly.mealAllowances.taxable
  results.yearly.gross.ss = results.yearly.incomes.ss
  results.yearly.gross.exempt = results.yearly.incomes.exempt + results.yearly.mealAllowances.exempt

  // calculate irs
  const taxBracket = taxes?.taxBrackets?.find(tb => tb.location === personal.location
    && tb.status === personal.status
    && tb.disabled === personal.disabled)

  const taxBracketEntry = taxBracket?.entries?.find(tb => tb.maxValue >= (results.yearly.gross.irs / 14))
  const taxBracketEntryRate = taxBracketEntry?.values[personal?.dependents]

  results.yearly.irs = {}
  results.yearly.irs.estimate = {}
  results.yearly.irs.estimate.rate = taxBracketEntryRate || 0
  results.yearly.irs.estimate.value = taxBracketEntryRate * results.yearly.gross.irs || 0

  // calculate ss
  results.yearly.ss = {}
  results.yearly.ss.rate = 0.11
  results.yearly.ss.value = results.yearly.incomes.ss * results.yearly.ss.rate

  // calculate net
  results.yearly.net = {}
  results.yearly.net.value = results.yearly.incomes.gross
    + results.yearly.mealAllowances.taxable
    + results.yearly.mealAllowances.exempt
    - results.yearly.ss.value
    - results.yearly.irs.estimate.value

  //calculate costs
  results.yearly.costs = {}
  results.yearly.costs.incomes = results.yearly.incomes.gross
  results.yearly.costs.ss = results.yearly.gross.ss * 0.2375
  results.yearly.costs.meals = results.yearly.mealAllowances.taxable + results.yearly.mealAllowances.exempt
  results.yearly.costs.total = results.yearly.costs.incomes + results.yearly.costs.ss + results.yearly.costs.meals

  //incorporate results into data
  data.results = results
  return data
}


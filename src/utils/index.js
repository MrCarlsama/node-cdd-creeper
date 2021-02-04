const chalk = require('chalk')

/**
 * 打印交互确认信息
 * @param {string} info 
 */
const confirm = info => {
  console.log(chalk.yellow("#######"))
  console.log(chalk.yellow("#### "))
  console.log(chalk.yellow(`###  ${info}`))
  console.log(chalk.yellow("#### "))
  console.log(chalk.yellow("###########"))
}

/**
 * 打印一般日志信息
 * @param {string} info 
 */
const info = info => {
  console.log(chalk.green(`######【${info}】######`))
}

/**
 * 打印成功日志信息
 * @param {string} info 
 */
const success = info => {
  console.log(chalk.green("#######"))
  console.log(chalk.green("#### "))
  console.log(chalk.green(`###  ${info}`))
  console.log(chalk.green("#### "))
  console.log(chalk.green("###########"))
}


/**
 * 打印错误日志信息
 * @param {string} info 
 */
const error = info => {
  console.log(chalk.red(`//////【${info}】//////`))
}

const log = {
  confirm,
  info,
  success,
  error
}

module.exports = log
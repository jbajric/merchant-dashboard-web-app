// Generated by Selenium IDE
const { Builder, By, Key, until } = require('selenium-webdriver')
const assert = require('assert')

describe('Show diagram test', function() {
  this.timeout(30000)
  let driver
  let vars
  beforeEach(async function() {
    driver = await new Builder().forBrowser('chrome').build()
    vars = {}
  })
  afterEach(async function() {
    await driver.quit();
  })
  it('Show diagram test', async function() {
    await driver.get("https://merchant-dashboard.herokuapp.com/")
    await driver.manage().window().setRect(1366, 768)
    await driver.findElement(By.id("normal_login_username")).click()
    await driver.findElement(By.id("normal_login_username")).sendKeys("merchant")
    await driver.findElement(By.id("forma")).click()
    await driver.findElement(By.css(".ant-input-password")).click()
    await driver.findElement(By.id("normal_login_password")).sendKeys("nova")
    await driver.findElement(By.css(".ant-btn")).click()
    await driver.wait(until.elementLocated(By.id("imeKorisnika")), 30000)
    await driver.findElement(By.linkText("Statistics")).click()
    await driver.findElement(By.id("rangePickerStatistics")).click()
    await driver.findElement(By.css(".ant-picker-panel:nth-child(1) .ant-picker-prev-icon")).click()
    await driver.findElement(By.css("tr:nth-child(1) > .ant-picker-cell-in-view:nth-child(4) > .ant-picker-cell-inner")).click()
    await driver.findElement(By.css(".ant-picker-input-active > input")).sendKeys("15.05.2020")
    await driver.findElement(By.css(".ant-picker-input-active > input")).sendKeys(Key.ENTER)
    await driver.findElement(By.id("rc_select_2")).click()
    await driver.findElement(By.id("rc_select_2")).sendKeys("gavr")
    await driver.findElement(By.id("rc_select_2")).sendKeys(Key.ENTER)
    await driver.wait(until.elementLocated(By.css(".chartjs-render-monitor")), 30000)
    {
      const elements = await driver.findElements(By.css(".chartjs-render-monitor"))
      assert(elements.length)
    }
    await driver.close()
  })
})

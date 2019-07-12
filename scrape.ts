// const axios = require('axios')
// const HTMLParser = require('node-html-parser')

// const getCategoryPaths = async (): Promise<string[]> => {
//   const response = await axios.get('https://finance.yahoo.com/industries')
//   const root = await HTMLParser.parse(response.data)
//   return await root.map((element: any) => element.attributes.href)
// }

// const getSymbolsFromCategory = async (
//   categoryPaths: any[]
//   // ): Promise<string[]> => {
// ): Promise<void> => {
//   console.log(categoryPaths)
//   // return await categoryPaths.map(async path => {
//   //   const html = await axios.get(`https://finance.yahoo.com/${path}`)
//   //   const root = HTMLParser.parse(html)
//   //   return root.querySelectorAll('#scr-res-table tr a')
//   // })
// }
// ;(async () => {
//   const paths = await categoryPaths()
//   console.log(paths)
//   const symbols = await getSymbolsFromCategory(paths)
//   console.log(symbols)
// })()

const launchChrome = require('@serverless-chrome/lambda')
const CDP = require('chrome-remote-interface')
const puppeteer = require('puppeteer')

exports.execute = async () => {
  let slsChrome: any
  let browser: any
  let page: any
  let result = []

  try {
    slsChrome = await launchChrome({
      flags: [
        // '--headless', //
        '--ignore-certificate-errors',
      ],
    })

    browser = await puppeteer.connect({
      browserWSEndpoint: (await CDP.Version()).webSocketDebuggerUrl,
    })

    page = await browser.newPage()
    await page.goto('https://finance.yahoo.com/industries')

    const categoryPaths = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll('#YDC-SecondaryNav ul li a')
      ).map((element: any) => element.href)
    })

    categoryPaths.map(async path => {
      const html = await page.goto(`https://finance.yahoo.com/${path}`)
      const symbols = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll('#fin-scr-res-table tr a')
        ).map((element: any) => element.innerHTML)
      })

      result.push(symbols)
    })
  } catch (e) {
    console.error(e)
    return e
  } finally {
    if (page) {
      await page.close()
    }

    if (browser) {
      await browser.disconnect()
    }

    if (slsChrome) {
      await slsChrome.kill()
    }
    return result
  }
}

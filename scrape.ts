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
  let result: any = []

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
    await page.goto('https://finance.yahoo.com/industries', {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForSelector('#YDC-SecondaryNav ul li a')

    const categoryPaths: string[] = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll('#YDC-SecondaryNav ul li a')
      ).map((element: any) => element.href)
    })

    await page.waitFor(5000) // 1秒待つ
    let getSymbolsPromise: any[] = []
    categoryPaths.forEach(path => {
      getSymbolsPromise.push(async () => {
        const page = await browser.newPage()
        const html = await page.goto(path, { waitUntil: 'domcontentloaded' })

        await page.waitForSelector('#fin-scr-res-table tr a')

        const symbols = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll('#fin-scr-res-table tr a')
          ).map((element: any) => element.innerHTML)
        })
        result = [result, ...symbols]
        // await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
        await page.close()
      })
    })

    await page.close()
    await getSymbolsPromise.reduce(
      (prev, current) => prev.then(current),
      Promise.resolve()
    )

    if (browser) {
      await browser.disconnect()
    }

    if (slsChrome) {
      await slsChrome.kill()
    }

    console.log(result)
    return result
  } catch (e) {
    console.error(e)
    process.exit(1)
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

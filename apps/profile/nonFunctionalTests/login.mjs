import puppeteer from 'puppeteer';



export async function loginRandomcitizen (loginURL, page, useMyGoveId) {
  
    await page.goto(loginURL, { waitUntil: 'networkidle0' })

    // Login via MygovId

    if (useMyGoveId)
    {
        // Select MyGovID

        await page.evaluate(() => {
            document.querySelector('#app > div > div > main > div.vJ4aC_wrapper > div._8edF5_socialLinkList.MuJK2_main > button:nth-child(1) > div').click()
        })

        await page.waitForNavigation()

        await page.type('#login-form > div > div:nth-child(9) > input', '123')
        await page.evaluate(() => {
            document.querySelector('#submit_btn').click()
        })

        await page.waitForNavigation()

    } 
    else
    {
        // Select MyGovID

        await page.evaluate(() => {
            document.querySelector('#app > div > div > main > div.vJ4aC_wrapper > div._8edF5_socialLinkList.MuJK2_main > button:nth-child(2) > div').click()
        })

        await page.waitForNavigation()

        //TODO sort out EntraID login
    }
}

export async function loginSpecificUser (loginURL, user, page, useMyGoveId) {
  
    await page.goto(loginURL, { waitUntil: 'networkidle0' })

    // Login via MygovId

    if (useMyGoveId)
    {
        // Select MyGovID

        await page.evaluate(() => {
            document.querySelector('#app > div > div > main > div.vJ4aC_wrapper > div._8edF5_socialLinkList.MuJK2_main > button:nth-child(1) > div').click()
        })

        await page.waitForNavigation()

        await page.select('#user_select', user)
        await page.type('#login-form > div > div:nth-child(9) > input', '123')
        await page.evaluate(() => {
            document.querySelector('#submit_btn').click()
        })

        await page.waitForNavigation()
    } 
    else
    {
        // Select MyGovID

        await page.evaluate(() => {
            document.querySelector('#app > div > div > main > div.vJ4aC_wrapper > div._8edF5_socialLinkList.MuJK2_main > button:nth-child(2) > div').click()
        })

        await page.waitForNavigation()

        //TODO sort out EntraID login
    }
}
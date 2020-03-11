const puppeteer = require('puppeteer');
const json2csv = require('json2csv');
const fs = require('fs');

async function getBiSubByKeyword(keyword) {
    let video_list = [];
    const browser = await puppeteer.launch({
        // slowMo: 100,    //slow
        headless: true,
        // defaultViewport: {width: 1440, height: 780},
        ignoreHTTPSErrors: false, //忽略 https 阻断
        args: ['--proxy-server='] //cancel proxy
    });
    const page = await browser.newPage();
    await page.goto(`https://search.bilibili.com/all?keyword=${keyword}&page=1`);
    // await page.waitForXPath("//*[@id=\"all-list\"]/div[1]/div[3]/div/ul/li");
    let pager = await page.$x(`//*[@id="all-list"]/div[1]/div[3]/div/ul/li`);
    let pageLen = pager.length - 1;
    for (let j = 0;j < pageLen;j++) {
        // await page.close();
        // let page = await browser.newPage();
        let page_url = `https://search.bilibili.com/all?keyword=${keyword}&page=${j+1}`;
        await page.goto(page_url);
        // await page.waitForXPath("//*[@id=\"all-list\"]/div[1]/div[3]/div/ul/li");
        let titleList = await page.$x(`//*[@id="all-list"]/div[1]//ul/li[*]/div/div[1]/a[@title]`);
        for (let i = 0;i < (await titleList.length);i++) {
            let video_info = {
                'title': null,
                'watch_num': null,
                'fly_num': null,
                'up_name': null,
                'upload_time': null,
                'video_duration': null
            };
            let titleDom = await titleList[i].$x(`@title`);
            video_info.title = await page.evaluate(result => result.textContent, titleDom[0]);
            let watch_numDom = await titleList[i].$x(`../../div[@class='tags']/span[@class='so-icon watch-num']`);
            video_info.watch_num = await page.evaluate(result => result.textContent, watch_numDom[0]);
            let fly_numDom = await titleList[i].$x(`../../div[@class='tags']/span[@class='so-icon hide']`);
            video_info.fly_num = await page.evaluate(result => result.textContent, fly_numDom[0]);
            let up_nameDom = await titleList[i].$x(`../../div[@class='tags']/span[@class='so-icon']`);
            video_info.up_name = await page.evaluate(result => result.textContent, up_nameDom[0]);
            let upload_timeDom = await titleList[i].$x(`../../div[@class='tags']/span[@class='so-icon time']`);
            video_info.upload_time = await page.evaluate(result => result.textContent, upload_timeDom[0]);
            let video_durationDom = await titleList[i].$x(`../../..//span[@class='so-imgTag_rb']`);
            video_info.video_duration = await page.evaluate(result => result.textContent, video_durationDom[0]);
            console.log(video_info);
            video_list.push(video_info);
        }
    }
    await browser.close();
    return {'key': keyword, 'video_list': video_list};
}

getBiSubByKeyword('powerbi').then(function(r) {
    console.log(json2csv.parse(r.video_list));
    fs.writeFile('files/bilibili-' + r.key + '.csv', '\ufeff' + json2csv.parse(r.video_list),'utf8',function(err){
        if(err) {
            console.log('写文件出错了，错误是：'+err);
        }
    });
});

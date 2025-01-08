import { loadPage } from '@axe-core/puppeteer';
import fs from 'fs'
import { createHtmlReport } from 'axe-html-reporter';



export async function runA11yForURL (browser, pageURL, opts, reportNameForFile) {
  
    const axeBuilder = await loadPage(
      browser,
      pageURL,
      opts
    );
    const results = await axeBuilder.analyze();
  
    const reportHTML = createHtmlReport({
      results: results,
      options: {
          projectKey: 'I need only raw HTML',
          doNotCreateReportFile: true,
      },
  });

  fs.writeFile('test_reports/a11y/' + reportNameForFile + '-a11y.html', reportHTML, (err) => {
    if (err) {
    }
  })
}
  
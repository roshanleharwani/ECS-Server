
const puppeteer = require('puppeteer')
const path = require('path')

exports.generate = async (req, res) => {
    let browser;
    try {
        // Launch browser explicitly in headless mode with a timeout
        browser = await puppeteer.launch();

        const page = await browser.newPage();

        // Set a timeout for navigation
        await page.goto(`${req.protocol}://${req.get('host')}/report`, {
            waitUntil: 'networkidle2',
        });

        await page.setViewport({ width: 1680, height: 1050 });

        // Generate the PDF file path
        const filePath = path.join(__dirname, '../public/files/', `${new Date().getTime()}.pdf`);

        // Generate the PDF
        const pdf = await page.pdf({
            path: filePath,
            printBackground: true,
            format: 'A4'
        });

        await browser.close();

        // Set response headers for PDF file
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdf.length
        });

        // Send the generated PDF file
        res.sendFile(filePath);

    } catch (error) {
        console.log(error.message);
        if (browser) {
            await browser.close(); // Ensure browser is closed in case of error
        }
        res.status(500).send('Error generating PDF');
    }
};


exports.scraper = async (topic)=> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
  
    // Construct the search URL
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(topic)}`;
  
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 0 });
  
    
    const searchResults = await page.evaluate(() => {
      const results = [];
        const searchResultElements = document.querySelectorAll('div.g h3');
  
      let count = 0;
      for (const titleElement of searchResultElements) {
        const linkElement = titleElement.closest('a');
  
        if (linkElement && titleElement) {
          const url = linkElement.href;
          const title = titleElement.innerText;
  
          if (url && title) {
            results.push({ uri: url, title: title });
            count++;
          }
  
          if (count >= 2) break;
        }
      }
      return results;
    });
  
    
    await browser.close();
  
    return searchResults;
  }
  
  // Usage example
//   fetchTopGoogleSearchResults('bru gold health impacts ').then(searchResults => {
//     console.log(searchResults);
//   });
  
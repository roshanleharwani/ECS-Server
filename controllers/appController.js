const axios = require('axios')
const { Groq } = require('groq-sdk'); 
const fs = require('node:fs')
const puppeteer = require('puppeteer')
const path = require('path')
const QRCode = require('qrcode');
const bodyParser = require('body-parser');

exports.generate = async (req, res) => {
  const barcode = req.params.barcode;
  const filePath = path.join(__dirname, '../public/files/', `${barcode}.pdf`); // Absolute path

  // If the PDF already exists, return it
  if (fs.existsSync(filePath)) {
      res.set({
          'Content-Type': 'application/pdf',
          'Content-Length': fs.statSync(filePath).size
      });
      return res.sendFile(filePath);
  }

  let browser;
  try {
      // Step 1: Request the report to ensure it's generated successfully
      const reportUrl = `${req.protocol}://${req.get('host')}/report/${barcode}`;
      const reportResponse = await axios.get(reportUrl);

      // If the report request fails or returns an error status, abort PDF generation
      if (reportResponse.status !== 200) {
          return res.status(500).send('Error generating report, PDF not created.');
      }

      // Step 2: Proceed with generating the PDF
      browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto(reportUrl, {
          waitUntil: 'networkidle2',
      });
      await page.setViewport({ width: 1680, height: 1050 });

      // Generate the PDF
      await page.pdf({
          path: filePath,
          printBackground: true,
          format: 'A4',
      });

      await browser.close();

      // Set response headers for PDF file and send it
      res.set({
          'Content-Type': 'application/pdf',
          'Content-Length': fs.statSync(filePath).size,
      });
      res.sendFile(filePath);

  } catch (error) {
      console.error('Error during PDF generation:', error.message);

      if (browser) {
          await browser.close(); // Ensure browser is closed in case of error
      }

      res.status(500).send('Error generating PDF');
  }
};
    
    
    scraper = async (topic)=> {
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

exports.report = async (req, res) => {
    const barcode = 	req.params.barcode;
    const uri = `https://world.openfoodfacts.org/api/v1/product/${barcode}.json`;
  
    async function getProductData() {
      try {
        const response = await axios.get(uri);
        const data = response.data;
  
        const groq = new Groq({
          apiKey: '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',
          // apiKey: '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',
          
        });
  
        const template = `{
            "productCategory": [2-3 categories],
            "productInterestingFacts": [2-3 each fact of min 10 words],
            "scoresOutOf100": {
              "healthScore": score,
              "intermediateRiskScore": score,
              "longTermRiskScore": score
            },
            "ingredients": [
              {
                "ingredient1": {
                  "description": "briefDescription of min 10 words",
                  "effects": [2-3 long term effects]
                }
              }
            ],
            "healthRecommendations": [3-4 health recommendations],
            "betterProductAlternatives": [3-4 alternatives with respect to indian perspective  of same category
              {
                "alternativeName": {
                  "briefBenefit": "briefBenefitDescription"
                }
              }
            ]
          }`;
  
        const productName = data['product']['product_name'];
        const prompt = `You are a Nutrition expert. Provide a JSON response only, following this format: ${template}. Include all ingredients with health impacts. If ingredients are encoded, give their full names. Use the product name ${productName} and ingredients from ${data['product']['ingredients_text']}.`
        // console.log(prompt)
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: 'llama-3.1-70b-versatile',
          // max_tokens: 8000,
          // response_format: {"type": "json_object"}
          // temperature:0.5
        });
  
        const jsonObj = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
        return { name: productName, data: jsonObj };
      } catch (error) {
        console.error('Error fetching data or completing chat:', error);
        return null;
      }
    }
  
    
    const data = await getProductData(); // Add 'await' here
  
    
    if (!data) {
      return res.status(500).render('error',{barcode:barcode});
    }
    const references = await scraper(data.name + 'health Impacts')
  
    res.render('report', { data: data,references:references });
  }

  exports.wifi = async (req,res)=>{

    return res.render('qr')

  }

  exports.wifiqr = (req,res)=>{

      const {ssid,pass} = req.body;

      const data = `${ssid}|${pass}`

      QRCode.toDataURL(data, (err, url) => {
        if (err) {
          res.status(500).send('Error generating QR code');
        } else {

          return res.render('wifiqr',{url:url})

         
        }
      });



  } 
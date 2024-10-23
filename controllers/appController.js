const axios = require('axios')
const { Groq } = require('groq-sdk'); 
const fs = require('node:fs')
const puppeteer = require('puppeteer')
const path = require('path');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');


// Function to handle report generation
exports.report = async (req, res) => {
  const barcode = req.params.barcode;
  
  try {
    // Step 1: Check if barcode data exists in file
    let cache = readCacheFile();
    
    if (cache[barcode]) {
      // Barcode data exists, render the report
      console.log('Cache hit for barcode:', barcode);
      const references = await scraper(cache[barcode].productName + ' health Impacts');
      return res.render('report', { data: cache[barcode], references });
    }
    const uri = `https://world.openfoodfacts.org/api/v1/product/${barcode}.json`;

      // Step 2: Fetch product data from the API if not cached
      console.log('Cache miss for barcode:', barcode);
      const response = await axios.get(uri);
      const productData = response.data;

      // Check if product data is valid
      if (!productData || !productData.product) {
          throw new Error('Product data is missing or invalid');
      }

      // Prepare the Groq prompt
      const groq = new Groq({
          apiKey: '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',
      });

      const template = `{
          "productCategory": [2-3 categories],
          "productInterestingFacts": [2-3 each fact of min 10 words],
          "consumptionIndicator": [if safe give 0 else if concern give 90 else if avoid give 180],
          "ingredients": [
            {
              "ingredient1": {
                "description": "briefDescription of min 10 words",
                "effects": [2-3 long term effects]
              }
            }
          ],
          "healthRecommendations": [3-4 health recommendations],
          "betterProductAlternatives": [3-4 alternatives with respect to indian perspective of same category
            {
              "alternativeName": {
                "briefBenefit": "briefBenefitDescription"
              }
            }
          ]
      }`;

      const productName = productData['product']['product_name'];  // Use productData here
      const prompt = `You are a Nutrition expert. Provide a JSON response only, following this format: ${template}. Include all ingredients with health impacts. If ingredients are encoded, give their full names. Use the product name ${productName} and ingredients from ${productData['product']['ingredients_text']}.`;

      const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.1-70b-versatile',
      });

      const productDetails = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');

      // Step 3: Cache the fetched product data in the file
      cache[barcode] = { productName, data: productDetails };
      writeCacheFile(cache);  // Persist updated cache to file

      // Render the report
      const references = await scraper(productName + ' health Impacts');
      res.render('report', { data: productDetails, references });

  } catch (error) {
      console.error('Error generating report:', error); // Log the error object
      res.status(500).render('error',{barcode:barcode});
  }
};

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
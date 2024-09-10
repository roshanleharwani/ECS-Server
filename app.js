const express = require('express')
const path = require('path')
const app = express()
const controller = require('./controllers/appController')
const axios = require('axios')
const { Groq } = require('groq-sdk'); 
const { name } = require('ejs')


app.set('view engine','ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")))


app.get('/',(req,res)=>{
    res.send("Server is Running")
})


app.get('/report', async (req, res) => {
  const barcode = 	5449000000996;
  const uri = `https://world.openfoodfacts.org/api/v1/product/${barcode}.json`;

  async function getProductData() {
    try {
      const response = await axios.get(uri);
      const data = response.data;

      const groq = new Groq({
        // apiKey: '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',
        apiKey: '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',
        
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
                "effects": [2-3 harmful effects]
              }
            }
          ],
          "healthRecommendations": [3-4 health recommendations],
          "betterProductAlternatives": [3-4 alternatives with respect to Indian region 
            {
              "alternativeName": {
                "briefBenefit": "briefBenefitDescription"
              }
            }
          ]
        }`;

      const productName = data['product']['product_name'];
      const prompt = `You are a Nutrition expert. Provide a JSON response only, following this format: ${template}. Include ingredients with health impacts, excluding common ones like salt or water. If ingredients are encoded, give their full names. Use the product name ${productName} and ingredients from ${data['product']['ingredients_text']}.`

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.1-70b-versatile',
        max_tokens: 8000,
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
    return res.status(500).render('error');
  }
  const references = await controller.scraper(data.name + 'health Impacts')

  res.render('report', { data: data,references:references }); // Now you have 'data' properly fetched
});

app.get('/reportGenerate',controller.generate)

app.listen(3000)



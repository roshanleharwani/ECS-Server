const Groq = require('groq-sdk')
const axios = require('axios')

async function getProductData(){
    try{
        const barcode = 5449000000996;
        const uri = `https://0091.openfoodfacts.org/api/v1/product/${barcode}.json`;
        const response =  await axios.get(uri)
        const data = response.data

        const groq = new Groq({ apiKey:'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' });

       

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
        
          const productName = data['product']['brands'] + " " + data['product']['product_name'];
          const prompt = `You are a Nutrition expert. I want you to provide a JSON response in this exact format **dont give any other text only json response**, based on the product ingredients mandatorily cover each ingredient I provide. If there are any encoded ingredients, give their complete name. The format is: ${template} product name: ${productName} ingredients: ${data['product']['ingredients_text']}`;
        
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            model: "llama-3.1-70b-versatile",
            max_tokens: 8000,
            response_format: { type: "json_object" }
          });

          const jsonObj = JSON.parse(chatCompletion.choices[0]?.message?.content || "");
          console.log(JSON.stringify(jsonObj, null, 2));

    }catch(e){
        console.log(e.message)
    }


}

getProductData()
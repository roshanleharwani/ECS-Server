const express = require('express')
const path = require('path')
const app = express()
const controller = require('./controllers/appController')
const axios = require('axios')
const { Groq } = require('groq-sdk'); 


app.set('view engine','ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")))


app.get('/',(req,res)=>{
    res.send("Server is Running")
})


app.get('/report/:barcode',controller.report )

app.get('/reportGenerate/:barcode',controller.generate)

app.listen(3000)


